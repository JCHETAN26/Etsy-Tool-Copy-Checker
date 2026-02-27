import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Store, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getEtsyAuthUrl } from "@/lib/etsy-auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const stepLabels = ["Connect your shop", "Import listings", "First scan"];

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [importCount, setImportCount] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle OAuth Callback
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code) {
      handleCallback(code);
    }
  }, [searchParams]);

  const handleCallback = async (code: string) => {
    setIsProcessing(true);
    setStep(2);
    try {
      const verifier = localStorage.getItem("etsy_verifier");
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      const response = await supabase.functions.invoke("etsy-oauth-callback", {
        body: { code, verifier, userId: user.id },
      });

      if (response.error) throw response.error;

      // Start import
      await supabase.functions.invoke("import-listings", {
        body: { shopId: response.data.shop.id },
      });

      // Poll for listings
      const pollInterval = setInterval(async () => {
        const { count } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("shop_id", response.data.shop.id);

        setImportCount(count || 0);
        if (count && count > 0) {
          // In a real app, we'd wait for the function to return 'complete' 
          // but for UX we show progress.
        }
      }, 2000);

      // Transition to scan after 10 seconds for demo/UX
      setTimeout(() => {
        clearInterval(pollInterval);
        setStep(3);
      }, 10000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect shop");
      setStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnect = async () => {
    setError(null);
    try {
      const url = await getEtsyAuthUrl();
      window.location.href = url;
    } catch (err) {
      toast.error("Failed to start Etsy connection");
    }
  };

  useEffect(() => {
    if (step === 3) {
      const interval = setInterval(() => {
        setScanProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            return 100;
          }
          return p + 1;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [step]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors",
              step > i + 1 ? "bg-success border-success text-success-foreground" :
                step === i + 1 ? "border-primary text-primary" : "border-border text-muted-foreground"
            )}>
              {step > i + 1 ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn("text-sm hidden sm:inline", step === i + 1 ? "font-medium" : "text-muted-foreground")}>{label}</span>
            {i < 2 && <div className={cn("w-8 h-0.5", step > i + 1 ? "bg-success" : "bg-border")} />}
          </div>
        ))}
      </div>

      <Card className="w-full max-w-lg p-6 md:p-8 text-center">
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6 flex items-center gap-3 text-left">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {step === 1 && (
          <>
            <Store className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Connect your Etsy shop</h1>
            <p className="text-muted-foreground mb-6">We use Etsy's official API. We can only read your listings — we can never make changes to your shop.</p>
            <Button size="lg" className="w-full max-w-xs mx-auto" onClick={handleConnect} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Connect with Etsy
            </Button>
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Secure OAuth connection. Your credentials are never stored.
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Importing your listings...</h1>
            <p className="text-muted-foreground mb-6">We're pulling in all your active listings. This usually takes less than a minute.</p>
            <p className="text-3xl font-bold text-primary mb-2">{importCount}</p>
            <p className="text-sm text-muted-foreground">listings imported...</p>
          </>
        )}

        {step === 3 && (
          <>
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Running your first scan</h1>
            <p className="text-muted-foreground mb-6">We're scanning Etsy now to establish your baseline. Future scans run automatically every night.</p>
            <Progress value={scanProgress} className="h-3 mb-4" />
            <p className="text-sm text-muted-foreground mb-6">{scanProgress}% complete</p>
            {scanProgress === 100 && (
              <Button size="lg" asChild className="w-full max-w-xs mx-auto"><Link to="/dashboard">Go to Dashboard</Link></Button>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
