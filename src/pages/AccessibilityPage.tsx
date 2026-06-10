import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Accessibility,
  Eye,
  Volume2,
  Keyboard,
  Moon,
  ZoomIn,
  Timer,
  CheckCircle2,
  AlertCircle,
  Contrast,
  Type,
  MousePointer,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

export default function AccessibilityPage() {
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    screenReader: false,
    reduceMotion: false,
    colorBlindMode: false,
    keyboardNav: true,
    focusIndicators: true,
    altText: true,
    captions: true,
    audioDescriptions: false,
  });

  const wcagLevels = [
    { level: "A", score: 95, color: "bg-yellow-500" },
    { level: "AA", score: 88, color: "bg-green-500" },
    { level: "AAA", score: 72, color: "bg-blue-500" },
  ];

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success("Setting updated");
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
                    <Accessibility className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Accessibility Center</p>
                    <p className="text-sm text-muted-foreground">
                      Customize your experience for better accessibility
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">WCAG Compliance</CardTitle>
              <CardDescription>
                Web Content Accessibility Guidelines compliance levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {wcagLevels.map((item) => (
                <div key={item.level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Level {item.level}</span>
                    <Badge variant={item.score >= 85 ? "default" : "outline"}>
                      {item.score}%
                    </Badge>
                  </div>
                  <Progress value={item.score} className={`h-2 ${item.color}`} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Contrast className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">High Contrast Mode</p>
                    <p className="text-xs text-muted-foreground">
                      Increase contrast for better visibility
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.highContrast}
                  onCheckedChange={() => toggleSetting("highContrast")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Type className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Large Text</p>
                    <p className="text-xs text-muted-foreground">
                      Increase base font size by 25%
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.largeText}
                  onCheckedChange={() => toggleSetting("largeText")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Color Blind Mode</p>
                    <p className="text-xs text-muted-foreground">
                      Adjust colors for deuteranopia/protanopia
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.colorBlindMode}
                  onCheckedChange={() => toggleSetting("colorBlindMode")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ZoomIn className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Zoom Level</p>
                    <p className="text-xs text-muted-foreground">
                      Default: 100%, Range: 50%-200%
                    </p>
                  </div>
                </div>
                <Badge variant="outline">100%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Motion & Animation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MousePointer className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Reduce Motion</p>
                    <p className="text-xs text-muted-foreground">
                      Minimize animations and transitions
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.reduceMotion}
                  onCheckedChange={() => toggleSetting("reduceMotion")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Keyboard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Keyboard Navigation</p>
                    <p className="text-xs text-muted-foreground">
                      Navigate without a mouse using Tab, Enter, etc.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.keyboardNav}
                  onCheckedChange={() => toggleSetting("keyboardNav")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MousePointer className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Focus Indicators</p>
                    <p className="text-xs text-muted-foreground">
                      Show visible focus outlines on interactive elements
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.focusIndicators}
                  onCheckedChange={() => toggleSetting("focusIndicators")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Screen Reader</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Screen Reader Support</p>
                    <p className="text-xs text-muted-foreground">
                      Optimize for screen reader navigation
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.screenReader}
                  onCheckedChange={() => toggleSetting("screenReader")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Type className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Alt Text</p>
                    <p className="text-xs text-muted-foreground">
                      Provide text descriptions for images
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.altText}
                  onCheckedChange={() => toggleSetting("altText")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Captions</p>
                    <p className="text-xs text-muted-foreground">
                      Show captions for video content
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.captions}
                  onCheckedChange={() => toggleSetting("captions")}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Accessibility Features</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Peys is committed to WCAG 2.1 AA compliance. Our platform includes
                    screen reader support, keyboard navigation, and customizable display
                    options to ensure everyone can use our services.
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
