import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Globe,
  Zap,
  Shield,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
  DollarSign,
  Clock,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Network {
  id: string;
  name: string;
  chainId: number;
  status: "active" | "coming_soon" | "mainnet";
  description: string;
  features: string[];
  gasPrice: string;
}

const networks: Network[] = [
  {
    id: "base",
    name: "Base Mainnet",
    chainId: 8453,
    status: "mainnet",
    description: "Optimism's Layer 2 on Ethereum. Fast, cheap, and secure.",
    features: ["Fast transactions", "Low gas fees", "Ethereum security", "OP Stack"],
    gasPrice: "$0.01-0.10",
  },
  {
    id: "ethereum",
    name: "Ethereum Mainnet",
    chainId: 1,
    status: "active",
    description: "The world's leading smart contract platform.",
    features: ["Most secure", "Largest ecosystem", "Highest liquidity", "DeFi hub"],
    gasPrice: "$1.00-10.00",
  },
  {
    id: "arbitrum",
    name: "Arbitrum One",
    chainId: 42161,
    status: "coming_soon",
    description: "Ethereum Layer 2 with Nitro technology.",
    features: ["Low fees", "EVM compatible", "AnyTrust", "Nova"],
    gasPrice: "Coming soon",
  },
  {
    id: "optimism",
    name: "Optimism",
    chainId: 10,
    status: "coming_soon",
    description: "Layer 2 scaling solution for Ethereum.",
    features: ["OP Stack", "Fast withdrawals", "Low cost", "Governance"],
    gasPrice: "Coming soon",
  },
];

export default function MultiChainPage() {
  const [activeNetworks, setActiveNetworks] = useState(["base", "ethereum", "celo"]);
  const [autoSwitch, setAutoSwitch] = useState(true);

  const toggleNetwork = (id: string) => {
    if (activeNetworks.includes(id)) {
      if (activeNetworks.length > 1) {
        setActiveNetworks((prev) => prev.filter((n) => n !== id));
        toast.info(`Network removed from active list`);
      } else {
        toast.error("You must have at least one active network");
      }
    } else {
      setActiveNetworks((prev) => [...prev, id]);
      toast.success(`Network added to active list`);
    }
  };

  const getStatusConfig = (status: Network["status"]) => {
    switch (status) {
      case "mainnet":
        return { label: "Production", class: "bg-green-500 text-white" };
      case "active":
        return { label: "Active", class: "bg-blue-500 text-white" };
      case "coming_soon":
        return { label: "Coming Soon", class: "bg-yellow-500 text-white" };
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
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Multi-Chain Support</p>
                  <p className="text-sm text-muted-foreground">
                    Connect to multiple blockchain networks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Network Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto Network Switch</p>
                  <p className="text-xs text-muted-foreground">
                    Automatically switch to best network for transactions
                  </p>
                </div>
                <Switch checked={autoSwitch} onCheckedChange={setAutoSwitch} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Active Networks</p>
                  <p className="text-xs text-muted-foreground">
                    {activeNetworks.length} network(s) enabled
                  </p>
                </div>
                <Badge variant="outline">{activeNetworks.length} / {networks.length}</Badge>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Network</span>
                  <span className="font-medium">Base</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Chain ID</span>
                  <span className="font-mono">8453</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Networks</CardTitle>
              <CardDescription>
                Select networks to use with Peys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {networks.map((network) => {
                const statusConfig = getStatusConfig(network.status);
                const isActive = activeNetworks.includes(network.id);
                return (
                  <div
                    key={network.id}
                    className={`p-4 rounded-lg border ${
                      isActive ? "border-primary bg-primary/5" : ""
                    } ${network.status === "coming_soon" ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{network.name}</p>
                          <Badge className={statusConfig.class}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {network.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {network.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-muted px-2 py-1 rounded"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Gas: {network.gasPrice}
                        </p>
                      </div>
                      <div className="ml-4">
                        {network.status === "coming_soon" ? (
                          <Button variant="outline" size="sm" disabled>
                            <Clock className="h-4 w-4 mr-1" />
                            Soon
                          </Button>
                        ) : (
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => toggleNetwork(network.id)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Production Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="font-medium">Base Mainnet</p>
                  <p className="text-xs text-muted-foreground">Production Ready</p>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="font-medium">Ethereum Mainnet</p>
                  <p className="text-xs text-muted-foreground">Production Ready</p>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="font-medium">Celo Mainnet</p>
                  <p className="text-xs text-muted-foreground">Production Ready</p>
                </div>
                <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <p className="font-medium">More Networks</p>
                  <p className="text-xs text-muted-foreground">Coming Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-500">Production Networks</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Base, Ethereum, and Celo mainnets are fully supported in production.
                    Additional networks (Polkadot, Arbitrum, Optimism) are planned for future releases.
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
