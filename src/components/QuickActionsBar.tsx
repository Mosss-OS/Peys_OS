import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, QrCode, Bell, Wallet, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

export default function QuickActionsBar() {
  const [expanded, setExpanded] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const navigate = useNavigate();
  const { wallet, isLoggedIn } = useApp();

  const actions = [
    {
      icon: Send,
      label: "Send",
      color: "bg-primary",
      onClick: () => {
        setExpanded(false);
        navigate("/send");
      },
    },
    {
      icon: QrCode,
      label: "Scan",
      color: "bg-blue-500",
      onClick: () => {
        setExpanded(false);
        toast.info("QR Scanner coming soon!");
      },
    },
    {
      icon: Wallet,
      label: "Balance",
      color: "bg-green-500",
      onClick: () => {
        setShowBalance(true);
        setExpanded(false);
      },
    },
    {
      icon: Bell,
      label: "Alerts",
      color: "bg-orange-500",
      onClick: () => {
        setExpanded(false);
        toast.info("Notifications coming soon!");
      },
    },
  ];

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40 lg:hidden">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2"
            >
              {actions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={action.onClick}
                  className={`flex items-center gap-3 ${action.color} text-white px-4 py-3 rounded-full shadow-lg hover:scale-105 transition-transform`}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setExpanded(!expanded)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
        >
          <AnimatePresence mode="wait">
            {expanded ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="plus"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Plus className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {showBalance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setShowBalance(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl p-6 shadow-elevated"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
              <h3 className="font-display text-lg text-foreground mb-4">Your Balance</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 rounded-xl bg-secondary/50">
                  <span className="text-muted-foreground">USDC</span>
                  <span className="font-semibold text-foreground">${wallet.balanceUSDC.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl bg-secondary/50">
                  <span className="text-muted-foreground">USDT</span>
                  <span className="font-semibold text-foreground">${wallet.balanceUSDT.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl bg-secondary/50">
                  <span className="text-muted-foreground">G$</span>
                  <span className="font-semibold text-foreground">${wallet.balanceG$.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-primary font-medium">Total</span>
                  <span className="font-bold text-primary text-lg">${wallet.totalBalanceUSD.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => setShowBalance(false)}
                className="w-full mt-6 py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
