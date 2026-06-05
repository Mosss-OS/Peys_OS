import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  Shield,
  Smartphone,
  Globe,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  LogOut,
  History,
  Key,
  Fingerprint,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

export default function SessionManagementPage() {
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [requireReAuth, setRequireReAuth] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);

  const handleRevokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Session revoked");
  };

  const handleRevokeAll = () => {
    setSessions((prev) => prev.filter((s) => s.current));
    toast.success("All other sessions revoked");
  };

  const handleExtendSession = () => {
    toast.success("Session extended");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container px-4 py-6 pb-24 mx-auto max-w-2xl">
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Session Security</p>
                  <p className="text-sm text-muted-foreground">
                    Manage your active sessions and security settings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="sessions" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {sessions.length} active session(s)
                </p>
                <Button variant="outline" size="sm" onClick={handleRevokeAll}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Revoke Others
                </Button>
              </div>

              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Smartphone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{session.device}</p>
                            {session.current && (
                              <Badge variant="default" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {session.browser}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {session.location}
                            </span>
                            <span>IP: {session.ip}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Last active: {session.lastActive}
                          </p>
                        </div>
                      </div>
                      {!session.current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleRevokeSession(session.id)}
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Session Timeout</CardTitle>
                  <CardDescription>
                    Automatically log out after inactivity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Session timeout</span>
                      <span className="font-medium">{sessionTimeout} minutes</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={120}
                      step={5}
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5 min</span>
                      <span>2 hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Require Re-authentication</p>
                      <p className="text-xs text-muted-foreground">
                        Ask for password before sensitive actions
                      </p>
                    </div>
                    <Switch checked={requireReAuth} onCheckedChange={setRequireReAuth} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Biometric Unlock</p>
                      <p className="text-xs text-muted-foreground">
                        Use Face ID or fingerprint for quick unlock
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Remember Devices</p>
                      <p className="text-xs text-muted-foreground">
                        Skip 2FA on trusted devices
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full" onClick={handleExtendSession}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Extend Current Session
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={handleRevokeAll}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out All Devices
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Security Tip</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    If you notice unfamiliar sessions, revoke them immediately and
                    consider changing your password.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
