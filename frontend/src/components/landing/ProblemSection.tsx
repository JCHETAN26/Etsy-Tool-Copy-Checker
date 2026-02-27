import { Camera, FileText, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";

const problems = [
  {
    icon: Camera,
    title: "Copied photos",
    description: "Other sellers steal your carefully shot product photos and use them as their own — making their listings look identical to yours.",
  },
  {
    icon: FileText,
    title: "Stolen titles",
    description: "Your optimized, keyword-rich titles get copied word-for-word, hurting your SEO ranking and splitting your traffic.",
  },
  {
    icon: EyeOff,
    title: "Zero visibility",
    description: "Right now, you have no way of knowing when someone copies your work. By the time you find out, they've already made sales.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Your work deserves protection.</h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">Thousands of Etsy sellers lose revenue every day to copycats. Here's what's happening.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p) => (
            <Card key={p.title} className="p-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <p.icon className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
