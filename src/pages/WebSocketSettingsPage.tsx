import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Zap,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  Activity,
  Clock,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface WebSocketStatus {
  connected: boolean;
  latency: number;
  reconnectAttempts: number;
  lastConnected: string;
}

export default function WebSocketSettingsPage() {
  const [enableWebSocket, setEnableWebSocket] = useState(true);
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: true,
    latency: 45,
    reconnectAttempts: 0,
    lastConnected: "Just now",
  });

  const [reconnectInterval, setReconnectInterval] = useState(5);
  const [maxReconnectAttempts, setMaxReconnectAttempts] = useState(10);
  const [heartbeatInterval, setHeartbeatInterval] = useState(30);

  const handleToggleConnection = () => {
    if (status.connected) {
      setStatus((prev) => ({ ...prev, connected: false }));
      toast.info("WebSocket disconnected");
    } else {
      setStatus((prev) => ({ ...prev, connected: true, latency: 45 }));
      toast.success("WebSocket connected");
    }
  };

  const handleTestConnection = () => {
    toast.loading("Testing connection...");
    setTimeout(() => {
      setStatus((prev) => ({ ...prev, latency: Math.floor(Math.random() * 100) + 20 }));
      toast.success("Connection test successful!");
    }, 1500);
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
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Real-time Updates</p>
                    <p className="text-sm text-muted-foreground">
                      WebSocket connection status
                    </p>
                  </div>
                </div>
                <Switch checked={enableWebSocket} onCheckedChange={setEnableWebSocket} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {status.connected ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={
                    status.connected
                      ? "text-green-500 border-green-500"
                      : "text-red-500 border-red-500"
                  }
                >
                  {status.connected ? "Connected" : "Disconnected"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Latency</span>
                <Badge variant="outline" className="font-mono">
                  {status.latency}ms
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last Connected</span>
                <span className="text-sm">{status.lastConnected}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reconnect Attempts</span>
                <span className="text-sm">{status.reconnectAttempts}</span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleToggleConnection}
                >
                  {status.connected ? (
                    <>
                      <WifiOff className="h-4 w-4 mr-2" />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <Wifi className="h-4 w-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleTestConnection}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connection Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Reconnect Interval</span>
                  <span className="font-medium">{reconnectInterval} seconds</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={reconnectInterval}
                  onChange={(e) => setReconnectInterval(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Max Reconnect Attempts</span>
                  <span className="font-medium">{maxReconnectAttempts}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={maxReconnectAttempts}
                  onChange={(e) => setMaxReconnectAttempts(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Heartbeat Interval</span>
                  <span className="font-medium">{heartbeatInterval} seconds</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={120}
                  step={10}
                  value={heartbeatInterval}
                  onChange={(e) => setHeartbeatInterval(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Real-time Events</CardTitle>
              <CardDescription>
                Events that update in real-time via WebSocket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { event: "Payment Received", enabled: true },
                { event: "Transaction Confirmed", enabled: true },
                { event: "New Message", enabled: true },
                { event: "Price Alerts", enabled: false },
                { event: "Gas Price Updates", enabled: true },
                { event: "Contact Online Status", enabled: false },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{item.event}</span>
                  <Switch defaultChecked={item.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Connection Health</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your WebSocket connection is healthy with an average latency of{" "}
                    {status.latency}ms. Real-time features are fully operational.
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
