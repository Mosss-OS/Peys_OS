/**
 * FiatOnRamp - Bottom-sheet modal that lists fiat on-ramp providers
 * (MoonPay, Stripe Crypto, Ramp Network) for buying crypto with
 * credit card or bank transfer. Opens provider URLs in a new tab.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Landmark, Apple, Wallet, ArrowRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface FiatOnRampProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
  network?: string;
}

const providers = [
  {
    id: "moonpay",
    name: "MoonPay",
    description: "Global coverage with 100+ payment methods",
    icon: CreditCard,
    color: "#7D00FF",
    url: "https://www.moonpay.com/buy"
  },
  {
    id: "stripe",
    name: "Stripe Crypto",
    description: "Fast and reliable card payments",
    icon: CreditCard,
    color: "#635BFF",
    url: "https://stripe.com/crypto"
  },
  {
    id: "ramp",
    name: "Ramp Network",
    description: "Excellent EU and UK support",
    icon: Landmark,
    color: "#29F566",
    url: "https://ramp.network/buy"
  }
];

/**
 * FiatOnRamp - Renders the on-ramp provider selection modal.
 * @param props.isOpen - Whether the modal is visible.
 * @param props.onClose - Callback to close the modal.
 * @param props.token - The target token being purchased (default "USDC").
 * @param props.network - The target network name (default "Base").
 */
export default function FiatOnRamp({ isOpen, onClose, token = "USDC", network = "Base" }: FiatOnRampProps) {
  /**
   * handleProviderSelect - Opens the provider URL in a new tab,
   * shows an informational toast, and closes the modal.
   * @param url - The provider's purchase URL.
   */
  const handleProviderSelect = (url: string) => {
    window.open(url, "_blank");
    toast.info("Opening provider in a new tab. Complete your purchase there.");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-md overflow-hidden rounded-t-2xl bg-card shadow-elevated sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border p-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg text-foreground">Add Funds</h3>
                <p className="text-xs text-muted-foreground">Buy {token} on {network}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">External Senders</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Non-crypto users can pay you using Credit Card or Bank Transfer via these secure on-ramps.
                    </p>
                  </div>
                </div>
              </div>

              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderSelect(provider.url)}
                  className="flex w-full items-center gap-4 rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-primary/50 hover:bg-secondary/30 active:scale-[0.98]"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                    style={{ backgroundColor: provider.color }}
                  >
                    <provider.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{provider.name}</p>
                      {provider.id === "moonpay" && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Popular</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{provider.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="flex flex-col items-center justify-center rounded-xl border border-border p-3 text-center">
                  <Apple className="h-5 w-5 text-foreground mb-1" />
                  <p className="text-[10px] font-medium text-muted-foreground">Apple Pay</p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-border p-3 text-center">
                  <Landmark className="h-5 w-5 text-foreground mb-1" />
                  <p className="text-[10px] font-medium text-muted-foreground">Bank Transfer</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] text-center text-muted-foreground px-4">
                  By using these services, you agree to their respective Terms of Service and Privacy Policies. Peys does not handle your financial data.
                </p>
              </div>
            </div>
            
            <div className="bg-secondary/50 p-4 border-t border-border">
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-secondary py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/80 focus:outline-none"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
