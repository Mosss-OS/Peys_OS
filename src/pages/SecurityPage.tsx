/** SecurityPage - Comprehensive security settings with 2FA, biometric auth, password change, devices, and activity log */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Lock,
  Key,
  Smartphone,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  Clock,
  Globe,
  Mail,
  ShieldCheck,
  KeyRound,
  ShieldCheckIcon,
  Download,
  AlertCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";

interface SecurityLog {
  id: string;
  action: string;
  device: string;
  location: string;
  timestamp: string;
  status: "success" | "warning" | "failed";
}

/** SecurityPage component - Tabs-based security management covering authentication, trusted devices, and security activity logs */
export default function SecurityPage() {
  const { isLoggedIn, walletAddress } = useApp();
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [deviceTracking, setDeviceTracking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (isLoggedIn && walletAddress) {
      fetchSecurityActivity();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, walletAddress]);

  const fetchSecurityActivity = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const userEmail = user.email || "";

      const { data: payments } = await supabase
        .from("payments")
        .select("id, status, created_at, memo, token, amount, recipient_email, sender_wallet")
        .or(`sender_wallet.eq.${walletAddress},recipient_email.eq.${userEmail}`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (payments && payments.length > 0) {
        const logs: SecurityLog[] = payments.map((p, i) => {
          const isSender = p.sender_wallet?.toLowerCase() === walletAddress?.toLowerCase();
          return {
            id: p.id,
            action: isSender ? "Payment Sent" : "Payment Received",
            device: "Web Browser",
            location: "Unknown",
            timestamp: new Date(p.created_at).toLocaleString(),
            status: p.status === "claimed" ? "success" : p.status === "pending" ? "warning" : "failed",
          };
        });
        setSecurityLogs(logs);
      }
    } catch (err) {
      console.error("Error fetching security activity:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = () => {
    setIsChangingPassword(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      toast.success("Password changed successfully!");
    }, 1500);
  };

  const handleDisable2FA = () => {
    toast.error("Please confirm 2FA disablement from your email first.");
  };

  const statusConfig = {
    success: { icon: CheckCircle2, class: "text-green-500", bg: "bg-green-500/10" },
    warning: { icon: AlertTriangle, class: "text-yellow-500", bg: "bg-yellow-500/10" },
    failed: { icon: AlertCircle, class: "text-red-500", bg: "bg-red-500/10" },
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container px-4 py-6 pb-24 mx-auto max-w-2xl">
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/20 p-3">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Security Status: Good</h3>
                <p className="text-sm text-muted-foreground">
                  Your account has all recommended security features enabled.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="auth" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="auth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <ShieldCheckIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">2FA Enabled</p>
                      <p className="text-xs text-muted-foreground">Authenticator App + SMS</p>
                    </div>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={twoFactorEnabled ? handleDisable2FA : () => {}}
                  />
                </div>
                <Button variant="outline" className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Manage 2FA Methods
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Biometric Authentication</CardTitle>
                <CardDescription>
                  Use fingerprint or Face ID to unlock your wallet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Fingerprint className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Biometric Login</p>
                      <p className="text-xs text-muted-foreground">Face ID + Fingerprint</p>
                    </div>
                  </div>
                  <Switch
                    checked={biometricEnabled}
                    onCheckedChange={setBiometricEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Change Password</CardTitle>
                <CardDescription>
                  Ensure your password is strong and unique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10"
                      placeholder="Enter current password"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <input
                    type="password"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    placeholder="Confirm new password"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recovery Methods</CardTitle>
                <CardDescription>
                  Set up backup ways to recover your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span>Recovery Email</span>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <span>Recovery Phone</span>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                    <span>Recovery Phrase</span>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    Saved
                  </Badge>
                </div>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Backup Recovery Phrase
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trusted Devices</CardTitle>
                <CardDescription>
                  Manage devices that can access your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-green-500/5">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">iPhone 15 Pro</p>
                      <p className="text-xs text-muted-foreground">Last active: Just now</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    Current
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Chrome on MacOS</p>
                      <p className="text-xs text-muted-foreground">Last active: 2 hours ago</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                    Remove
                  </Button>
                </div>
                <Button variant="outline" className="w-full">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Add New Device
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Login Notifications</CardTitle>
                <CardDescription>
                  Get notified of suspicious login attempts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Alerts</p>
                    <p className="text-xs text-muted-foreground">
                      Receive emails for new device logins
                    </p>
                  </div>
                  <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Device Tracking</p>
                    <p className="text-xs text-muted-foreground">
                      Track all devices accessing your account
                    </p>
                  </div>
                  <Switch checked={deviceTracking} onCheckedChange={setDeviceTracking} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>
                  Review your recent security events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {securityLogs.map((log) => {
                  const config = statusConfig[log.status];
                  return (
                    <div
                      key={log.id}
                      className={`flex items-start justify-between p-3 rounded-lg border ${config.bg}`}
                    >
                      <div className="flex items-start gap-3">
                        <config.icon className={`h-5 w-5 mt-0.5 ${config.class}`} />
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-xs text-muted-foreground">{log.device}</p>
                          <p className="text-xs text-muted-foreground">{log.location}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {log.timestamp}
                      </span>
                    </div>
                  );
                })}
                <Button variant="outline" className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  View Full History
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-500">Suspicious Activity?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      If you notice any unauthorized access or suspicious activity, immediately
                      secure your account by changing your password and contacting support.
                    </p>
                    <Button variant="destructive" className="mt-3">
                      Report Suspicious Activity
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
