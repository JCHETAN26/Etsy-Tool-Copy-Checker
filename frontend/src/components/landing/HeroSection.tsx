import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

function HeroMockup() {
  return (
    <div className="bg-card rounded-2xl shadow-xl border p-4 md:p-6 max-w-md mx-auto">
      <Badge variant="destructive" className="mb-4">🚨 LIKELY COPY</Badge>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase mb-1">Your Listing</p>
          <div className="aspect-square bg-muted rounded-lg mb-1.5" />
          <p className="text-xs font-medium leading-tight">Handmade Ceramic Mug — Speckled Glaze</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase mb-1">Suspected Copy</p>
          <div className="aspect-square bg-muted rounded-lg mb-1.5" />
          <p className="text-xs font-medium leading-tight">Ceramic Handmade Mug Speckled Glaze 12oz</p>
          <p className="text-[10px] text-muted-foreground">CeramicCopyCat · 3 days ago</p>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5"><span>Title match</span><span>94%</span></div>
          <Progress value={94} className="h-1.5" />
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5"><span>Image match</span><span>97%</span></div>
          <Progress value={97} className="h-1.5" />
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                Your Etsy listings,{" "}
                <span className="text-primary">protected.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-lg">
                ListingShield monitors Etsy every day and alerts you the moment someone copies your titles or photos.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="xl" asChild><Link to="/signup">Start 7-Day Free Trial</Link></Button>
                <Button variant="ghost" size="xl" asChild><a href="#how-it-works">See How It Works</a></Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> No credit card required</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Setup in 2 minutes</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Cancel anytime</span>
              </div>
            </div>
            <div className="relative lg:pl-8">
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl" />
              <div className="relative">
                <HeroMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-b bg-card py-6">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Trusted by 500+ Etsy sellers</span>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}
          </div>
          <div className="flex -space-x-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-7 w-7 rounded-full bg-muted border-2 border-card" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
