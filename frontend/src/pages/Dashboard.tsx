import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ShieldCheck, Loader2 } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const { shop, stats, recentMatches, scanHistory, isLoading } = useDashboardData();

  const handleScanNow = async () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)), // TO DO: Call scan-shop edge function
      {
        loading: "Requesting scan...",
        success: "Scan started successfully. Check back in a few minutes.",
        error: "Failed to start scan.",
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <Card className="p-12 text-center max-w-2xl mx-auto mt-12 border-dashed">
        <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Welcome to EtsyGuard</h2>
        <p className="text-muted-foreground mb-8">
          Your shop isn't connected yet. While we wait for Etsy API approval, you can populate your dashboard with sample data to test out the features.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/onboarding">Connect Etsy Shop</Link>
          </Button>
          <Button variant="outline" size="lg" onClick={async () => {
            const { error } = await supabase.functions.invoke('seed-demo-data');
            if (error) {
              toast.error("Please deploy the 'seed-demo-data' function first.");
            } else {
              toast.success("Demo data seeded! Refreshing...");
              window.location.reload();
            }
          }}>
            Seed Demo Data
          </Button>
        </div>
      </Card>
    );
  }

  const dashboardStats = [
    { label: "Listings Monitored", value: stats?.listingCount.toString() || "0", sub: `across 1 shop` },
    { label: "Active Matches", value: stats?.matchCount.toString() || "0", sub: "require your attention", highlight: (stats?.matchCount || 0) > 0 },
    { label: "Resolved", value: stats?.resolvedCount.toString() || "0", sub: "matches handled", success: true },
    {
      label: "Last Scan",
      value: shop.last_scan_at ? formatDistanceToNow(new Date(shop.last_scan_at)) + " ago" : "Never",
      sub: "Daily checks active"
    },
  ];

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Shop: <span className="font-medium text-foreground">{shop.shop_name}</span>
          </span>
          <Button onClick={handleScanNow}>
            <RefreshCw className="mr-2 h-4 w-4" /> Scan Now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.highlight ? "text-primary" : ""} ${s.success ? "text-success" : ""}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Matches</h2>
          <Link to="/matches" className="text-sm text-primary hover:underline">View All →</Link>
        </div>
        {recentMatches && recentMatches.length > 0 ? (
          <div className="space-y-4">
            {recentMatches.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <ShieldCheck className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="font-medium">No copies detected in your last scan.</p>
            <p className="text-sm text-muted-foreground">We'll keep watching.</p>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Scan History</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Listings Scanned</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Matches Found</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {scanHistory && scanHistory.length > 0 ? (
                  scanHistory.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="p-3">{new Date(s.started_at).toLocaleDateString()}</td>
                      <td className="p-3">{s.listings_scanned}</td>
                      <td className="p-3">{s.matches_found > 0 ? <span className="text-primary font-medium">{s.matches_found}</span> : "0"}</td>
                      <td className="p-3">
                        <Badge variant={s.status === "completed" ? "success" : s.status === "running" ? "default" : "destructive"} className="text-xs">
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No scan history available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
