import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Copy, Check, ArrowLeft, X, Share2, Loader2, ChevronDown, Wallet, Mail, Phone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Link, useSearchParams } from "react-router-dom";
import PaymentCard from "@/components/PaymentCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { useEscrow, getChainConfig } from "@/hooks/useEscrow";
import { Address, getEventSelector, parseAbiItem, decodeEventLog } from "viem";
import { usePublicClient, useAccount, useSwitchChain, useChainId } from "wagmi";
import { usePrivyAuth } from "@/contexts/PrivyContext";
import { sanitizeEmail, sanitizeString } from "@/utils/sanitize";

type Token = "USDC" | "USDT" | "PASS" | "G$";

interface NetworkOption {
  id: number;
  name: string;
  shortName: string;
  color: string;
  blockExplorer: string;
}

const networks: NetworkOption[] = [
  { id: 84532, name: "Base Sepolia", shortName: "Base", color: "#0056FF", blockExplorer: "https://sepolia.basescan.org" },
];

export default function PublicPaymentPage() {
  const [searchParams] = useSearchParams();
  const { isLoggedIn, login, user: appUser } = usePrivyAuth();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<Token>("USDC");
  const [selectedNetwork, setSelectedNetwork] = useState<number>(84532);
  const [recipient, setRecipient] = useState(() => {
    const raw = searchParams.get("recipient") || "";
    return sanitizeEmail(raw);
  });
  const [recipientType, setRecipientType] = useState<"email" | "phone">("email");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "sending" | "done">("form");
  const [sendingPhase, setSendingPhase] = useState<"approving" | "creating" | "waiting">("waiting");
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [claimId, setClaimId] = useState("");
  const [txHash, setTxHash] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [fullLink, setFullLink] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);

  const { createPayment } = useEscrow();
  const publicClient = usePublicClient();
  const { chain: connectedChain } = useAccount();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const walletAddress = appUser?.walletAddress;

  useEffect(() => {
    if (connectedChain?.id && networks.find(n => n.id === connectedChain.id)) {
      setSelectedNetwork(connectedChain.id);
    }
  }, [connectedChain]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (networkRef.current && !networkRef.current.contains(e.target as Node)) {
        setShowNetworkSelector(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentNetwork = networks.find(n => n.id === selectedNetwork) || networks[0];

  const handleNetworkChange = async (networkId: number) => {
    setSelectedNetwork(networkId);
    setShowNetworkSelector(false);
    if (switchChain && networkId !== chainId) {
      try {
        switchChain({ chainId: networkId });
      } catch (err) {
        console.log("Wallet switch rejected");
      }
    }
  };

  const handleConnect = () => {
    login();
  };

  const handleSend = async () => {
    if (!isLoggedIn || !walletAddress) { 
      handleConnect();
      return;
    }
    if (step === "form") {
      if (!recipient) {
        toast.error(recipientType === "email" ? "Please enter recipient email" : "Please enter phone number");
        return;
      }
      if (recipientType === "email" && !recipient.includes("@")) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (!amount || Number(amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      setStep("confirm");
      return;
    }

    if (step === "confirm") {
      setStep("sending");
      setSendingPhase("waiting");

      try {
        if (!isLoggedIn || !walletAddress) {
          toast.error("Please connect your wallet first");
          setStep("form");
          return;
        }

        const newClaimId = uuidv4();
        const claimSecret = uuidv4();
        const paymentId = `peys_${newClaimId.replace(/-/g, "").slice(0, 16)}`;
        const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
        const link = `${appUrl}/claim/${newClaimId}`;
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const recipientValue = recipientType === "phone" 
          ? `+${recipient.replace(/\D/g, "")}` 
          : recipient;

        const { data: payment, error } = await supabase
          .from("payments")
          .insert({
            payment_id: paymentId,
            sender_user_id: null,
            sender_email: "",
            sender_wallet: walletAddress,
            recipient_email: recipientValue,
            recipient_phone: recipientType === "phone" ? recipientValue : null,
            amount: Number(amount),
            token,
            memo: memo || null,
            claim_secret: claimSecret,
            claim_link: newClaimId,
            status: "pending",
            expires_at: expiresAt,
          })
          .select()
          .single();

        if (error) throw error;

        const chainId = selectedNetwork;
        const chainConfig = getChainConfig(chainId);
        let tokenAddress: string;
        if (token === "PASS") {
          tokenAddress = chainConfig.passAddress;
        } else if (token === "USDC") {
          tokenAddress = chainConfig.usdcAddress;
        } else if (token === "G$") {
          tokenAddress = chainConfig.gdAddress;
        } else {
          tokenAddress = chainConfig.usdtAddress;
        }
        
        const amountBigInt = token === "PASS" || token === "G$"
          ? BigInt(Number(amount) * 1000000000000000000)
          : BigInt(Number(amount) * 1000000);
        const expiryDays = 7;

        setSendingPhase("approving");
        
        let txHash;
        try {
          txHash = await createPayment(
            tokenAddress as Address,
            amountBigInt,
            claimSecret,
            memo || "",
            expiryDays,
            () => setSendingPhase("approving"),
            () => setSendingPhase("creating")
          );
        } catch (txError: unknown) {
          const errorMsg = (txError as Error).message || '';
          if (errorMsg.includes('user rejected') || errorMsg.includes('cancelled')) {
            throw new Error("Transaction was not confirmed. Please click 'Confirm' in your wallet.");
          }
          throw new Error(`Transaction failed: ${errorMsg}`);
        }

        if (!txHash) throw new Error("Failed to create transaction");

        setTxHash(txHash);

        if (!publicClient) throw new Error("Public client not available");
        
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        
        const paymentCreatedTopic = getEventSelector(parseAbiItem('event PaymentCreated(bytes32 indexed paymentId, address indexed sender, address token, uint256 amount, uint256 expiry, string memo)'));
        
        const log = receipt?.logs ? (receipt.logs as any[]).find(l => l.topics[0] === paymentCreatedTopic) : null;
        
        let blockchainPaymentId: string | null = null;
        
        if (log) {
          try {
            const decoded = decodeEventLog({
              abi: [parseAbiItem('event PaymentCreated(bytes32 indexed paymentId, address indexed sender, address token, uint256 amount, uint256 expiry, string memo)')],
              data: log.data as `0x${string}`,
              topics: log.topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
            }) as { args: { paymentId: string } };
            blockchainPaymentId = decoded.args.paymentId;
          } catch (decodeError) {
            console.warn("Failed to decode event log:", decodeError);
          }
        }

        const { error: updateError } = await supabase
          .from("payments")
          .update({
            tx_hash: txHash,
            blockchain_payment_id: blockchainPaymentId,
          })
          .eq("id", payment.id);

        if (updateError) throw updateError;

        // Send email notification
        try {
          const { data, error: emailError } = await supabase.functions.invoke("send-payment-notification", {
            body: {
              recipientEmail: recipientValue,
              senderEmail: walletAddress ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : "Someone",
              amount: Number(amount),
              token,
              memo: memo || null,
              claimLink: link,
              appUrl,
            },
          });
          
          if (emailError) {
            console.error("Email notification error:", emailError);
          } else {
            console.log("Email notification result:", data);
          }
        } catch (emailErr) {
          console.error("Email notification failed:", emailErr);
        }

        setClaimId(newClaimId);
        setGeneratedLink(`${appUrl}/claim/${newClaimId}`);
        setFullLink(link);
        setStep("done");
        toast.success("Payment sent! Recipient will be notified.");
      } catch (err: unknown) {
        console.error("Payment creation failed:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to create payment";
        toast.error(errorMessage);
        setStep("confirm");
      }
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(fullLink);
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-foreground">Peys</span>
          </Link>
          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <button
                onClick={handleConnect}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Connected
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
        >
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              {step !== "form" && step !== "sending" && (
                <button onClick={() => setStep("form")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <h2 className="font-display text-lg text-foreground">Send Payment</h2>
              <span className="ml-auto text-xs text-muted-foreground">No account required</span>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              {step === "form" && (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {!isLoggedIn && (
                    <div className="rounded-lg bg-primary/10 p-4 text-center">
                      <Wallet className="mx-auto h-6 w-6 text-primary mb-2" />
                      <p className="text-sm text-primary font-medium">Connect your wallet to send</p>
                      <button
                        onClick={handleConnect}
                        className="mt-2 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
                      >
                        Connect Wallet
                      </button>
                    </div>
                  )}

                  {isLoggedIn && (
                    <>
                      <div className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3">
                        <div 
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: currentNetwork.color }}
                        >
                          {currentNetwork.shortName.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Network</p>
                          <p className="font-medium text-foreground">{currentNetwork.name}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {(["USDC", "USDT", "G$"] as Token[]).filter((t) => {
                          if (t === "USDT") {
                            return false; // USDT coming soon
                          }
                          return true;
                        }).map((t) => (
                          <button
                            key={t}
                            onClick={() => setToken(t)}
                            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                              token === t
                                ? "bg-primary text-primary-foreground shadow-glow"
                                : "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-border bg-background py-4 pl-9 pr-4 text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setRecipientType("email")}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                            recipientType === "email"
                              ? "bg-primary text-primary-foreground shadow-glow"
                              : "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          }`}
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecipientType("phone")}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                            recipientType === "phone"
                              ? "bg-primary text-primary-foreground shadow-glow"
                              : "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          }`}
                        >
                          <Phone className="h-4 w-4" />
                          Phone
                        </button>
                      </div>

                      <input
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder={recipientType === "email" ? "Recipient email address" : "Recipient phone number"}
                        type={recipientType === "email" ? "email" : "tel"}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                      />

                      <input
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder="Add a note (optional)"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                      />

                      <button
                        onClick={handleSend}
                        disabled={!amount || Number(amount) <= 0 || !recipient}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                        Review Payment
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {step === "confirm" && (
                <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="space-y-3 rounded-xl border border-border bg-secondary/50 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold text-foreground">{Number(amount).toFixed(2)} {token}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Network</span>
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: currentNetwork.color }} />
                        <span className="text-foreground">{currentNetwork.name}</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">To ({recipientType})</span>
                      <span className="text-foreground">{recipient}</span>
                    </div>
                    {memo && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Note</span>
                        <span className="text-foreground">{memo}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expires</span>
                      <span className="text-foreground">7 days</span>
                    </div>
                  </div>
                  <button onClick={handleSend} className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
                    Confirm & Send
                  </button>
                </motion.div>
              )}

              {step === "sending" && (
                <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {sendingPhase === "approving" 
                      ? `Approving ${token}...` 
                      : sendingPhase === "creating"
                      ? "Creating payment..."
                      : "Processing..."
                    }
                  </p>
                </motion.div>
              )}

              {step === "done" && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl text-foreground">Payment Sent! 🎉</h3>
                  <p className="text-sm text-muted-foreground">
                    {Number(amount)} {token} sent to {recipient}
                  </p>
                  {txHash && (
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-xs text-muted-foreground">Transaction:</p>
                      <a 
                        href={`${currentNetwork.blockExplorer}/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="max-w-[280px] truncate text-xs text-primary hover:underline"
                      >
                        {txHash}
                      </a>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Recipient will be notified and can claim the funds.
                  </p>
                  <button
                    onClick={() => { setStep("form"); setAmount(""); setRecipient(""); setMemo(""); setTxHash(""); }}
                    className="w-full rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    Send Another
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
