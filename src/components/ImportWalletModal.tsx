import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Key, AlertTriangle, Eye, EyeOff, X, Plus, Check } from "lucide-react";
import { toast } from "sonner";

interface ImportWalletModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (address: string, source: 'privateKey' | 'seedphrase') => void;
}

export default function ImportWalletModal({ open, onClose, onImport }: ImportWalletModalProps) {
  const [importMethod, setImportMethod] = useState<'privateKey' | 'seedphrase'>('privateKey');
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [agreedToWarning, setAgreedToWarning] = useState(false);

  const handleImport = async () => {
    if (!inputValue.trim()) {
      toast.error("Please enter your " + (importMethod === 'privateKey' ? 'private key' : 'seedphrase'));
      return;
    }

    if (!agreedToWarning) {
      toast.error("Please acknowledge the security warning");
      return;
    }

    setIsImporting(true);

    try {
      // Validate input format
      const isValidPrivateKey = /^0x[a-fA-F0-9]{64}$/.test(inputValue.trim());
      const isValidSeedphrase = inputValue.trim().split(/\s+/).length === 12 || inputValue.trim().split(/\s+/).length === 24;

      if (importMethod === 'privateKey' && !isValidPrivateKey) {
        toast.error("Invalid private key format. Must be 64 hex characters starting with 0x");
        setIsImporting(false);
        return;
      }

      if (importMethod === 'seedphrase' && !isValidSeedphrase) {
        toast.error("Invalid seedphrase. Must be 12 or 24 words");
        setIsImporting(false);
        return;
      }

      onImport(inputValue.trim(), importMethod);
      toast.success("Wallet imported successfully!");
      
      // Clear sensitive data from memory
      setInputValue('');
      setAgreedToWarning(false);
      onClose();
    } catch (error) {
      toast.error("Failed to import wallet");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-xl text-foreground">Import Wallet</h2>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Security Warning */}
            <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="text-xs text-yellow-400">
                  <p className="font-semibold mb-1">Security Notice</p>
                  <p>Your private key or seedphrase is processed locally and never sent to our servers. However, for maximum security, we recommend using a hardware wallet for large amounts.</p>
                </div>
              </div>
            </div>

            {/* Import Method Toggle */}
            <div className="flex mb-4 rounded-lg border border-border p-1">
              <button
                onClick={() => setImportMethod('privateKey')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                  importMethod === 'privateKey' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Key className="h-4 w-4" /> Private Key
              </button>
              <button
                onClick={() => setImportMethod('seedphrase')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                  importMethod === 'seedphrase' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wallet className="h-4 w-4" /> Seedphrase
              </button>
            </div>

            {/* Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1">
                {importMethod === 'privateKey' ? 'Private Key' : 'Seedphrase (12 or 24 words)'}
              </label>
              <div className="relative">
                <input
                  type={showInput ? "text" : "password"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={importMethod === 'privateKey' ? "0x..." : "word1 word2 word3..."}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowInput(!showInput)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showInput ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Warning Acknowledgment */}
            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToWarning}
                onChange={(e) => setAgreedToWarning(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground">
                I understand that I should never share my private key or seedphrase with anyone. I am responsible for keeping this information secure.
              </span>
            </label>

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={isImporting || !inputValue.trim() || !agreedToWarning}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Importing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" /> Import Wallet
                </span>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
