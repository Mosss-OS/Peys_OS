import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Download,
  Share2,
  Printer,
  Copy,
  Send,
  QrCode,
  Mail,
  ExternalLink,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ReceiptData {
  id: string;
  txHash: string;
  amount: string;
  currency: string;
  cryptoAmount: string;
  cryptoCurrency: string;
  status: string;
  type: string;
  from: string;
  to: string;
  timestamp: string;
  fee: string;
  feeCurrency: string;
  memo: string;
  merchantName: string;
  merchantVerified: boolean;
  blockNumber: number;
  confirmations: number;
  gasPrice: string;
  gasUsed: string;
  network: string;
}

export default function ReceiptPage() {
  const { id } = useParams();
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchReceipt();
    }
  }, [id]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const { data: payment, error } = await supabase
        .from("payments")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !payment) {
        toast.error("Receipt not found");
        setLoading(false);
        return;
      }

      const isSender = true;
      setReceipt({
        id: payment.id,
        txHash: payment.tx_hash || "",
        amount: (Number(payment.amount) / 1000000).toString(),
        currency: "USD",
        cryptoAmount: (Number(payment.amount) / 1000000).toString(),
        cryptoCurrency: payment.token || "USDC",
        status: payment.status,
        type: isSender ? "payment_sent" : "payment_received",
        from: payment.sender_wallet || "",
        to: payment.recipient_email || "",
        timestamp: payment.created_at,
        fee: "0.00",
        feeCurrency: payment.token || "USDC",
        memo: payment.memo || "",
        merchantName: payment.recipient_email || "",
        merchantVerified: false,
        blockNumber: 0,
        confirmations: 12,
        gasPrice: "0",
        gasUsed: "0",
        network: "Base",
      });
    } catch (err) {
      console.error("Error fetching receipt:", err);
      toast.error("Failed to load receipt");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/receipt/${id}`);
    setCopied(true);
    toast.success("Receipt link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Payment Receipt #${receipt.id}`,
          text: `Payment of ${receipt.currency} ${receipt.amount} sent to ${receipt.merchantName}`,
          url: window.location.href,
        });
      } catch {
        toast.info("Share cancelled");
      }
    } else {
      handleCopyLink();
    }
  };

  const handleEmailReceipt = () => {
    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      toast.success("Receipt sent to your email!");
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.success("PDF receipt downloading...");
  };

  const statusConfig = {
    completed: { label: "Completed", class: "bg-green-500", icon: CheckCircle2 },
    pending: { label: "Pending", class: "bg-yellow-500", icon: Loader2 },
    failed: { label: "Failed", class: "bg-red-500", icon: Loader2 },
  };

  const status = statusConfig[receipt.status as keyof typeof statusConfig];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container px-4 py-6 pb-24 mx-auto max-w-2xl">
        <div className="space-y-6">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-green-500/20 p-3 mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <Badge className={`${status.class} text-white mb-3`}>
                {status.label}
              </Badge>
              <h2 className="text-3xl font-bold">
                {receipt.currency} {receipt.amount}
              </h2>
              <p className="text-muted-foreground mt-1">
                {receipt.cryptoAmount} {receipt.cryptoCurrency}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Paid to {receipt.merchantName}
                {receipt.merchantVerified && (
                  <Badge variant="secondary" className="ml-2 h-5 text-xs">
                    Verified
                  </Badge>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Transaction ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{receipt.id}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    navigator.clipboard.writeText(receipt.id);
                    toast.success("Copied!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Date & Time</span>
              <span>{new Date(receipt.timestamp).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Network</span>
              <Badge variant="outline">{receipt.network}</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Block Number</span>
              <span className="font-mono">{receipt.blockNumber.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Confirmations</span>
              <span>{receipt.confirmations}</span>
            </div>

            {receipt.memo && (
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Note</span>
                <span className="text-right max-w-[200px]">{receipt.memo}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Blockchain Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Transaction Hash</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{receipt.txHash.slice(0, 10)}...</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    navigator.clipboard.writeText(receipt.txHash);
                    toast.success("Hash copied!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">From</span>
              <span className="font-mono text-sm">{receipt.from}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">To</span>
              <span className="font-mono text-sm">{receipt.to}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Gas Used</span>
              <span>{receipt.gasUsed}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Gas Price</span>
              <span>{receipt.gasPrice} Gwei</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Network Fee</span>
              <span>{receipt.fee} {receipt.feeCurrency}</span>
            </div>

            <div className="pt-2">
              <Button variant="outline" className="w-full" asChild>
                <a
                  href={`https://basescan.org/tx/${receipt.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Block Explorer
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" onClick={handleEmailReceipt} disabled={sendingEmail}>
              {sendingEmail ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Email
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link to="/send">
              <Send className="h-4 w-4 mr-2" />
              New Payment
            </Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
