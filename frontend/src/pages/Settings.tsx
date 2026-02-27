import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Settings() {
  const [deleteConfirm, setDeleteConfirm] = useState("");

  return (
    <div className="space-y-6 max-w-2xl pb-20 md:pb-0">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Account</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Full name</Label><Input defaultValue="Jane Seller" /></div>
          <div className="space-y-2"><Label>Email</Label><Input defaultValue="jane@example.com" type="email" /></div>
        </div>
        <div className="space-y-2 max-w-xs"><Label>New password</Label><Input type="password" placeholder="••••••••" /></div>
        <Button onClick={() => toast.success("Settings saved")}>Save Changes</Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Connected Shops</h2>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Store className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">JaneCeramics</p>
              <p className="text-xs text-muted-foreground">Connected Jan 1, 2024 · 124 listings</p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" size="sm">Disconnect</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect shop?</AlertDialogTitle>
                <AlertDialogDescription>This will stop monitoring all listings from this shop. You can reconnect anytime.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => toast("Shop disconnected")}>Disconnect</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Notifications</h2>
        <div className="space-y-4">
          {[
            { label: "Email alerts for new matches", defaultChecked: true },
            { label: "Weekly scan summary email", defaultChecked: false },
            { label: "Scan failure notifications", defaultChecked: true },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between">
              <Label className="cursor-pointer">{n.label}</Label>
              <Switch defaultChecked={n.defaultChecked} onCheckedChange={() => toast.success("Preference updated")} />
            </div>
          ))}
          <div className="space-y-2 max-w-xs"><Label>Alert email</Label><Input defaultValue="jane@example.com" type="email" /></div>
        </div>
      </Card>

      <Card className="p-6 space-y-4 border-destructive">
        <h2 className="font-semibold text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">Once you delete your account, all data will be permanently removed.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Account</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. Type <strong>DELETE</strong> to confirm.</AlertDialogDescription>
            </AlertDialogHeader>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="Type DELETE" />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirm("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={deleteConfirm !== "DELETE"} onClick={() => toast("Account deleted")}>Delete Account</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}
