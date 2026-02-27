import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const comparison = [
  { feature: "Etsy shops", solo: "1", pro: "3" },
  { feature: "Listings", solo: "Up to 200", pro: "Unlimited" },
  { feature: "Daily scans", solo: true, pro: true },
  { feature: "Email alerts", solo: true, pro: true },
  { feature: "Match dashboard", solo: true, pro: true },
  { feature: "Priority scans", solo: false, pro: true },
  { feature: "Slack alerts", solo: false, pro: true },
  { feature: "Match history export", solo: false, pro: true },
];

export default function Billing() {
  return (
    <div className="space-y-6 max-w-3xl pb-20 md:pb-0">
      <h1 className="text-2xl font-bold">Billing & Plan</h1>

      {/* Trial banner */}
      <Card className="p-4 bg-primary/5 border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="font-medium text-sm">Your free trial ends in 5 days.</p>
          <p className="text-sm text-muted-foreground">Add a payment method to keep protecting your shop.</p>
        </div>
        <Button size="sm">Add Payment Method</Button>
      </Card>

      {/* Current plan */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold">Solo Plan</h2>
              <Badge variant="warning">Trial</Badge>
            </div>
            <p className="text-sm text-muted-foreground">$15/mo · Trial ends Jan 22, 2024</p>
          </div>
          <div className="flex gap-2">
            <Button>Upgrade Plan</Button>
            <Button variant="outline">Manage Billing</Button>
          </div>
        </div>
      </Card>

      {/* Comparison */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium text-muted-foreground">Feature</th>
                <th className="text-center p-3 font-medium">Solo <span className="text-muted-foreground font-normal">$15/mo</span></th>
                <th className="text-center p-3 font-medium">Pro <span className="text-muted-foreground font-normal">$29/mo</span></th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.feature} className="border-b last:border-0">
                  <td className="p-3">{row.feature}</td>
                  <td className="p-3 text-center">
                    {typeof row.solo === "boolean" ? (
                      row.solo ? <Check className="h-4 w-4 text-success mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />
                    ) : row.solo}
                  </td>
                  <td className="p-3 text-center">
                    {typeof row.pro === "boolean" ? (
                      row.pro ? <Check className="h-4 w-4 text-success mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />
                    ) : row.pro}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
