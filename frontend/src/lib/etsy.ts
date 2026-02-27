const ETSY_BASE = 'https://openapi.etsy.com/v3';

export async function etsyGet(
    endpoint: string,
    accessToken: string,
    params?: Record<string, string>
) {
    const url = new URL(`${ETSY_BASE}${endpoint}`);
    if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await fetch(url.toString(), {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-api-key': import.meta.env.VITE_ETSY_API_KEY || '',
        },
    });

    if (res.status === 401) throw new Error('ETSY_TOKEN_EXPIRED');
    if (res.status === 429) throw new Error('ETSY_RATE_LIMITED');
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`ETSY_ERROR_${res.status}: ${errorText}`);
    }

    return res.json();
}

/**
 * Fetch all active listings for a shop (handles pagination)
 */
export async function getShopListings(shopId: string, accessToken: string) {
    const listings = [];
    let offset = 0;
    const limit = 100;

    while (true) {
        const data = await etsyGet(
            `/application/shops/${shopId}/listings/active`,
            accessToken,
            { limit: String(limit), offset: String(offset) }
        );

        listings.push(...data.results);

        if (data.results.length < limit) break;
        offset += limit;

        // Respect rate limits: Etsy allows ~10 req/s. 150ms delay is safe.
        await new Promise(r => setTimeout(r, 150));
    }

    return listings;
}

/**
 * Search Etsy by keyword
 */
export async function searchListings(keywords: string, accessToken: string) {
    return etsyGet('/application/listings/active', accessToken, {
        keywords,
        limit: '100',
        sort_on: 'score',
    });
}
