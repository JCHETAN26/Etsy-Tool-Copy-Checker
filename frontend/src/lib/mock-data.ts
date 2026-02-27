export interface Match {
  id: string;
  type: "likely_copy" | "suspicious";
  similarity: { title: number; image: number };
  yourListing: { title: string; image: string };
  suspectedCopy: { title: string; image: string; shopName: string; listedDaysAgo: number; url: string };
  status: "new" | "reviewing" | "reported" | "resolved" | "dismissed";
  detectedAt: string;
}

export interface Listing {
  id: string;
  title: string;
  image: string;
  matchCount: number;
}

export interface Scan {
  date: string;
  listingsScanned: number;
  matchesFound: number;
  status: "completed" | "running" | "failed";
}

export const mockMatches: Match[] = [
  {
    id: "1042",
    type: "likely_copy",
    similarity: { title: 94, image: 97 },
    yourListing: { title: "Handmade Ceramic Mug — Speckled Glaze, 12oz", image: "/placeholder.svg" },
    suspectedCopy: { title: "Ceramic Handmade Mug Speckled Glaze 12 oz Coffee Cup", image: "/placeholder.svg", shopName: "CeramicCopyCat", listedDaysAgo: 3, url: "https://etsy.com" },
    status: "new",
    detectedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "1041",
    type: "suspicious",
    similarity: { title: 78, image: 82 },
    yourListing: { title: "Personalized Dog Collar — Leather, Engraved Name Tag", image: "/placeholder.svg" },
    suspectedCopy: { title: "Custom Dog Collar Leather with Name Plate Engraved", image: "/placeholder.svg", shopName: "PetGearPlus", listedDaysAgo: 7, url: "https://etsy.com" },
    status: "new",
    detectedAt: "2024-01-14T22:15:00Z",
  },
  {
    id: "1040",
    type: "likely_copy",
    similarity: { title: 91, image: 95 },
    yourListing: { title: "Minimalist Gold Earrings — Tiny Hoops, Hypoallergenic", image: "/placeholder.svg" },
    suspectedCopy: { title: "Minimalist Small Gold Hoop Earrings Hypoallergenic", image: "/placeholder.svg", shopName: "JewelryDupes", listedDaysAgo: 1, url: "https://etsy.com" },
    status: "reviewing",
    detectedAt: "2024-01-15T06:00:00Z",
  },
  {
    id: "1039",
    type: "suspicious",
    similarity: { title: 74, image: 79 },
    yourListing: { title: "Macramé Plant Hanger — Boho Wall Decor, Cotton Rope", image: "/placeholder.svg" },
    suspectedCopy: { title: "Boho Macrame Plant Holder Cotton Rope Wall Hanging", image: "/placeholder.svg", shopName: "HomeVibes", listedDaysAgo: 12, url: "https://etsy.com" },
    status: "resolved",
    detectedAt: "2024-01-10T14:00:00Z",
  },
  {
    id: "1038",
    type: "likely_copy",
    similarity: { title: 89, image: 93 },
    yourListing: { title: "Wedding Guest Book — Rustic Wood Cover, Custom Names", image: "/placeholder.svg" },
    suspectedCopy: { title: "Rustic Wedding Guest Book Wood Cover Personalized Names", image: "/placeholder.svg", shopName: "WeddingFakes", listedDaysAgo: 5, url: "https://etsy.com" },
    status: "reported",
    detectedAt: "2024-01-12T08:45:00Z",
  },
];

export const mockListings: Listing[] = [
  { id: "L001", title: "Handmade Ceramic Mug — Speckled Glaze, 12oz", image: "/placeholder.svg", matchCount: 2 },
  { id: "L002", title: "Personalized Dog Collar — Leather, Engraved Name Tag", image: "/placeholder.svg", matchCount: 1 },
  { id: "L003", title: "Minimalist Gold Earrings — Tiny Hoops, Hypoallergenic", image: "/placeholder.svg", matchCount: 1 },
  { id: "L004", title: "Macramé Plant Hanger — Boho Wall Decor, Cotton Rope", image: "/placeholder.svg", matchCount: 1 },
  { id: "L005", title: "Wedding Guest Book — Rustic Wood Cover, Custom Names", image: "/placeholder.svg", matchCount: 1 },
  { id: "L006", title: "Hand-poured Soy Candle — Lavender Fields, 8oz", image: "/placeholder.svg", matchCount: 0 },
  { id: "L007", title: "Crochet Baby Blanket — Soft Merino Wool, Pastel Colors", image: "/placeholder.svg", matchCount: 0 },
  { id: "L008", title: "Resin Jewelry Dish — Agate Inspired, Ring Holder", image: "/placeholder.svg", matchCount: 0 },
  { id: "L009", title: "Embroidered Tote Bag — Wildflower Design, Canvas", image: "/placeholder.svg", matchCount: 0 },
];

export const mockScans: Scan[] = [
  { date: "2024-01-15", listingsScanned: 124, matchesFound: 2, status: "completed" },
  { date: "2024-01-14", listingsScanned: 124, matchesFound: 1, status: "completed" },
  { date: "2024-01-13", listingsScanned: 122, matchesFound: 0, status: "completed" },
  { date: "2024-01-12", listingsScanned: 122, matchesFound: 1, status: "completed" },
  { date: "2024-01-11", listingsScanned: 120, matchesFound: 0, status: "completed" },
];
