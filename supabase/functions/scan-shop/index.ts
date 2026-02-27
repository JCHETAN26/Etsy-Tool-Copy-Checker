import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import sharp from 'npm:sharp'
import Fuse from 'npm:fuse.js'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- UTILS ---

async function computePHash(imageUrl: string): Promise<string | null> {
    try {
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();

        const pixels = await sharp(Buffer.from(buffer))
            .resize(8, 8, { fit: 'fill' })
            .grayscale()
            .raw()
            .toBuffer();

        const avg = pixels.reduce((sum, p) => sum + p, 0) / pixels.length;
        const hash = Array.from(pixels)
            .map(p => (p >= avg ? '1' : '0'))
            .join('');

        return hash;
    } catch (e) {
        console.error(`Hash error: ${e.message}`);
        return null;
    }
}

function imageSimilarity(hashA: string, hashB: string): number {
    let distance = 0;
    for (let i = 0; i < hashA.length; i++) {
        if (hashA[i] !== hashB[i]) distance++;
    }
    return 1 - distance / 64;
}

// --- MAIN SCAN LOGIC ---

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { shopId } = await req.json()
        if (!shopId) throw new Error('shopId is required')

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get shop and its listings
        const { data: shop } = await supabaseAdmin.from('shops').select('*').eq('id', shopId).single()
        const { data: listings } = await supabaseAdmin.from('listings').select('*').eq('shop_id', shopId)

        if (!shop || !listings) throw new Error('Shop or listings not found')

        // Start Log
        const { data: log } = await supabaseAdmin.from('scan_logs').insert({
            shop_id: shopId,
            status: 'running',
            listings_scanned: 0,
            matches_found: 0
        }).select().single()

        let totalMatches = 0

        for (const listing of listings) {
            // a. Extract keywords (top 3 words from title)
            const keywords = listing.title.split(' ').slice(0, 3).join(' ')

            // b. Search Etsy API
            const searchUrl = `https://openapi.etsy.com/v3/application/listings/active?keywords=${encodeURIComponent(keywords)}&limit=50`
            const searchRes = await fetch(searchUrl, {
                headers: {
                    'x-api-key': Deno.env.get('ETSY_API_KEY') || '',
                    'Authorization': `Bearer ${shop.access_token}`
                }
            })

            if (!searchRes.ok) continue
            const searchData = await searchRes.json()

            for (const result of searchData.results) {
                if (result.listing_id.toString() === listing.etsy_listing_id) continue

                // c. Fuzzy Title Match
                const fuse = new Fuse([{ title: result.title }], { includeScore: true, threshold: 0.5, keys: ['title'] })
                const matchResult = fuse.search(listing.title)
                const titleScore = matchResult.length ? 1 - matchResult[0].score : 0

                // d. Image Match (only if title is suspicious or exactly the same)
                let imgScore = 0
                if (titleScore > 0.7) {
                    const targetImg = result.primary_image?.url_fullfill || ''
                    if (targetImg && listing.image_url) {
                        const hashA = listing.image_hash || await computePHash(listing.image_url)
                        const hashB = await computePHash(targetImg)
                        if (hashA && hashB) {
                            imgScore = imageSimilarity(hashA, hashB)
                            // Update original listing with its hash if missing
                            if (!listing.image_hash) await supabaseAdmin.from('listings').update({ image_hash: hashA }).eq('id', listing.id)
                        }
                    }
                }

                // e. Create Match if threshold met
                if (titleScore > 0.85 || imgScore > 0.9) {
                    const { error: matchErr } = await supabaseAdmin.from('matches').upsert({
                        listing_id: listing.id,
                        shop_id: shopId,
                        suspected_etsy_listing_id: result.listing_id.toString(),
                        suspected_shop_name: 'Unknown Shop', // Need separate API call for detail
                        suspected_listing_url: result.url,
                        suspected_title: result.title,
                        suspected_image_url: result.primary_image?.url_fullfill || '',
                        match_type: titleScore > 0.8 && imgScore > 0.8 ? 'both' : titleScore > 0.8 ? 'title' : 'image',
                        title_similarity: titleScore,
                        image_similarity: imgScore,
                        status: 'new'
                    }, { onConflict: 'shop_id, suspected_etsy_listing_id' })

                    if (!matchErr) totalMatches++
                }
            }

            // Respect rate limits
            await new Promise(r => setTimeout(r, 200))
        }

        // Finalize Log
        await supabaseAdmin.from('scan_logs').update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            listings_scanned: listings.length,
            matches_found: totalMatches
        }).eq('id', log.id)

        // Update Shop last scan
        await supabaseAdmin.from('shops').update({ last_scan_at: new Date().toISOString() }).eq('id', shopId)

        return new Response(JSON.stringify({ success: true, matches_found: totalMatches }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
