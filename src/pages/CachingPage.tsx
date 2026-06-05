import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Zap,
  Activity,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface CacheStats {
  totalSize: string;
  items: number;
  hitRate: number;
  lastCleared: string;
}

interface CacheType {
  name: string;
  size: string;
  items: number;
  hitRate: number;
}

export default function CachingPage() {
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalSize: "0 MB",
    items: 0,
    hitRate: 0,
    lastCleared: "",
  });

  const [enableCaching, setEnableCaching] = useState(true);
  const [cacheStrategy, setCacheStrategy] = useState("stale-while-revalidate");
  const [cacheSize, setCacheSize] = useState(50);
  const [clearInProgress, setClearInProgress] = useState(false);
  const [cacheTypes, setCacheTypes] = useState<CacheType[]>([]);

  const handleClearCache = () => {
    setClearInProgress(true);
    setCacheStats((prev) => ({
      ...prev,
      totalSize: "0 MB",
      items: 0,
      lastCleared: "Just now",
    }));
    setClearInProgress(false);
    toast.success("Cache cleared successfully");
  };

  const handleClearType = (type: string) => {
    toast.success(`${type} cache cleared`);
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
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Caching Settings</p>
                    <p className="text-sm text-muted-foreground">
                      Improve performance with smart caching
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cache Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{cacheStats.totalSize}</p>
                  <p className="text-xs text-muted-foreground">Total Size</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{cacheStats.items}</p>
                  <p className="text-xs text-muted-foreground">Cached Items</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cache Hit Rate</span>
                  <span className="font-medium">{cacheStats.hitRate}%</span>
                </div>
                <Progress value={cacheStats.hitRate} className="h-2" />
              </div>

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Last cleared</span>
                <span>{cacheStats.lastCleared}</span>
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleClearCache}
                disabled={clearInProgress}
              >
                {clearInProgress ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Cache
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cache Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Caching</p>
                  <p className="text-xs text-muted-foreground">
                    Store frequently accessed data locally
                  </p>
                </div>
                <Switch checked={enableCaching} onCheckedChange={setEnableCaching} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cache Size Limit</span>
                  <span className="font-medium">{cacheSize} MB</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={200}
                  step={10}
                  value={cacheSize}
                  onChange={(e) => setCacheSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Cache Strategy</p>
                <select
                  value={cacheStrategy}
                  onChange={(e) => setCacheStrategy(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="cache-first">Cache First</option>
                  <option value="network-first">Network First</option>
                  <option value="stale-while-revalidate">Stale While Revalidate</option>
                  <option value="cache-only">Cache Only</option>
                  <option value="network-only">Network Only</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cache by Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cacheTypes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No cached data</div>
              ) : (
                cacheTypes.map((type) => (
                  <div
                    key={type.name}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{type.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {type.items} items - {type.size}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{type.hitRate}% hit rate</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearType(type.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Performance Tip</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Caching can significantly improve app performance by reducing
                    network requests. We recommend keeping cache enabled with a
                    size limit of 50-100MB.
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
