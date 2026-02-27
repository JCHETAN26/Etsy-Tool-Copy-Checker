import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Solo",
    price: "$15",
    period: "/mo",
    description: "For individual sellers",
    highlighted: true,
    features: ["1 Etsy shop", "Up to 200 listings", "Daily scans", "Email alerts", "Match dashboard", "7-day free trial"],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For serious sellers",
    highlighted: false,
    features: ["3 Etsy shops", "Unlimited listings", "Priority scans", "Slack alerts", "Match history export", "7-day free trial"],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Simple, honest pricing.</h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">No hidden fees. No surprises. Just protection for your shop.</p>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={cn("p-6 md:p-8 relative", plan.highlighted && "border-primary border-2")}>
              {plan.highlighted && <Badge className="absolute -top-3 left-6">Most Popular</Badge>}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} asChild>
                <Link to="/signup">Start Free Trial</Link>
              </Button>
            </Card>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">All plans include a 7-day free trial. No credit card required to start.</p>
      </div>
    </section>
  );
}
