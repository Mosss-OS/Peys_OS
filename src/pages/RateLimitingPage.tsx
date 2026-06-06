/** RateLimitingPage - Monitor API rate limits, configure thresholds, and view request history. */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Zap,
  Ban,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface RateLimitEvent {
  id: string;
  endpoint: string;
  timestamp: string;
  status: "blocked" | "queued" | "allowed";
  waitTime?: number;
}

/** Page for monitoring rate limit usage, configuring thresholds, and viewing request history. */
export default function RateLimitingPage() {
  const [enableRateLimiting, setEnableRateLimiting] = useState(true);
  const [rateLimit, setRateLimit] = useState(100);
  const [timeWindow, setTimeWindow] = useState(60);
  const [rateLimitEvents, setRateLimitEvents] = useState<RateLimitEvent[]>([]);

  const handleIncreaseLimit = () => {
    toast.info("Rate limit increase requested. This may require verification.");
  };

  const statusConfig = {
    blocked: { icon: Ban, class: "text-red-500 bg-red-500/10", label: "Blocked" },
    queued: { icon: Clock, class: "text-yellow-500 bg-yellow-500/10", label: "Queued" },
    allowed: { icon: CheckCircle2, class: "text-green-500 bg-green-500/10", label: "Allowed" },
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container px-4 py-6 pb-24 mx-auto max-w-2xl">
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Gauge className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Rate Limiting</p>
                    <p className="text-sm text-muted-foreground">
                      Manage API rate limits and requests
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium">All Systems Operational</p>
                    <p className="text-sm text-muted-foreground">
                      You're within your rate limits
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-xs text-muted-foreground">Requests (last min)</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{rateLimit}</p>
                  <p className="text-xs text-muted-foreground">Limit</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Rate Limit</span>
                  <span className="font-medium">{rateLimit} requests</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary rounded-full h-3 transition-all"
                    style={{ width: "47%" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  47% of rate limit used
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rate Limit Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Rate Limiting</p>
                  <p className="text-xs text-muted-foreground">
                    Protect against excessive requests
                  </p>
                </div>
                <Switch checked={enableRateLimiting} onCheckedChange={setEnableRateLimiting} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Requests Limit</span>
                  <span className="font-medium">{rateLimit} requests</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={10}
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10</span>
                  <span>500</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Time Window</span>
                  <span className="font-medium">{timeWindow} seconds</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={300}
                  step={10}
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <Button variant="outline" className="w-full" onClick={handleIncreaseLimit}>
                <Zap className="h-4 w-4 mr-2" />
                Request Limit Increase
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rateLimitEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No recent requests</div>
              ) : (
                rateLimitEvents.map((event) => {
                const config = statusConfig[event.status];
                return (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${config.class}`}
                  >
                    <div className="flex items-center gap-3">
                      <config.icon className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{event.endpoint}</p>
                        <p className="text-xs opacity-70">{event.timestamp}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={config.status === "blocked" ? "border-red-500 text-red-500" : ""}>
                      {config.label}
                      {event.waitTime && ` (${event.waitTime}s)`}
                    </Badge>
                  </div>
                );
              })
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Rate Limit Info</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    When you exceed your rate limit, requests are queued or blocked.
                    Standard tier: 100 req/min. Pro tier: 500 req/min. Enterprise: unlimited.
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
