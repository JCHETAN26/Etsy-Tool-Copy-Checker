import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { code, verifier, userId } = await req.json()

        if (!code || !verifier || !userId) {
            throw new Error('Missing required parameters: code, verifier, or userId')
        }

        // 1. Exchange OAuth code for tokens
        const tokenResponse = await fetch('https://api.etsy.com/v3/public/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: Deno.env.get('ETSY_API_KEY') || '',
                redirect_uri: Deno.env.get('ETSY_REDIRECT_URI') || '',
                code,
                code_verifier: verifier,
            }),
        })

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text()
            throw new Error(`Failed to exchange token: ${errorData}`)
        }

        const tokenData = await tokenResponse.json()
        const { access_token, refresh_token, expires_in } = tokenData
        const etsy_user_id = tokenData.access_token.split('.')[0] // Etsy tokens often prefix with user_id

        // 2. Fetch Shop Details from Etsy
        // First we need the user's shop ID. Etsy API v3: GET /application/users/{user_id}/shops
        const shopResponse = await fetch(`https://openapi.etsy.com/v3/application/users/${etsy_user_id}/shops`, {
            headers: {
                'x-api-key': Deno.env.get('ETSY_API_KEY') || '',
                'Authorization': `Bearer ${access_token}`
            }
        })

        if (!shopResponse.ok) {
            throw new Error('Failed to fetch shop details from Etsy')
        }

        const shopData = await shopResponse.json()
        const shop = shopData // Etsy usually returns the shop directly if the user has one

        // 3. Store in Supabase
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

        const { data, error } = await supabaseAdmin
            .from('shops')
            .upsert({
                user_id: userId,
                etsy_shop_id: shop.shop_id.toString(),
                shop_name: shop.shop_name,
                access_token, // TO DO: Encrypt these in production
                refresh_token,
                token_expires_at: tokenExpiresAt,
                connected_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id, etsy_shop_id'
            })
            .select()

        if (error) throw error

        return new Response(JSON.stringify({ success: true, shop: data[0] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
