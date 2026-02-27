import { Type, Image, Clock, Mail, Flag, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  { icon: Type, title: "Title Monitoring", description: "Fuzzy match detection across all Etsy search results catches even slightly reworded copies." },
  { icon: Image, title: "Image Detection", description: "Perceptual hash comparison catches stolen photos even if resized, cropped, or recolored." },
  { icon: Clock, title: "Daily Automated Scans", description: "Runs every night automatically — no action needed from you. Wake up to results." },
  { icon: Mail, title: "Instant Email Alerts", description: "Get notified the moment a match is found, with all the details you need to act." },
  { icon: Flag, title: "One-Click Reporting", description: "Pre-filled Etsy IP report links for each match. Report copycats in seconds." },
  { icon: BarChart3, title: "Match Dashboard", description: "Full history of all detected matches with status tracking and resolution notes." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything you need to protect your shop.</h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">Powerful features built specifically for Etsy sellers who care about their craft.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="p-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
