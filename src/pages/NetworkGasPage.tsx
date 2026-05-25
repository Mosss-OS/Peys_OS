import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Fuel,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Gauge,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface GasPrice {
  slow: { price: string; time: string; gwei: number };
  standard: { price: string; time: string; gwei: number };
  fast: { price: string; time: string; gwei: number };
  instant: { price: string; time: string; gwei: number };
}

interface NetworkStats {
  name: string;
  chainId: number;
  blockNumber: number;
  avgBlockTime: string;
  congestion: number;
  gasLimit: number;
  gasUsed: number;
}

const mockGasPrices: Record<string, GasPrice> = {
  Base: {
    slow: { price: "$0.05", time: "~5 min", gwei: 15 },
    standard: { price: "$0.10", time: "~2 min", gwei: 25 },
    fast: { price: "$0.25", time: "~30 sec", gwei: 50 },
    instant: { price: "$0.50", time: "~15 sec", gwei: 100 },
  },
  Ethereum: {
    slow: { price: "$2.50", time: "~10 min", gwei: 20 },
    standard: { price: "$5.00", time: "~3 min", gwei: 35 },
    fast: { price: "$12.00", time: "~1 min", gwei: 80 },
    instant: { price: "$25.00", time: "~30 sec", gwei: 150 },
  },

};

const mockNetworks: NetworkStats[] = [
  {
    name: "Base",
    chainId: 8453,
    blockNumber: 18543210,
    avgBlockTime: "2 sec",
    congestion: 45,
    gasLimit: 15000000,
    gasUsed: 8500000,
  },

];

export default function NetworkGasPage() {
  const [selectedNetwork, setSelectedNetwork] = useState("Base");
  const [gasTip, setGasTip] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const currentGas = mockGasPrices[selectedNetwork];
  const currentNetwork = mockNetworks.find((n) => n.name === selectedNetwork) || mockNetworks[0];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date());
      toast.success("Gas prices updated!");
    }, 1000);
  };

  const congestionColor =
    currentNetwork.congestion < 30
      ? "text-green-500"
      : currentNetwork.congestion < 70
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container px-4 py-6 pb-24 mx-auto max-w-2xl">
        <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Fuel className="h-5 w-5" />
                  Gas Tracker
                </CardTitle>
                <CardDescription>
                  Updated {lastUpdated.toLocaleTimeString()}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <TabsList className="grid w-full grid-cols-3">
                {Object.keys(mockGasPrices).map((network) => (
                  <TabsTrigger key={network} value={network}>
                    {network}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedNetwork} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-green-500/5 border-green-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-green-500 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Slow</span>
                      </div>
                      <p className="text-2xl font-bold">{currentGas.slow.price}</p>
                      <p className="text-xs text-muted-foreground">{currentGas.slow.gwei} Gwei</p>
                      <p className="text-xs text-muted-foreground mt-1">{currentGas.slow.time}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-blue-500 mb-1">
                        <Zap className="h-4 w-4" />
                        <span className="text-sm font-medium">Standard</span>
                      </div>
                      <p className="text-2xl font-bold">{currentGas.standard.price}</p>
                      <p className="text-xs text-muted-foreground">{currentGas.standard.gwei} Gwei</p>
                      <p className="text-xs text-muted-foreground mt-1">{currentGas.standard.time}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-orange-500/5 border-orange-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-orange-500 mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">Fast</span>
                      </div>
                      <p className="text-2xl font-bold">{currentGas.fast.price}</p>
                      <p className="text-xs text-muted-foreground">{currentGas.fast.gwei} Gwei</p>
                      <p className="text-xs text-muted-foreground mt-1">{currentGas.fast.time}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-500/5 border-purple-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-purple-500 mb-1">
                        <Gauge className="h-4 w-4" />
                        <span className="text-sm font-medium">Instant</span>
                      </div>
                      <p className="text-2xl font-bold">{currentGas.instant.price}</p>
                      <p className="text-xs text-muted-foreground">{currentGas.instant.gwei} Gwei</p>
                      <p className="text-xs text-muted-foreground mt-1">{currentGas.instant.time}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Priority Tip (extra gas for miners)
                    </p>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[gasTip]}
                        onValueChange={(v) => setGasTip(v[0])}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <Badge variant="outline">{gasTip} Gwei</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: {currentGas.standard.gwei} Gwei for most transactions
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Network Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Block</span>
              <span className="font-mono font-medium">
                {currentNetwork.blockNumber.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Avg Block Time</span>
              <span>{currentNetwork.avgBlockTime}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Network Congestion</span>
              <div className="flex items-center gap-2">
                <span className={congestionColor}>{currentNetwork.congestion}%</span>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${congestionColor.replace("text-", "bg-")}`}
                    style={{ width: `${currentNetwork.congestion}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Gas Limit</span>
              <span>{currentNetwork.gasLimit.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Gas Used</span>
              <span>{currentNetwork.gasUsed.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Chain ID</span>
              <Badge variant="outline">{currentNetwork.chainId}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Gas Saving Tips</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2">
                    <ArrowDownRight className="h-3 w-3 mt-0.5" />
                    Send during off-peak hours (weekends, late nights) for lower fees
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowDownRight className="h-3 w-3 mt-0.5" />
                    Batch multiple transactions to reduce per-transaction overhead
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowDownRight className="h-3 w-3 mt-0.5" />
                    Use Standard speed for non-urgent transfers to save up to 50%
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Networks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockNetworks.map((network) => (
              <div
                key={network.chainId}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{network.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Block #{network.blockNumber.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-medium ${
                      network.congestion < 30
                        ? "text-green-500"
                        : network.congestion < 70
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {network.congestion}%
                  </p>
                  <p className="text-xs text-muted-foreground">Congestion</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
