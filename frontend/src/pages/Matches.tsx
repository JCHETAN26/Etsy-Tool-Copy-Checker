import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MatchCard } from "@/components/MatchCard";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMatches } from "@/hooks/use-matches";

const tabs = ["all", "new", "reviewing", "reported", "resolved", "dismissed"] as const;

export default function Matches() {
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState("newest");

  const { data: matches, isLoading } = useMatches(filter);

  const sorted = matches ? [...matches].sort((a, b) => {
    if (sort === "similarity") {
      const simA = Math.max(a.title_similarity, a.image_similarity);
      const simB = Math.max(b.title_similarity, b.image_similarity);
      return simB - simA;
    }
    return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime();
  }) : [];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h1 className="text-2xl font-bold">Matches</h1>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="overflow-x-auto">
            {tabs.map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize text-xs sm:text-sm">{t}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="similarity">Highest Similarity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading matches..." : `Showing ${sorted.length} matches`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Fetching your alerts...</p>
        </div>
      ) : sorted.length > 0 ? (
        <div className="space-y-4">
          {sorted.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <ShieldCheck className="h-12 w-12 text-success mx-auto mb-3" />
          <p className="font-medium">No matches in this category.</p>
          <p className="text-sm text-muted-foreground">Everything looks safe for now.</p>
        </Card>
      )}
    </div>
  );
}
