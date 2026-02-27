import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Find a shop that needs a token refresh
        // Etsy tokens expire in 3600 seconds. We refresh if expires_at is in the next 10 mins.
        const now = new Date();
        const tenMinsFromNow = new Date(now.getTime() + 10 * 60 * 1000);

        const { data: shops, error: fetchError } = await supabaseAdmin
            .from('shops')
            .select('*')
            .lt('token_expires_at', tenMinsFromNow.toISOString())
            .limit(5);

        if (fetchError) throw fetchError;
        if (!shops || shops.length === 0) {
            return new Response(JSON.stringify({ message: 'No tokens need refreshing' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const results = [];

        for (const shop of shops) {
            try {
                const tokenResponse = await fetch('https://api.etsy.com/v3/public/oauth/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        grant_type: 'refresh_token',
                        client_id: Deno.env.get('ETSY_API_KEY') || '',
                        refresh_token: shop.refresh_token,
                    }),
                });

                if (!tokenResponse.ok) {
                    const errText = await tokenResponse.text();
                    throw new Error(`Failed to refresh for shop ${shop.id}: ${errText}`);
                }

                const tokenData = await tokenResponse.json();
                const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

                await supabaseAdmin
                    .from('shops')
                    .update({
                        access_token: tokenData.access_token,
                        refresh_token: tokenData.refresh_token,
                        token_expires_at: expiresAt,
                    })
                    .eq('id', shop.id);

                results.push({ id: shop.id, status: 'refreshed' });
            } catch (e) {
                results.push({ id: shop.id, status: 'failed', error: e.message });
            }
        }

        return new Response(JSON.stringify({ results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
})
