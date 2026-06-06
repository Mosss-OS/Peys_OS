/** CrossChainPage - Cross-chain bridge interface for transferring assets between networks. */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeftRight,
  Zap,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Info,
  Lock,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Chain {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  status: "active" | "coming_soon" | "beta";
  gasPrice: string;
  avgTime: string;
}

interface BridgeRoute {
  from: string;
  to: string;
  fee: string;
  time: string;
  minAmount: string;
  maxAmount: string;
}

const chains: Chain[] = [
  { id: "base", name: "Base", symbol: "ETH", icon: "🔵", color: "bg-blue-500", status: "active", gasPrice: "$0.10", avgTime: "2-5 min" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", icon: "🔷", color: "bg-purple-500", status: "active", gasPrice: "$3.50", avgTime: "10-30 min" },
  { id: "solana", name: "Solana", symbol: "SOL", icon: "🌊", color: "bg-gradient-to-r from-purple-500 to-blue-500", status: "beta", gasPrice: "$0.25", avgTime: "3-10 sec" },
];

const bridgeRoutes: BridgeRoute[] = [
  { from: "Ethereum", to: "Base", fee: "0.1%", time: "10-30 min", minAmount: "$10", maxAmount: "$50,000" },
];

/** Cross-chain bridge page for selecting source/destination chains and transferring assets. */
export default function CrossChainPage() {
  const [fromChain, setFromChain] = useState("ethereum");
  const [toChain, setToChain] = useState("base");
  const [amount, setAmount] = useState("");
  const [bridging, setBridging] = useState(false);

  const handleBridge = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setBridging(true);
    // Bridge functionality coming soon
    setBridging(false);
    toast.info("Cross-chain bridging is not yet available in this demo.");
  };

  const handleSwapChains = () => {
    setFromChain(toChain);
    setToChain(fromChain);
  };

  const getStatusBadge = (status: Chain["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case "beta":
        return <Badge className="bg-yellow-500 text-white">Beta</Badge>;
      case "coming_soon":
        return <Badge variant="outline">Coming Soon</Badge>;
    }
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
                  <ArrowLeftRight className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Cross-Chain Bridge</p>
                  <p className="text-sm text-muted-foreground">
                    Transfer assets across multiple chains
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bridge Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <select
                  value={fromChain}
                  onChange={(e) => setFromChain(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {chains.map((chain) => (
                    <option key={chain.id} value={chain.id} disabled={chain.status === "coming_soon"}>
                      {chain.icon} {chain.name} {chain.status === "coming_soon" ? "(Coming Soon)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center">
                <Button variant="ghost" size="icon" onClick={handleSwapChains}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <select
                  value={toChain}
                  onChange={(e) => setToChain(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {chains.map((chain) => (
                    <option key={chain.id} value={chain.id} disabled={chain.status === "coming_soon"}>
                      {chain.icon} {chain.name} {chain.status === "coming_soon" ? "(Coming Soon)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>

              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Fee</span>
                  <span>~0.15%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Time</span>
                  <span>10-30 min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gas Cost</span>
                  <span>~$3.50</span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleBridge}
                disabled={bridging || fromChain === toChain}
              >
                {bridging ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Bridging...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Bridge Assets
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="chains" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chains">Chains</TabsTrigger>
              <TabsTrigger value="routes">Routes</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="chains" className="space-y-3">
              {chains.map((chain) => (
                <Card key={chain.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${chain.color} flex items-center justify-center text-xl`}>
                          {chain.icon}
                        </div>
                        <div>
                          <p className="font-medium">{chain.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Gas: {chain.gasPrice} | Time: {chain.avgTime}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(chain.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="routes" className="space-y-3">
              {bridgeRoutes.map((route, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{route.from}</span>
                        <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                        <span>{route.to}</span>
                      </div>
                      <Badge variant="outline">{route.fee} fee</Badge>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Time: {route.time}</span>
                      <span>{route.minAmount} - {route.maxAmount}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No bridge history yet</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="bg-yellow-500/10 border-yellow-500/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-500">Coming Soon</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Full cross-chain bridging via LayerZero is coming soon. Currently in testing phase.
                    Join our Discord for early access to cross-chain features.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Join Discord
                  </Button>
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
