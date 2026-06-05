import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Mic,
  MicOff,
  Volume2,
  Settings,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface VoiceCommand {
  command: string;
  action: string;
  enabled: boolean;
}

export default function VoiceInputPage() {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(100);
  const [language, setLanguage] = useState("en-US");
  const [showSettings, setShowSettings] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  const voiceCommands: VoiceCommand[] = [
    { command: "Send [amount] to [recipient]", action: "Send payment", enabled: true },
    { command: "Check my balance", action: "View balance", enabled: true },
    { command: "Show transactions", action: "Open transactions", enabled: true },
    { command: "Scan QR code", action: "Open QR scanner", enabled: true },
    { command: "Help", action: "Show help", enabled: true },
    { command: "Dark mode", action: "Toggle theme", enabled: true },
  ];

  const [commands, setCommands] = useState(voiceCommands);

  const toggleCommand = (index: number) => {
    setCommands((prev) =>
      prev.map((c, i) => (i === index ? { ...c, enabled: !c.enabled } : c))
    );
    toast.success("Command setting updated");
  };

  const startListening = () => {
    if (!voiceEnabled) {
      toast.error("Enable voice input first");
      return;
    }
    setIsListening(true);
    toast.info("Listening... Speak a command");
    
    setIsListening(false);
    toast.info("Voice input is not yet available in this demo.");
  };

  const stopListening = () => {
    setIsListening(false);
    toast.info("Stopped listening");
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
                    {voiceEnabled ? (
                      <Mic className="h-6 w-6 text-primary" />
                    ) : (
                      <MicOff className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Voice Input</p>
                    <p className="text-sm text-muted-foreground">
                      Control Peys with your voice
                    </p>
                  </div>
                </div>
                <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
              </div>
            </CardContent>
          </Card>

          <Card className={`${isListening ? "border-primary animate-pulse" : ""}`}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
                    isListening
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isListening ? (
                    <div className="flex flex-col items-center">
                      <Mic className="h-10 w-10 animate-pulse" />
                      <span className="text-xs mt-1">Listening</span>
                    </div>
                  ) : (
                    <Mic className="h-10 w-10" />
                  )}
                </div>

                {isListening && (
                  <div className="w-full mb-4">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="w-1 bg-primary rounded-full animate-bounce"
                          style={{
                            height: `${Math.random() * 20 + 10}px`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      Say "Send 50 dollars to Alice" or "Check my balance"
                    </p>
                  </div>
                )}

                {transcript && !isListening && (
                  <div className="w-full mb-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Recognized:</p>
                    <p className="font-medium">{transcript}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline">{confidence}% confidence</Badge>
                      {lastCommand && (
                        <span className="text-xs text-green-500">
                          <CheckCircle2 className="h-3 w-3 inline mr-1" />
                          {lastCommand}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 w-full">
                  {isListening ? (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={stopListening}
                    >
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={startListening}
                      disabled={!voiceEnabled}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Start Listening
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {showSettings && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Voice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="zh-CN">Chinese</option>
                    <option value="ja-JP">Japanese</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Auto-punctuation</p>
                    <p className="text-xs text-muted-foreground">
                      Add punctuation automatically
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Sound feedback</p>
                    <p className="text-xs text-muted-foreground">
                      Play sound when listening starts/stops
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Voice Commands</CardTitle>
              <CardDescription>
                Available voice commands
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {commands.map((cmd, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">"{cmd.command}"</p>
                    <p className="text-xs text-muted-foreground">{cmd.action}</p>
                  </div>
                  <Switch
                    checked={cmd.enabled}
                    onCheckedChange={() => toggleCommand(index)}
                    disabled={!voiceEnabled}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Tips</p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>Speak clearly and at a normal pace</li>
                    <li>Use the wake word "Hey Peys" for hands-free activation</li>
                    <li>Voice input works best in quiet environments</li>
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
