import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Command,
  Search,
  Send,
  Home,
  Settings,
  Plus,
  Copy,
  RefreshCw,
  Bell,
  Moon,
  Keyboard,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Shortcut {
  key: string;
  description: string;
  category: string;
  custom?: boolean;
}

const defaultShortcuts: Shortcut[] = [
  { key: "Ctrl + K", description: "Open command palette", category: "General" },
  { key: "Ctrl + N", description: "New payment", category: "Payments" },
  { key: "Ctrl + S", description: "Search contacts", category: "General" },
  { key: "Ctrl + Enter", description: "Send payment", category: "Payments" },
  { key: "Ctrl + C", description: "Copy address", category: "General" },
  { key: "Ctrl + B", description: "Toggle sidebar", category: "Navigation" },
  { key: "Ctrl + ,", description: "Open settings", category: "Settings" },
  { key: "Ctrl + /", description: "Show keyboard shortcuts", category: "Help" },
  { key: "Escape", description: "Close modal/dialog", category: "General" },
  { key: "Tab", description: "Next field", category: "Forms" },
  { key: "Shift + Tab", description: "Previous field", category: "Forms" },
  { key: "Enter", description: "Submit form", category: "Forms" },
  { key: "Space", description: "Play/pause", category: "Media" },
  { key: "Arrow Up/Down", description: "Navigate list", category: "Navigation" },
  { key: "Ctrl + D", description: "Toggle dark mode", category: "Settings" },
  { key: "Ctrl + R", description: "Refresh page", category: "General" },
];

const categories = ["General", "Payments", "Navigation", "Settings", "Forms", "Help", "Media"];

export default function KeyboardShortcutsPage() {
  const [shortcuts, setShortcuts] = useState(defaultShortcuts);
  const [searchQuery, setSearchQuery] = useState("");
  const [enableShortcuts, setEnableShortcuts] = useState(true);
  const [recordMode, setRecordMode] = useState(false);

  const filteredShortcuts = shortcuts.filter(
    (s) =>
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedShortcuts = categories.reduce((acc, category) => {
    acc[category] = filteredShortcuts.filter((s) => s.category === category);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const handleRecord = () => {
    setRecordMode(true);
    toast.info("Recording... Press a key combination to assign");
    setTimeout(() => setRecordMode(false), 10000);
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
                    <Keyboard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Keyboard Shortcuts</p>
                    <p className="text-sm text-muted-foreground">
                      Work faster with keyboard shortcuts
                    </p>
                  </div>
                </div>
                <Switch checked={enableShortcuts} onCheckedChange={setEnableShortcuts} />
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRecord}>
              <Plus className="h-4 w-4 mr-1" />
              Add Custom
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset All
            </Button>
          </div>

          {Object.entries(groupedShortcuts).map(([category, items]) => {
            if (items.length === 0) return null;
            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-2">
                        {shortcut.custom && (
                          <Badge variant="outline" className="text-xs">
                            Custom
                          </Badge>
                        )}
                        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                          {shortcut.key}
                        </kbd>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl + /</kbd> anywhere to open this page</p>
              <p>Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd> to navigate between fields</p>
              <p>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">?</kbd> to show keyboard shortcuts overlay</p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
