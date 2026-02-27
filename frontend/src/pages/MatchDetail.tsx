import { useParams, Link } from "react-router-dom";
import { mockMatches } from "@/lib/mock-data";
import { MatchCard } from "@/components/MatchCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function MatchDetail() {
  const { id } = useParams();
  const match = mockMatches.find((m) => m.id === id);
  const [note, setNote] = useState("");

  if (!match) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Match not found.</p>
        <Button variant="ghost" asChild className="mt-4"><Link to="/matches">← Back to Matches</Link></Button>
      </div>
    );
  }

  const timeline = [
    { date: match.detectedAt, event: "Match detected by automated scan" },
    { date: match.detectedAt, event: `Status: ${match.status}` },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/matches" className="hover:text-foreground flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Matches</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Match #{match.id}</span>
      </div>

      <MatchCard match={match} showLink={false} />

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Match History</h3>
          <div className="space-y-4">
            {timeline.map((t, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <p className="text-sm">{t.event}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Actions</h3>
          <div className="space-y-3">
            <Textarea placeholder="Add a note about this match..." value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
            <Button variant="outline" className="w-full" onClick={() => { if (note) toast.success("Note saved"); }}>Save Note</Button>
            <Button variant="outline" className="w-full" onClick={() => { navigator.clipboard.writeText(`https://etsy.com/report/${match.id}`); toast.success("Report link copied"); }}>
              <Copy className="mr-2 h-4 w-4" /> Copy Report Link
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
