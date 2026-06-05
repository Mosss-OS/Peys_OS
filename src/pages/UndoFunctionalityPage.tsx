import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Undo2,
  RotateCcw,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info,
  History,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface UndoableAction {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  canUndo: boolean;
  data: unknown;
}

export default function UndoFunctionalityPage() {
  const [undoEnabled, setUndoEnabled] = useState(true);
  const [undoTimeout, setUndoTimeout] = useState(10);
  const [history, setHistory] = useState<UndoableAction[]>([]);
  const [undoCount, setUndoCount] = useState(3);

  const handleUndo = useCallback((id: string) => {
    const action = history.find((h) => h.id === id);
    if (action && action.canUndo) {
      setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, canUndo: false } : h)));
      setUndoCount((prev) => prev - 1);
      toast.success(`Undone: ${action.description}`);
    }
  }, [history]);

  const handleUndoLast = () => {
    const undoableAction = history.find((h) => h.canUndo);
    if (undoableAction) {
      handleUndo(undoableAction.id);
    } else {
      toast.info("No actions to undo");
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    toast.success("History cleared");
  };

  const formatTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payment":
        return "💸";
      case "contact":
        return "👤";
      case "settings":
        return "⚙️";
      default:
        return "📝";
    }
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
                    <Undo2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Undo Functionality</p>
                    <p className="text-sm text-muted-foreground">
                      {undoCount} action(s) can be undone
                    </p>
                  </div>
                </div>
                <Switch checked={undoEnabled} onCheckedChange={setUndoEnabled} />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleUndoLast}
              disabled={!undoEnabled || undoCount === 0}
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Undo Last ({undoCount})
            </Button>
            <Button
              variant="outline"
              onClick={handleClearHistory}
              disabled={history.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Undo Timeout</span>
                  <span className="font-medium">{undoTimeout} seconds</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={undoTimeout}
                  onChange={(e) => setUndoTimeout(Number(e.target.value))}
                  className="w-full"
                  disabled={!undoEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  Actions can be undone within {undoTimeout} seconds
                </p>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Allow Multiple Undos</p>
                  <p className="text-xs text-muted-foreground">
                    Undo multiple actions in sequence
                  </p>
                </div>
                <Switch defaultChecked disabled={!undoEnabled} />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Show Undo Toast</p>
                  <p className="text-xs text-muted-foreground">
                    Display toast with undo button
                  </p>
                </div>
                <Switch defaultChecked disabled={!undoEnabled} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Actions</CardTitle>
              <CardDescription>Actions that can be undone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No recent actions</p>
                </div>
              ) : (
                history.map((action) => (
                  <div
                    key={action.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      action.canUndo ? "bg-muted/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getTypeIcon(action.type)}</span>
                      <div>
                        <p className="font-medium text-sm">{action.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(action.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {action.canUndo ? (
                        <Badge variant="outline" className="text-green-500 border-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Can undo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                      {action.canUndo && undoEnabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUndo(action.id)}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Undo Limitations</p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>Payments can be undone within {undoTimeout}s before blockchain confirmation</li>
                    <li>Some actions cannot be undone (e.g., completed transactions)</li>
                    <li>Contact deletions are permanent</li>
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
