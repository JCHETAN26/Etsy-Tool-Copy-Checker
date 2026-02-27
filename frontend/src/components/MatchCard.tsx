import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Flag, X, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { MatchWithListing } from "@/types";
import { toast } from "sonner";

export function MatchCard({ match, showLink = true }: { match: MatchWithListing; showLink?: boolean }) {
  const isLikelyCopy = match.title_similarity > 0.88 || match.image_similarity > 0.92;

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        {isLikelyCopy ? (
          <Badge variant="destructive">🚨 LIKELY COPY</Badge>
        ) : (
          <Badge className="bg-orange-500 hover:bg-orange-600">⚠️ SUSPICIOUS</Badge>
        )}
        {showLink && (
          <Link to={`/matches/${match.id}`} className="text-xs text-muted-foreground hover:text-foreground">
            #{match.id.slice(0, 8)} →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Your Listing</p>
          <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
            <img src={match.listing.image_url} alt={match.listing.title} className="w-full h-full object-cover" />
          </div>
          <p className="text-sm font-medium leading-snug line-clamp-2">{match.listing.title}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Suspected Copy</p>
          <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
            <img src={match.suspected_image_url} alt={match.suspected_title} className="w-full h-full object-cover" />
          </div>
          <p className="text-sm font-medium leading-snug line-clamp-2">{match.suspected_title}</p>
          <p className="text-xs text-muted-foreground mt-1">Shop: {match.suspected_shop_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Title match</span><span>{Math.round(match.title_similarity * 100)}%</span>
          </div>
          <Progress value={match.title_similarity * 100} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Image match</span><span>{Math.round(match.image_similarity * 100)}%</span>
          </div>
          <Progress value={match.image_similarity * 100} className="h-2" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <Button variant="default" size="sm" className="col-span-2 lg:col-span-1" asChild>
          <Link to={`/matches/${match.id}`}>
            <ShieldAlert className="mr-1 h-3 w-3" /> Analyze
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => window.open(match.suspected_listing_url, "_blank")}>
          <ExternalLink className="mr-1 h-3 w-3" /> View on Etsy
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.open("https://www.etsy.com/ipreporting", "_blank")}>
          <Flag className="mr-1 h-3 w-3" /> Report
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => toast("Match dismissed")}>
          <X className="mr-1 h-3 w-3" /> Dismiss
        </Button>
        <Button variant="ghost" size="sm" className="text-success hover:text-success hover:bg-success/10" onClick={() => toast.success("Marked as resolved")}>
          <CheckCircle className="mr-1 h-3 w-3" /> Resolved
        </Button>
      </div>
    </Card>
  );
}

function ShieldAlert({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>;
}
