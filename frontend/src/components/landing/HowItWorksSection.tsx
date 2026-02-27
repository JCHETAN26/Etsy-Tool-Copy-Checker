import { Store, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const steps = [
  { icon: Store, num: "1", title: "Connect your Etsy shop", description: "OAuth integration takes 30 seconds. We only read your listings — never make changes." },
  { icon: Search, num: "2", title: "We scan Etsy daily", description: "Automated monitoring of titles and images across all of Etsy, every single night." },
  { icon: Bell, num: "3", title: "Get alerted instantly", description: "Email alerts with direct links to the suspected copy and pre-filled report forms." },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Up and running in minutes.</h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">No complicated setup. Connect, and we handle the rest.</p>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="relative h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <s.icon className="h-7 w-7 text-primary" />
                <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{s.num}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center border-t pt-8">
          <Button size="lg" asChild><Link to="/signup">Start Free Trial</Link></Button>
        </div>
      </div>
    </section>
  );
}
