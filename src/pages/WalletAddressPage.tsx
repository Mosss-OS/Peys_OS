import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  CheckCircle2,
  QrCode,
  Share2,
  Download,
  Shield,
  Eye,
  EyeOff,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Wallet,
  Sparkles,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";

export default function WalletAddressPage() {
  const { isLoggedIn, walletAddress } = useApp();
  const [copied, setCopied] = useState<string | null>(null);
  const [showFullAddress, setShowFullAddress] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<{id: string, label: string, address: string, type: string, ens: string | null, createdAt: string, used: number}[]>([]);

  useEffect(() => {
    if (walletAddress) {
      setAddresses([
        {
          id: "1",
          label: "Main Wallet",
          address: walletAddress,
          type: "default",
          ens: null,
          createdAt: new Date().toISOString().split("T")[0],
          used: 0,
        },
      ]);
    }
  }, [walletAddress]);

  const selectedAddress = addresses[0] || { id: "", label: "", address: "", type: "", ens: null, createdAt: "", used: 0 };

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    toast.success("Address copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = (address: string) => {
    if (navigator.share) {
      navigator.share({
        title: "My Peys Wallet Address",
        text: address,
      });
    } else {
      handleCopy(address);
    }
  };

  const shortAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container px-4 py-6 pb-24 mx-auto max-w-2xl">
        <div className="space-y-6">
          <Tabs defaultValue="receive" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="receive">Receive</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="ens">ENS</TabsTrigger>
          </TabsList>

          <TabsContent value="receive" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  {selectedAddress.label}
                </CardTitle>
                <CardDescription>
                  Share this address to receive payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center p-4 bg-muted/50 rounded-lg">
                  <div className="bg-white p-4 rounded-lg">
                    <QrCode className="h-48 w-48" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="font-mono text-sm">
                      {showFullAddress === selectedAddress.id
                        ? selectedAddress.address
                        : shortAddress(selectedAddress.address)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setShowFullAddress(
                            showFullAddress === selectedAddress.id
                              ? null
                              : selectedAddress.id
                          )
                        }
                      >
                        {showFullAddress === selectedAddress.id ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(selectedAddress.address)}
                      >
                        {copied === selectedAddress.address ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleShare(selectedAddress.address)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCopy(selectedAddress.address)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <Shield className="h-3 w-3" />
                  <span>Only send {selectedAddress.type === "default" ? "PUSDC" : "ERC-20 tokens"} to this address</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      selectedAddress.id === addr.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedAddress(addr)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{addr.label}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {shortAddress(addr.address)}
                        </p>
                      </div>
                    </div>
                    {selectedAddress.id === addr.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">My Addresses</CardTitle>
                    <CardDescription>
                      Manage your wallet addresses and labels
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{addr.label}</p>
                          {addr.type === "default" && (
                            <Badge variant="outline" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">
                          {shortAddress(addr.address)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {addr.type !== "default" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Address Usage</CardTitle>
                <CardDescription>
                  How many times each address has been used
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {addresses.map((addr) => (
                  <div key={addr.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{addr.label}</span>
                      <span className="text-muted-foreground">{addr.used} transactions</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(addr.used / 50) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium">Privacy Tip</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      For better privacy, consider using a new address for each transaction.
                      Peys makes this easy with auto-generated addresses.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ens" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ENS Names</CardTitle>
                <CardDescription>
                  Your Peys ENS names for easy addresses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {addresses.length > 0 && [{ address: addresses[0].address, name: addresses[0].ens || "No ENS" }].map((ens: any) => (
                  <div
                    key={ens.address}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium font-mono">{ens.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {shortAddress(ens.address)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Register ENS</CardTitle>
                <CardDescription>
                  Get a personalized .peyd.eth name
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Choose a name"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2"
                  />
                  <Button>.peyd.eth</Button>
                </div>
                <Button className="w-full">
                  Register Name (0.005 ETH/year)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
