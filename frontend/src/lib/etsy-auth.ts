/**
 * Etsy OAuth Helper (PKCE)
 */

function generateRandomString(length: number) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
}

async function sha256(plain: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(a: ArrayBuffer) {
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(a))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getEtsyAuthUrl() {
    const verifier = generateRandomString(48);
    const challengeBuffer = await sha256(verifier);
    const challenge = base64urlencode(challengeBuffer);

    // Store verifier for the callback
    localStorage.setItem('etsy_verifier', verifier);

    const state = generateRandomString(12);
    const scope = 'listings_r'; // Read-only listings
    const clientId = import.meta.env.VITE_ETSY_API_KEY;
    const redirectUri = import.meta.env.VITE_ETSY_REDIRECT_URI;

    const url = new URL('https://www.etsy.com/oauth/connect');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scope);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');

    return url.toString();
}
