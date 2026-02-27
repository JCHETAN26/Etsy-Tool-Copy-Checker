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

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Not authenticated or invalid token' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        // 1. Create a fake shop
        const { data: shop, error: shopErr } = await supabaseAdmin.from('shops').upsert({
            user_id: user.id,
            etsy_shop_id: 'DEMO_123',
            shop_name: 'HealthyHome Decor (Demo)',
            connected_at: new Date().toISOString(),
            last_scan_at: new Date().toISOString()
        }).select().single()

        if (shopErr) throw shopErr

        // 2. Create a fake listing
        const { data: listing, error: listErr } = await supabaseAdmin.from('listings').upsert({
            shop_id: shop.id,
            etsy_listing_id: 'LIST_555',
            title: 'Minimalist Ceramic Vase - Matte White',
            image_url: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800',
        }).select().single()

        if (listErr) throw listErr

        // 3. Create fake matches
        const matchesToInsert = [
            {
                shop_id: shop.id,
                listing_id: listing.id,
                suspected_etsy_listing_id: 'COPY_999',
                suspected_shop_name: 'CheapImportsHQ',
                suspected_listing_url: 'https://etsy.com',
                suspected_title: 'Minimalist White Vase - Home Decor (Direct Factory)',
                suspected_image_url: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800',
                match_type: 'both',
                title_similarity: 0.94,
                image_similarity: 0.98,
                status: 'new'
            },
            {
                shop_id: shop.id,
                listing_id: listing.id,
                suspected_etsy_listing_id: 'COPY_888',
                suspected_shop_name: 'DuoDecorStore',
                suspected_listing_url: 'https://etsy.com',
                suspected_title: 'Handcrafted Matte White Vase - Minimalist Style',
                suspected_image_url: 'https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7?w=800',
                match_type: 'title',
                title_similarity: 0.82,
                image_similarity: 0.45,
                status: 'new'
            }
        ]

        const { error: matchErr } = await supabaseAdmin.from('matches').insert(matchesToInsert)

        if (matchErr) throw matchErr

        // 4. Create a fake scan log
        await supabaseAdmin.from('scan_logs').insert({
            shop_id: shop.id,
            status: 'completed',
            listings_scanned: 1,
            matches_found: 2,
            started_at: new Date(Date.now() - 3600000).toISOString(),
            completed_at: new Date().toISOString(),
        })

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
