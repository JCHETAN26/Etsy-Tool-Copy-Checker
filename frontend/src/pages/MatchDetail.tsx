import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Gavel,
  History,
  MessageSquare
} from "lucide-react";
import { useMatchDetail } from "@/hooks/use-match-detail";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function MatchDetail() {
  const { id } = useParams();
  const { data: match, isLoading, updateStatus } = useMatchDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 w-full" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-20 bg-card rounded-xl border border-dashed">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-xl font-semibold mb-2">Match not found</p>
        <p className="text-muted-foreground mb-6">The match alert you are looking for doesn't exist or was removed.</p>
        <Button asChild variant="outline"><Link to="/matches">Back to Matches</Link></Button>
      </div>
    );
  }

  const isLikelyCopy = match.title_similarity > 0.88 || match.image_similarity > 0.92;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link to="/matches"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Match Analysis
              <Badge variant={isLikelyCopy ? "destructive" : "secondary"}>
                {isLikelyCopy ? 'High Confidence' : 'Manual Review'}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">Detected on {format(new Date(match.detected_at), "PPP")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-success hover:text-success hover:bg-success/10 border-success/20"
            onClick={() => updateStatus.mutate('resolved')}
          >
            <CheckCircle className="mr-2 h-4 w-4" /> Mark Resolved
          </Button>
          <Button
            variant="outline"
            className="text-muted-foreground"
            onClick={() => updateStatus.mutate('dismissed')}
          >
            <XCircle className="mr-2 h-4 w-4" /> Dismiss
          </Button>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Original Listing */}
        <Card className="overflow-hidden border-2 border-primary/10">
          <div className="bg-primary/5 px-4 py-2 border-b flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Your Original Listing</span>
            <Badge variant="outline" className="bg-background">Protected</Badge>
          </div>
          <div className="p-0">
            <div className="aspect-square bg-muted relative">
              <img src={match.listing.image_url} alt="Original" className="object-cover w-full h-full" />
            </div>
            <div className="p-4 space-y-2">
              <h3 className="font-semibold line-clamp-2 min-h-[3rem]">{match.listing.title}</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ID: {match.listing.etsy_listing_id}</span>
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <a href={`https://etsy.com/listing/${match.listing.etsy_listing_id}`} target="_blank" rel="noreferrer">
                    View My Listing <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Suspected Copy */}
        <Card className={cn(
          "overflow-hidden border-2 shadow-lg",
          isLikelyCopy ? "border-destructive/30" : "border-warning/30"
        )}>
          <div className={cn(
            "px-4 py-2 border-b flex items-center justify-between",
            isLikelyCopy ? "bg-destructive/10 text-destructive-foreground" : "bg-warning/10"
          )}>
            <span className="text-xs font-bold uppercase tracking-wider">Suspected Copy</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Similarity: {Math.max(match.title_similarity, match.image_similarity).toLocaleString(undefined, { style: 'percent' })}</span>
              <Badge variant={isLikelyCopy ? "destructive" : "warning"}>Alert</Badge>
            </div>
          </div>
          <div className="p-0">
            <div className="aspect-square bg-muted relative">
              <img src={match.suspected_image_url} alt="Copy" className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="sm" asChild>
                  <a href={match.suspected_listing_url} target="_blank" rel="noreferrer">
                    Inspect Listing <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="font-semibold line-clamp-2 min-h-[3rem]">{match.suspected_title}</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shop: {match.suspected_shop_name}</span>
                <span className="text-muted-foreground">{match.suspected_etsy_listing_id}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Analysis & Insights */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-5 md:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Automated Analysis Report</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase text-muted-foreground tracking-widest font-bold">Title Similarity</Label>
                <div className="mt-2 flex items-end gap-3">
                  <span className="text-3xl font-black">{(match.title_similarity * 100).toFixed(1)}%</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-primary" style={{ width: `${match.title_similarity * 100}%` }} />
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">
                {match.title_similarity > 0.85
                  ? "Nearly identical title found. This listing likely copied your SEO metadata."
                  : "Similar keywords detected in title. Minimal variation found."}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase text-muted-foreground tracking-widest font-bold">Image Similarity</Label>
                <div className="mt-2 flex items-end gap-3">
                  <span className="text-3xl font-black">{(match.image_similarity * 100).toFixed(1)}%</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-primary" style={{ width: `${match.image_similarity * 100}%` }} />
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">
                {match.image_similarity > 0.9
                  ? "Pixel-level match detected. The image appears to be your direct product photo."
                  : "Visual patterns are highly similar. Could be a screenshot of your listing."}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t">
            <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3">
              <Gavel className="h-5 w-5 text-primary shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Recommended Action</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on the high similarity scores, we recommend filing a formal Takedown Notice through Etsy's Portal immediately.
                </p>
                <Button className="mt-4" size="sm" asChild>
                  <a href="https://www.etsy.com/legal/ip-reporting" target="_blank" rel="noreferrer">
                    File Takedown to Etsy
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-bold">Activity Log</h3>
            </div>
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4 py-1">
                <p className="text-xs text-muted-foreground">{format(new Date(match.detected_at), "MMM d, h:mm a")}</p>
                <p className="text-sm font-medium">Detected during nightly scan</p>
              </div>
              <div className="border-l-2 border-muted pl-4 py-1 text-muted-foreground">
                <p className="text-xs">Pending</p>
                <p className="text-sm">Owner review requested</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-dashed bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Need Help?</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Unsure if this is a copy? Send this link to our IP experts for a free second opinion.</p>
            <Button variant="outline" size="sm" className="w-full text-xs">Share for Review</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={cn("block", className)}>{children}</span>;
}
