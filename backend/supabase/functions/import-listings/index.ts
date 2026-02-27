import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { shopId } = await req.json()

        if (!shopId) throw new Error('shopId is required')

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get shop tokens
        const { data: shop, error: shopError } = await supabaseAdmin
            .from('shops')
            .select('*')
            .eq('id', shopId)
            .single()

        if (shopError || !shop) throw new Error('Shop not found')

        // 2. Fetch listings from Etsy
        let listings = []
        let offset = 0
        const limit = 100

        while (true) {
            const url = `https://openapi.etsy.com/v3/application/shops/${shop.etsy_shop_id}/listings/active?limit=${limit}&offset=${offset}`
            const res = await fetch(url, {
                headers: {
                    'x-api-key': Deno.env.get('ETSY_API_KEY') || '',
                    'Authorization': `Bearer ${shop.access_token}`
                }
            })

            if (!res.ok) {
                const err = await res.text()
                throw new Error(`Etsy API error: ${err}`)
            }

            const data = await res.json()
            listings.push(...data.results)

            if (data.results.length < limit) break
            offset += limit

            // Delay to respect rate limits
            await new Promise(r => setTimeout(r, 200))
        }

        // 3. Transform and Upsert into Supabase
        // Note: In a real app, we'd also fetch the images for each listing. 
        // For the MVP import, we'll store the basics.
        const listingsToInsert = listings.map(l => ({
            shop_id: shop.id,
            etsy_listing_id: l.listing_id.toString(),
            title: l.title,
            // For images, we usually need to call another endpoint or check if the active listing response includes it.
            // v3 listings/active often requires an 'includes' param or separate call for images.
            image_url: l.primary_image?.url_fullfill || '',
            tags: l.tags || [],
            updated_at: new Date().toISOString()
        }))

        // Upsert in batches of 100
        for (let i = 0; i < listingsToInsert.length; i += 100) {
            const batch = listingsToInsert.slice(i, i + 100)
            const { error: upsertError } = await supabaseAdmin
                .from('listings')
                .upsert(batch, { onConflict: 'shop_id, etsy_listing_id' })

            if (upsertError) throw upsertError
        }

        return new Response(JSON.stringify({
            success: true,
            count: listingsToInsert.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
