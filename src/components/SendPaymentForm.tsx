/**
 * SendPaymentForm - Multi-step form for creating and sending crypto payments.
 * Supports sending USDC/USDT/G$ via email, phone, or wallet address.
 * Integrates with Supabase for persistence, on-chain escrow for claims,
 * and includes gas estimation, draft saving, contacts autocomplete, and Fiat on-ramp.
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Copy, Check, ArrowLeft, Download, X, Share2, Users, Loader2, Network, AlertCircle, Mail, Phone, Wallet, MessageCircle, CreditCard, Zap } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useApp } from "@/contexts/AppContext";
import { fireBurst } from "@/utils/confetti";
import { Link, useSearchParams } from "react-router-dom";
import PaymentCard from "@/components/PaymentCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import FiatOnRamp from "./FiatOnRamp";
import { useEscrow, getChainConfig } from "@/hooks/useEscrow";
import { Address, keccak256, toHex, parseAbiItem, getEventSelector, decodeEventLog } from "viem";
import { usePublicClient, useAccount, useChainId } from "wagmi";
import { useSound } from "@/hooks/useSound";
import { useHaptic } from "@/hooks/useHaptic";
import { useWakeLock } from "@/hooks/useWakeLock";
import { LocationTagging, useLocation } from "@/hooks/useLocation";

interface Contact {
  id: string;
  name: string;
  email: string;
  lastSent?: string;
  totalSent: number;
}

type Token = "USDC" | "USDT" | "G$";

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

/**
 * SendPaymentForm - Main component that renders the send payment flow.
 * Handles form input, confirmation, on-chain transaction submission,
 * and the post-payment share/QR step.
 */
export default function SendPaymentForm() {
  const { isLoggedIn, login, wallet, walletAddress } = useApp();
  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();
  const { requestWakeLock, releaseWakeLock } = useWakeLock();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<Token>("USDC");
  const [selectedNetwork, setSelectedNetwork] = useState<number>(84532);
  const [recipient, setRecipient] = useState(searchParams.get("recipient") || "");
  const [recipientType, setRecipientType] = useState<"email" | "phone" | "wallet">("email");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "sending" | "done">("form");
  const [sendingPhase, setSendingPhase] = useState<"approving" | "creating" | "waiting">("waiting");
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showAddChainModal, setShowAddChainModal] = useState(false);
  const [recentRecipients, setRecentRecipients] = useState<Contact[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [claimId, setClaimId] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | "">("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [fullLink, setFullLink] = useState("");
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [gasLoading, setGasLoading] = useState(false);
  const [showMemoTemplates, setShowMemoTemplates] = useState(false);
  const [showOnRamp, setShowOnRamp] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const recipientRef = useRef<HTMLDivElement>(null);

  const memoTemplates = [
    "Lunch money 🍕",
    "Thanks for the help! 🙏",
    "Project payment",
    "Freelance work",
    "Birthday gift 🎁",
    "Monthly allowance",
    "Coffee ☕",
    "Rent",
  ];
  const qrRef = useRef<HTMLDivElement>(null);
  const { createPayment, estimateGas, switchNetwork } = useEscrow();
  const publicClient = usePublicClient();
  const { chain: connectedChain } = useAccount();

  // Estimate gas when entering confirm step
  useEffect(() => {
    if (step === "confirm" && amount && recipient) {
      const estimate = async () => {
        setGasLoading(true);
        try {
          const chainConfig = getChainConfig(selectedNetwork);
          const tokenAddress = token === "USDC" ? chainConfig.usdcAddress : token === "G$" ? chainConfig.gdAddress : chainConfig.usdtAddress;
        const amountBigInt = token === "G$"
          ? BigInt(Number(amount) * 1000000000000000000)
          : BigInt(Number(amount) * 1000000);
          const dummySecret = "estimate_gas_dummy_secret";
          
          const estimated = await estimateGas(
            tokenAddress as `0x${string}`,
            amountBigInt,
            dummySecret,
            memo || "",
            7
          );
          setGasEstimate(estimated);
        } catch (error) {
          console.error("Failed to estimate gas:", error);
          setGasEstimate(null);
        } finally {
          setGasLoading(false);
        }
      };
      estimate();
    } else {
      setGasEstimate(null);
      setGasLoading(false);
    }
  }, [step, amount, recipient, selectedNetwork, token, memo, estimateGas]);

  // Auto-save draft to localStorage
  useEffect(() => {
    const draft = { amount, recipient, memo, recipientType };
    localStorage.setItem("peys_send_draft", JSON.stringify(draft));
  }, [amount, recipient, memo, recipientType]);

  // Restore draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("peys_send_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.amount) setAmount(draft.amount);
        if (draft.recipient) setRecipient(draft.recipient);
        if (draft.memo) setMemo(draft.memo);
        if (draft.recipientType) setRecipientType(draft.recipientType);
      } catch (e) {
        console.warn("Failed to restore draft:", e);
      }
    }
  }, []);

  const walletChainId = useChainId();
  useEffect(() => {
    if (connectedChain?.id && networks.find(n => n.id === connectedChain.id)) {
      setSelectedNetwork(connectedChain.id);
    }
  }, [connectedChain]);

  // Set default token based on network
  useEffect(() => {
    setToken("USDC");
  }, [selectedNetwork]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (recipientRef.current && !recipientRef.current.contains(e.target as Node)) {
        setShowContacts(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch recent recipients from payment history
  useEffect(() => {
    const fetchRecentRecipients = async () => {
      if (!walletAddress) return;
      
      setLoadingRecipients(true);
      try {
        const { data, error } = await supabase
          .from("payments")
          .select("recipient_email, created_at, amount, token")
          .eq("sender_wallet", walletAddress.toLowerCase())
          .not("recipient_email", "is", null)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) {
          console.warn("Failed to fetch recipients:", error);
          setLoadingRecipients(false);
          return;
        }

        // Group by recipient and aggregate
        const recipientMap = new Map<string, Contact>();
        
        data?.forEach((payment) => {
          const email = payment.recipient_email;
          if (!email) return;
          
          const existing = recipientMap.get(email);
          const amount = Number(payment.amount) || 0;
          
          if (existing) {
            existing.totalSent += amount;
            if (!existing.lastSent || payment.created_at > existing.lastSent) {
              existing.lastSent = payment.created_at;
            }
          } else {
            recipientMap.set(email, {
              id: email,
              name: email.split("@")[0],
              email: email,
              lastSent: payment.created_at,
              totalSent: amount,
            });
          }
        });

        // Convert to array and sort by most recent
        const sortedRecipients = Array.from(recipientMap.values())
          .sort((a, b) => {
            if (!a.lastSent) return 1;
            if (!b.lastSent) return -1;
            return new Date(b.lastSent).getTime() - new Date(a.lastSent).getTime();
          })
          .slice(0, 10);

        setRecentRecipients(sortedRecipients);
      } catch (err) {
        console.warn("Error fetching recipients:", err);
      } finally {
        setLoadingRecipients(false);
      }
    };

    if (isLoggedIn && walletAddress) {
      fetchRecentRecipients();
    }
  }, [isLoggedIn, walletAddress]);

  const currentNetwork = networks.find(n => n.id === selectedNetwork) || networks[0];
  const config = getChainConfig(selectedNetwork);

  /**
   * handleNetworkChange - Switches the selected network and attempts to
   * switch the wallet's active chain if it differs from the chosen network.
   * @param networkId - The chain ID of the target network.
   */
  const handleNetworkChange = async (networkId: number) => {
    setSelectedNetwork(networkId);
    setShowNetworkSelector(false);
    if (networkId !== walletChainId) {
      try {
        await switchNetwork(networkId);
      } catch (err) {
        console.log("Wallet switch rejected, will attempt again on send");
      }
    }
  };

  /**
   * handleSend - Orchestrates the entire send flow:
   * 1) Form validation (recipient, amount, balance checks).
   * 2) Transitions to confirmation step.
   * 3) On confirm: inserts payment record in Supabase, creates on-chain
   *    escrow payment, waits for receipt, updates DB, sends notifications.
   * @returns A promise that resolves when the flow completes or errors.
   */
  const handleSend = async () => {
    if (!isLoggedIn) { login(); return; }
    playSound("send");
    triggerHaptic("navigation");
    requestWakeLock();
    if (step === "form") {
      if (!recipient) {
        if (recipientType === "email") toast.error("Please enter a recipient email");
        else if (recipientType === "phone") toast.error("Please enter a phone number");
        else toast.error("Please enter a wallet address");
        return;
      }
      if (recipientType === "email" && !recipient.includes("@")) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (recipientType === "phone" && recipient.replace(/\D/g, "").length < 10) {
        toast.error("Please enter a valid phone number");
        return;
      }
      if (recipientType === "wallet" && (!recipient.startsWith("0x") || recipient.length !== 42)) {
        toast.error("Please enter a valid Ethereum wallet address (0x...)");
        return;
      }
      if (!amount || Number(amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      // Check if user has sufficient balance
      if (Number(amount) > balance) {
        toast.error(`Insufficient ${token} balance on ${currentNetwork.name}. You have ${balance.toFixed(2)} ${token}.`);
        return;
      }

      setStep("confirm");
      return;
    }

    if (step === "confirm") {
      setStep("sending");
      setSendingPhase("waiting");

      try {
        // Check if user is logged in via Privy
        if (!isLoggedIn || !walletAddress) {
          toast.error("Please sign in first");
          setStep("form");
          return;
        }

        // Double-check balance before transaction
        if (Number(amount) > balance) {
          toast.error(`Insufficient ${token} balance. You have ${balance.toFixed(2)} ${token}.`);
          setStep("form");
          return;
        }

        const newClaimId = uuidv4();
        const claimSecret = uuidv4();
        const paymentId = `peys_${newClaimId.replace(/-/g, "").slice(0, 16)}`;
        const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
        const link = `${appUrl}/claim/${newClaimId}`;
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Save preliminary payment to database using wallet address as sender identifier
        const recipientValue = recipientType === "phone" 
          ? `+${recipient.replace(/\D/g, "")}`  // Normalize phone number
          : recipient;
          
        const { data: payment, error } = await supabase
          .from("payments")
          .insert({
            payment_id: paymentId,
            sender_user_id: null, // Using wallet address instead
            sender_email: "", // Could collect email from Privy if available
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
            chain_id: selectedNetwork,
          })
          .select()
          .single();

        if (error) throw error;

        // 2. Ensure wallet is on the correct network — auto-switch via wallet provider
        if (selectedNetwork !== walletChainId) {
          try {
            toast.info(`Switching to ${currentNetwork.name}...`);
            await switchNetwork(selectedNetwork);
          } catch (switchErr) {
            toast.error(`Could not switch to ${currentNetwork.name}. Please switch manually in your wallet.`);
            setStep("form");
            return;
          }
        }

        // 3. Create payment on blockchain
        const chainId = selectedNetwork;
        const chainConfig = getChainConfig(chainId);
        
        let tokenAddress: string;
        if (token === "USDC") {
          tokenAddress = chainConfig.usdcAddress;
        } else if (token === "G$") {
          tokenAddress = chainConfig.gdAddress;
        } else {
          tokenAddress = chainConfig.usdtAddress;
        }
        
        const amountBigInt = token === "G$"
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
            () => {
              // Approval transaction is being sent
              setSendingPhase("approving");
            },
            () => {
              // Approval confirmed, now creating the payment
              setSendingPhase("creating");
            }
          );
        } catch (txError: unknown) {
          console.error("Transaction error:", txError);
          const errorMsg = (txError as Error).message || '';
          
          // Check for user rejection - more specific message
          if (errorMsg.includes('user rejected') || 
              errorMsg.includes('cancelled') ||
              errorMsg.includes('was not confirmed') ||
              errorMsg.includes('WALLET_REJECTED') ||
              errorMsg.includes('not submitted')) {
            throw new Error("Transaction was not confirmed. Please click 'Confirm' in your wallet to sign the transaction.");
          }
          
          // Check for nonce or RPC errors
          if (errorMsg.includes('nonce') || errorMsg.includes('-32000') || errorMsg.includes('-32002') || errorMsg.includes('too many errors')) {
            throw new Error("Wallet nonce issue detected. Please open your wallet, go to activity, and cancel or speed up any pending transactions. Then refresh this page and try again.");
          }
          
          // For other errors, show a generic message but include details
          throw new Error(`Transaction failed: ${errorMsg || 'Unknown error'}`);
        }

        if (!txHash) throw new Error("Failed to create transaction - no transaction hash received");

        console.log("=== Got Transaction Hash ===");
        console.log("txHash:", txHash);
        setTxHash(txHash);

        // 3. Wait for transaction receipt and extract paymentId from logs
        if (!publicClient) throw new Error("Public client not available - please refresh and try again");
        
        console.log("=== Waiting for transaction receipt ===");
        
        let receipt;
        try {
          receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
          console.log("=== Receipt Received ===");
          console.log("Receipt status:", receipt?.status);
        } catch (receiptError: unknown) {
          console.error("Failed to get receipt:", receiptError);
          // If the transaction was submitted but we can't get receipt, it might still have gone through
          // Show success with a note
          toast.warning("Transaction submitted but could not confirm receipt. Please check your wallet activity.");
          // Still try to update the payment record
        }
        
        if (!receipt) {
          // Receipt not found - transaction might still be pending
          // Save with tx hash anyway so user can track it
          console.warn("Transaction receipt not found, payment may still be pending");
        }

        // Find the PaymentCreated event log
        const paymentCreatedTopic = getEventSelector(parseAbiItem('event PaymentCreated(uint256 indexed paymentId, address indexed sender, address indexed recipient, uint256 amount, address token, uint256 expiresAt)'));
        
        const log = receipt?.logs ? (receipt.logs as Array<{ topics: string[], data: string }>).find(l => l.topics[0] === paymentCreatedTopic) : null;
        
        let blockchainPaymentId: string | null = null;
        
        if (log) {
          try {
            const decoded = decodeEventLog({
              abi: [parseAbiItem('event PaymentCreated(uint256 indexed paymentId, address indexed sender, address indexed recipient, uint256 amount, address token, uint256 expiresAt)')],
              data: log.data as `0x${string}`,
              topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
            }) as { args: { paymentId: bigint } };
            
            blockchainPaymentId = decoded.args.paymentId.toString();
          } catch (decodeError) {
            console.warn("Failed to decode event log:", decodeError);
          }
        }

        // 4. Update database with blockchain paymentId and transaction hash
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            tx_hash: txHash,
            blockchain_payment_id: blockchainPaymentId,
          })
          .eq("id", payment.id);

        if (updateError) throw updateError;

        // 5. Notify recipient if they exist
        const { data: recipientProfile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", recipient)
          .single();

        if (recipientProfile) {
          await supabase.from("notifications").insert({
            user_id: recipientProfile.user_id,
            type: "payment_received",
            title: `💰 You received ${Number(amount).toFixed(2)} ${token}!`,
            message: `${walletAddress ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : "Someone"} sent you ${Number(amount).toFixed(2)} ${token}${memo ? ` — "${memo}"` : ""}. Claim it now!`,
            payment_id: payment.id,
          });
        }

        // 6. Send email notification via Supabase Edge Function
        try {
          const { data, error } = await supabase.functions.invoke("send-payment-notification", {
            body: {
              recipientEmail: recipient,
              senderEmail: walletAddress ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : "Someone",
              amount: Number(amount),
              token,
              memo: memo || null,
              claimLink: link,
              appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
            },
          });
          
          if (error) {
            console.error("Edge Function error:", error);
          } else {
            console.log("Email notification result:", data);
          }
        } catch (emailErr) {
          console.error("Email notification failed:", emailErr);
        }

        setClaimId(newClaimId);
        setGeneratedLink(`${window.location.host}/claim/${newClaimId}`);
        setFullLink(link);
        setStep("done");
        fireBurst();
        playSound("success");
        triggerHaptic("success");
        releaseWakeLock();
        localStorage.removeItem("peys_send_draft");
        toast.success("Payment created! Share the link to get paid 🎉");
      } catch (err: unknown) {
        console.error("Payment creation failed:", err);
        const errorMessage = (err as Error).message || "Failed to create payment";
        playSound("error");
        triggerHaptic("error");
        releaseWakeLock();
        
        // Check for nonce-related errors
        if (errorMessage.includes('nonce') || errorMessage.includes('Nonce too low')) {
          toast.error("Nonce error: Please check MetaMask for pending transactions. You can cancel or speed up the stuck transaction, then try again.");
        } else {
          toast.error(errorMessage);
        }
        setStep("confirm");
      }
    }
  };

  /**
   * copyLink - Copies the payment claim link to the clipboard.
   */
  const copyLink = () => {
    navigator.clipboard.writeText(fullLink);
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  /**
   * shareLink - Attempts to use the Web Share API to share the payment link.
   * Falls back to copying the link if the API is unavailable.
   */
  const shareLink = async () => {
    const shareData = {
      title: `Payment of ${amount} ${token} on Peys`,
      text: `Claim your ${amount} ${token}! ${memo || ""}`,
      url: fullLink,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {
        // Ignore share errors
      }
    } else {
      copyLink();
    }
  };

  // Get balance for selected network
  const networkBalance = wallet.networkBalances?.find(nb => nb.chainId === selectedNetwork);
  /**
   * getBalance - Returns the current token balance for the selected network.
   * @returns The numeric balance for the active token.
   */
  const getBalance = () => {
    if (token === "USDC") {
      return networkBalance ? networkBalance.usdc : wallet.balanceUSDC;
    }
    if (token === "G$") {
      return networkBalance ? networkBalance.g$ : wallet.balanceG$;
    }
    return networkBalance ? networkBalance.usdt : wallet.balanceUSDT;
  };
  const balance = getBalance();

  return (
    <div className="relative mx-auto max-w-2xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
      {/* Login overlay when not signed in */}
      {!isLoggedIn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm"
        >
          <div className="text-center">
            <h3 className="mb-2 font-display text-lg text-foreground">Sign in to send payments</h3>
            <p className="mb-4 text-sm text-muted-foreground">Connect your wallet to start sending money.</p>
            <button
              onClick={login}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`overflow-hidden rounded-xl border border-border bg-card shadow-card sm:rounded-2xl ${!isLoggedIn ? "pointer-events-none select-none opacity-40" : ""}`}
      >
        <div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            {step !== "form" && step !== "sending" && (
              <button onClick={() => setStep("form")} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="font-display text-lg text-foreground sm:text-xl">Send Payment</h2>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 sm:space-y-4">
                
                {/* Network Info */}
                <div className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3">
                  <div 
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white relative"
                    style={{ backgroundColor: currentNetwork.color }}
                  >
                    {currentNetwork.shortName.slice(0, 2)}
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Network</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{currentNetwork.name}</p>
                      <span className="text-xs text-green-600 font-medium">Online</span>
                    </div>
                  </div>
                </div>

                {/* Token Selector */}
                <div className="flex gap-2">
                  {(["USDC", "USDT", "G$"] as Token[])
                    .filter((t) => {
                      if (t === "USDT") {
                        return false; // USDT coming soon
                      }
                      return true;
                    })
                    .map((t) => (
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
                
                {isLoggedIn && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Balance: {balance.toFixed(2)} {token} on {currentNetwork.shortName}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowOnRamp(true)}
                      className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      <CreditCard className="h-3 w-3" />
                      Add Funds
                    </button>
                  </div>
                )}
                
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground sm:text-2xl">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-border bg-background py-3 pl-9 pr-4 text-2xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring sm:py-4 sm:pl-10 sm:text-3xl"
                  />
                </div>
                
                {/* Recipient Type Toggle */}
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
                  <button
                    type="button"
                    onClick={() => setRecipientType("wallet")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                      recipientType === "wallet"
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <Wallet className="h-4 w-4" />
                    Wallet
                  </button>
                </div>
                
                <div className="relative" ref={recipientRef}>
                  <div className="relative">
                    <input
                      value={recipient}
                      onChange={(e) => { setRecipient(e.target.value); setShowContacts(true); }}
                      onFocus={() => setShowContacts(true)}
                      placeholder={
                        recipientType === "email" ? "Recipient email address" :
                        recipientType === "phone" ? "Recipient phone number" :
                        "0x..."
                      }
                      type="text"
                      maxLength={recipientType === "email" ? 254 : recipientType === "phone" ? 20 : 42}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring sm:py-3"
                    />
                    <button
                      type="button"
                      onClick={() => setShowContacts(!showContacts)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                  </div>
                  <AnimatePresence>
                    {showContacts && (() => {
                      const q = recipient.toLowerCase();
                      
                      if (loadingRecipients) {
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-elevated"
                          >
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          </motion.div>
                        );
                      }
                      
                      const filtered = recentRecipients.filter(
                        (c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
                      );
                      
                      if (filtered.length === 0) {
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-elevated"
                          >
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              {recentRecipients.length === 0 ? "No recent recipients" : "No matches found"}
                            </div>
                          </motion.div>
                        );
                      }
                      
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-elevated"
                        >
                          <div className="max-h-60 overflow-y-auto py-1">
                            {filtered.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => { setRecipient(c.email); setShowContacts(false); }}
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-secondary/60"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-foreground">{c.email}</p>
                                  {c.lastSent && (
                                    <p className="truncate text-xs text-muted-foreground">
                                      Last sent: {new Date(c.lastSent).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>
                
                <input
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Add a note (optional)"
                  maxLength={500}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring sm:py-3"
                />

                <div className="flex flex-wrap gap-2">
                  {memoTemplates.slice(0, 4).map((template) => (
                    <button
                      key={template}
                      onClick={() => setMemo(template)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        memo === template
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {template}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowMemoTemplates(!showMemoTemplates)}
                    className="text-xs px-3 py-1.5 rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground hover:border-muted-foreground"
                  >
                    + More
                  </button>
                </div>

                {showMemoTemplates && (
                  <div className="p-3 rounded-xl border border-border bg-card">
                    <p className="text-xs text-muted-foreground mb-2">More templates:</p>
                    <div className="flex flex-wrap gap-2">
                      {memoTemplates.slice(4).map((template) => (
                        <button
                          key={template}
                          onClick={() => {
                            setMemo(template);
                            setShowMemoTemplates(false);
                          }}
                          className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <LocationTagging 
                  onLocationChange={(loc: any) => setSelectedLocation(loc)}
                />
                
                <button
                  onClick={handleSend}
                  disabled={!amount || Number(amount) <= 0 || !recipient}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50 sm:py-3.5"
                >
                  <Send className="h-4 w-4" />
                  {isLoggedIn ? "Review Payment" : "Sign In to Send"}
                </button>
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6">
                <button
                  onClick={() => setStep("form")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to edit
                </button>

                <div className="space-y-3 rounded-xl border border-border bg-secondary/50 p-4 sm:space-y-4 sm:p-5 md:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground sm:text-base">Amount</span>
                    <span className="font-bold text-foreground sm:text-lg">{Number(amount).toFixed(2)} {token}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground sm:text-base">Network</span>
                    <span className="flex items-center gap-2">
                      <div 
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: currentNetwork.color }}
                      />
                      <span className="text-foreground font-medium sm:text-base">{currentNetwork.name}</span>
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-muted-foreground sm:text-base">To ({recipientType})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium break-all sm:text-base">{recipient}</span>
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                    </div>
                  </div>
                  {memo && (
                    <>
                      <div className="h-px bg-border" />
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-muted-foreground sm:text-base">Note</span>
                        <span className="text-foreground font-medium break-all sm:text-base">{memo}</span>
                      </div>
                    </>
                  )}
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground sm:text-base">Expires</span>
                    <span className="text-foreground font-medium sm:text-base">7 days</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground sm:text-base">Network fee</span>
                    <span className="font-medium text-primary sm:text-base">
                      {gasLoading ? (
                        <span className="animate-pulse">Estimating...</span>
                      ) : gasEstimate ? (
                        `~${(Number(gasEstimate) / 1e18).toFixed(6)} ETH`
                      ) : (
                        "Unavailable"
                      )}
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between bg-primary/5 -mx-4 -mb-4 px-4 py-3 rounded-b-xl">
                    <span className="text-sm font-medium text-foreground sm:text-base">Total</span>
                    <span className="font-bold text-primary sm:text-lg">{Number(amount).toFixed(2)} {token}</span>
                  </div>
                </div>
                
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 sm:p-4">
                  <p className="text-center text-xs text-muted-foreground sm:text-sm">
                    Please confirm the details above before sending. Once confirmed, the payment will be created and the recipient will be notified.
                  </p>
                </div>
                
                <button onClick={handleSend} className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 sm:py-4 md:text-lg">
                  Confirm & Send
                </button>
              </motion.div>
            )}

            {step === "sending" && (
              <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {sendingPhase === "approving" 
                    ? `Approving ${token} on ${currentNetwork.name}...` 
                    : sendingPhase === "creating"
                    ? `Creating payment on ${currentNetwork.name}...`
                    : `Processing on ${currentNetwork.name}...`
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {sendingPhase === "approving" 
                    ? "Check your wallet to confirm the approval" 
                    : "Please wait, this may take a moment"
                  }
                </p>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 text-center sm:space-y-5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 sm:h-14 sm:w-14">
                  <Check className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
                </div>
                <h3 className="font-display text-lg text-foreground sm:text-xl">Payment Created! 🎉</h3>
                <p className="text-sm text-muted-foreground">
                  {Number(amount).toFixed(2)} {token} sent on <span className="font-medium text-foreground">{currentNetwork.name}</span>
                </p>
                {txHash && (
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-xs text-muted-foreground">Transaction Hash:</p>
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
                  {recipient} will receive a notification. If they're not on Pey yet, they can sign up and claim instantly.
                </p>

                <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 p-2.5 sm:p-3">
                  <span className="flex-1 truncate text-xs text-foreground sm:text-sm">{generatedLink}</span>
                  <button onClick={copyLink} className="rounded-lg border border-border bg-card p-1.5 transition-colors hover:bg-secondary sm:p-2">
                    {linkCopied ? <Check className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setShowQR(true)} className="flex flex-col items-center gap-1 rounded-xl border border-border py-3 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /><rect x="18" y="18" width="3" height="3" /></svg>
                    QR Code
                  </button>
                  <button onClick={shareLink} className="flex flex-col items-center gap-1 rounded-xl border border-border py-3 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <Share2 className="h-5 w-5" />
                    Share
                  </button>
                  <button onClick={() => { setStep("form"); setAmount(""); setRecipient(""); setMemo(""); setTxHash(""); }} className="flex flex-col items-center gap-1 rounded-xl border border-border py-3 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <Send className="h-5 w-5" />
                    Send Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-sm rounded-2xl bg-card p-6 sm:max-w-md sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowQR(false)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              <div ref={qrRef} className="p-2">
                <QRCodeSVG value={fullLink} size={Math.min(window.innerWidth > 640 ? 280 : 200, 280)} />
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">Scan to claim payment</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCard && (
          <PaymentCard
            payment={{
              id: claimId,
              amount: Number(amount),
              token,
              recipient,
              memo,
              status: "pending",
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }}
            link={fullLink}
            onClose={() => setShowCard(false)}
          />
        )}
      </AnimatePresence>

      {/* Add Custom Chain Modal */}
      <AnimatePresence>
        {showAddChainModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowAddChainModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-elevated"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-foreground">Add Custom Chain</h3>
                <button onClick={() => setShowAddChainModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Chain Name</label>
                  <input
                    type="text"
                    placeholder="My Custom Chain"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Chain ID</label>
                  <input
                    type="number"
                    placeholder="12345"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">RPC URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowAddChainModal(false)}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success("Custom chain added! (Feature coming soon)");
                    setShowAddChainModal(false);
                  }}
                  className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Add Chain
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FiatOnRamp 
        isOpen={showOnRamp} 
        onClose={() => setShowOnRamp(false)} 
        token={token}
        network={currentNetwork.name}
      />
    </div>
  );
}
