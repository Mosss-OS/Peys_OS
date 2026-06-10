import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Hand,
  MousePointer,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface GestureAction {
  gesture: string;
  action: string;
  icon: typeof SwipeRight;
  enabled: boolean;
  description: string;
}

export default function GestureControlsPage() {
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [sensitivity, setSensitivity] = useState(50);
  const [gestureHistory, setGestureHistory] = useState<string[]>([]);

  const gestureActions: GestureAction[] = [
    { gesture: "Swipe Left", action: "Go Back", icon: ChevronLeft, enabled: true, description: "Navigate to previous page" },
    { gesture: "Swipe Right", action: "Go Forward", icon: ChevronRight, enabled: true, description: "Navigate to next page" },
    { gesture: "Swipe Up", action: "Scroll Up", icon: ChevronUp, enabled: true, description: "Scroll content up" },
    { gesture: "Swipe Down", action: "Scroll Down", icon: ChevronDown, enabled: true, description: "Scroll content down" },
    { gesture: "Long Press", action: "Show Menu", icon: MousePointer, enabled: true, description: "Long press to show context menu" },
    { gesture: "Pinch", action: "Zoom", icon: ZoomIn, enabled: true, description: "Pinch to zoom in/out" },
    { gesture: "Two-finger Swipe Left", action: "Refresh", icon: RotateCcw, enabled: false, description: "Refresh current page" },
  ];

  const [actions, setActions] = useState(gestureActions);

  const toggleAction = (index: number) => {
    setActions((prev) =>
      prev.map((a, i) => (i === index ? { ...a, enabled: !a.enabled } : a))
    );
    toast.success("Gesture setting updated");
  };

  const handleSensitivityChange = (value: number) => {
    setSensitivity(value);
    toast.success(`Sensitivity set to ${value}%`);
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
                    <Hand className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Gesture Controls</p>
                    <p className="text-sm text-muted-foreground">
                      Navigate using touch gestures
                    </p>
                  </div>
                </div>
                <Switch checked={gesturesEnabled} onCheckedChange={setGesturesEnabled} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sensitivity</CardTitle>
              <CardDescription>
                Adjust gesture detection sensitivity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Gesture Sensitivity</span>
                  <span className="font-medium">{sensitivity}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  step={10}
                  value={sensitivity}
                  onChange={(e) => handleSensitivityChange(Number(e.target.value))}
                  className="w-full"
                  disabled={!gesturesEnabled}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gesture Actions</CardTitle>
              <CardDescription>
                Enable or disable specific gestures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {actions.map((action, index) => (
                <div
                  key={action.gesture}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    action.enabled ? "bg-muted/50" : "opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <action.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{action.gesture}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={action.enabled}
                    onCheckedChange={() => toggleAction(index)}
                    disabled={!gesturesEnabled}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gesture Tutorial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <ChevronLeft className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Swipe Left</p>
                  <p className="text-xs text-muted-foreground">Go back</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <ChevronRight className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Swipe Right</p>
                  <p className="text-xs text-muted-foreground">Go forward</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <ChevronUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Swipe Up</p>
                  <p className="text-xs text-muted-foreground">Scroll up</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <ChevronDown className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Swipe Down</p>
                  <p className="text-xs text-muted-foreground">Scroll down</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Tips</p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>Gestures work best on touch-enabled devices</li>
                    <li>Adjust sensitivity if gestures are too sensitive or not responsive</li>
                    <li>Some gestures may conflict with scroll - disable if needed</li>
                  </ul>
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
