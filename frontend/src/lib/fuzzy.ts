import Fuse from 'fuse.js';

export function getTitleSimilarity(titleA: string, titleB: string): number {
    // Normalize: lowercase, remove punctuation
    const normalize = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    const a = normalize(titleA);
    const b = normalize(titleB);

    // Fuse.js match — score is 0 (perfect) to 1 (no match), invert it
    const fuse = new Fuse([{ title: b }], {
        includeScore: true,
        threshold: 1.0,
        keys: ['title'],
    });

    const result = fuse.search(a);
    if (!result.length || result[0].score === undefined) return 0;

    return 1 - result[0].score;
}

// Thresholds to use when creating matches:
export const TITLE_THRESHOLDS = {
    LIKELY_COPY: 0.88,      // Red alert
    SUSPICIOUS: 0.72,       // Yellow alert
    IGNORE: 0.72,           // Below this: skip
};
