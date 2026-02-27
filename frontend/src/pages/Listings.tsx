import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RefreshCw, Search } from "lucide-react";
import { mockListings, mockMatches, type Listing } from "@/lib/mock-data";
import { MatchCard } from "@/components/MatchCard";
import { toast } from "sonner";

export default function Listings() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Listing | null>(null);

  const filtered = mockListings.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()));

  const listingMatches = selected ? mockMatches.filter((m) => m.yourListing.title === selected.title) : [];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <Button variant="outline" onClick={() => toast.success("Listings refreshed")}><RefreshCw className="mr-2 h-4 w-4" /> Refresh Listings</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search listings..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((listing) => (
          <Card key={listing.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(listing)}>
            <div className="aspect-square bg-muted">
              <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium line-clamp-2">{listing.title}</p>
              {listing.matchCount > 0 && (
                <Badge variant="destructive" className="mt-2 text-xs">{listing.matchCount} {listing.matchCount === 1 ? "match" : "matches"}</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left">{selected.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img src={selected.image} alt={selected.title} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-semibold">Associated Matches ({listingMatches.length})</h3>
                {listingMatches.length > 0 ? (
                  listingMatches.map((m) => <MatchCard key={m.id} match={m} />)
                ) : (
                  <p className="text-sm text-muted-foreground">No matches detected for this listing.</p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
