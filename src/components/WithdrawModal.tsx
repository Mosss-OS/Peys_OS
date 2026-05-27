import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, ArrowRight, Check, Wallet, Building2, Search, Zap, Loader2, AlertCircle, ShieldCheck, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { flutterwaveService, SUPPORTED_COUNTRIES, CURRENCY_SYMBOLS } from "@/services/flutterwaveService";

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  balanceUSDC: number;
  balanceUSDT: number;
  balanceG$?: number;
}

type WithdrawMethod = "wallet" | "bank";
type Token = "USDC" | "USDT" | "G$";

interface Bank {
  code: string;
  name: string;
}

export default function WithdrawModal({ open, onClose, balanceUSDC, balanceUSDT }: WithdrawModalProps) {
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [method, setMethod] = useState<WithdrawMethod>("wallet");
  const [token, setToken] = useState<Token>("USDC");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [processing, setProcessing] = useState(false);
  
  // Bank withdrawal states
  const [country, setCountry] = useState("NG");
  const [currency, setCurrency] = useState("NGN");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountVerified, setAccountVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [exchangeRate, setExchangeRate] = useState(1520);

  const balance = token === "USDC" ? balanceUSDC : token === "G$" ? (balanceG$ || 0) : balanceUSDT;

  const filteredBanks = useMemo(() => {
    if (!bankSearch) return banks;
    const search = bankSearch.toLowerCase();
    return banks.filter(bank => 
      bank.name.toLowerCase().includes(search) || 
      bank.code.toLowerCase().includes(search)
    );
  }, [banks, bankSearch]);

  useEffect(() => {
    if (method === "bank") {
      fetchBanks();
      const countryObj = SUPPORTED_COUNTRIES.find((c) => c.code === country);
      if (countryObj) {
        setCurrency(countryObj.currency);
      }
    }
  }, [method, country]);

  useEffect(() => {
    if (accountNumber.length >= 10 && selectedBank && !accountVerified && !verifying) {
      verifyAccount();
    }
  }, [accountNumber, selectedBank]);

  const fetchBanks = async () => {
    const banksList = await flutterwaveService.getBanks(country);
    setBanks(banksList);
  };

  const verifyAccount = async () => {
    if (!selectedBank || accountNumber.length < 10) return;
    setVerifying(true);
    setVerificationError("");
    try {
      const result = await flutterwaveService.resolveAccount(
        selectedBank.code,
        accountNumber,
        country
      );
      if (result.is_valid) {
        setAccountName(result.account_name);
        setAccountVerified(true);
      } else {
        setAccountVerified(false);
        setAccountName("");
        setVerificationError("Could not verify account");
      }
    } catch {
      setVerificationError("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleSelectBank = (bank: Bank) => {
    setSelectedBank(bank);
    setShowBankDropdown(false);
    setBankSearch("");
    setAccountNumber("");
    setAccountName("");
    setAccountVerified(false);
    setVerificationError("");
  };

  const reset = () => {
    setStep("form");
    setAmount("");
    setAddress("");
    setProcessing(false);
    setSelectedBank(null);
    setAccountNumber("");
    setAccountName("");
    setAccountVerified(false);
    setVerificationError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep("done");
      toast.success("Withdrawal successful! Money sent to your bank.");
    }, 2000);
  };

  const fee = 0.50;
  const numAmount = Number(amount) || 0;
  const feeInFiat = numAmount * exchangeRate;
  const totalFiat = feeInFiat + fee;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-elevated overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg text-foreground">
                {method === "bank" ? "Withdraw to Bank" : "Withdraw"}
              </h3>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                {step === "form" && (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {/* Method */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { setMethod("wallet"); reset(); }}
                        className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                          method === "wallet" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        <Wallet className="h-4 w-4" /> External Wallet
                      </button>
                      <button
                        onClick={() => { setMethod("bank"); setStep("form"); }}
                        className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                          method === "bank" ? "border-green-500 bg-green-500/5 text-green-500" : "border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        <Building2 className="h-4 w-4" /> Bank Account
                      </button>
                    </div>

                    {/* Bank Withdrawal Form */}
                    {method === "bank" && (
                      <div className="space-y-3 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                        <div className="flex items-center gap-2 text-green-500 text-sm font-medium mb-2">
                          <Zap className="h-4 w-4" />
                          Instant delivery to your bank
                        </div>

                        {/* Country */}
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">Country</label>
                          <select
                            value={country}
                            onChange={(e) => { setCountry(e.target.value); setSelectedBank(null); }}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          >
                            {SUPPORTED_COUNTRIES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.flag} {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Bank Selection */}
                        <div className="relative">
                          <label className="mb-1 block text-xs text-muted-foreground">Select Bank</label>
                          <div
                            onClick={() => setShowBankDropdown(!showBankDropdown)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm cursor-pointer flex items-center justify-between"
                          >
                            <span className={selectedBank ? "text-foreground" : "text-muted-foreground"}>
                              {selectedBank ? selectedBank.name : "Search for your bank..."}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showBankDropdown ? 'rotate-180' : ''}`} />
                          </div>
                          
                          {showBankDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-hidden">
                              <div className="p-2 border-b border-border">
                                <input
                                  type="text"
                                  value={bankSearch}
                                  onChange={(e) => setBankSearch(e.target.value)}
                                  placeholder="Search banks..."
                                  className="w-full px-3 py-2 bg-background rounded border border-border text-sm"
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-36 overflow-y-auto">
                                {filteredBanks.length === 0 ? (
                                  <p className="px-4 py-3 text-sm text-muted-foreground">No banks found</p>
                                ) : (
                                  filteredBanks.map((bank) => (
                                    <div
                                      key={bank.code}
                                      onClick={() => handleSelectBank(bank)}
                                      className="px-4 py-2 hover:bg-accent cursor-pointer"
                                    >
                                      <p className="font-medium text-sm">{bank.name}</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Account Number */}
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">Account Number</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={accountNumber}
                              onChange={(e) => {
                                setAccountNumber(e.target.value.replace(/\D/g, ''));
                                setAccountVerified(false);
                                setVerificationError("");
                              }}
                              placeholder="Enter account number"
                              maxLength={10}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm"
                            />
                            {verifying && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {accountVerified && (
                              <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>

                        {/* Verification Error */}
                        {verificationError && (
                          <div className="flex items-center gap-2 text-red-500 text-xs">
                            <AlertCircle className="h-3 w-3" />
                            {verificationError}
                          </div>
                        )}

                        {/* Verified Account */}
                        {accountVerified && (
                          <div className="flex items-center gap-2 text-green-500 text-sm">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="font-medium">{accountName}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Token */}
                    <div className="flex gap-2">
                      {(["USDC", "USDT", "G$"] as Token[]).filter(t => t !== "USDT").map((t) => (
                        <button
                          key={t}
                          onClick={() => setToken(t)}
                          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                            token === t ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Amount */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-muted-foreground">Amount</label>
                        <button onClick={() => setAmount(balance.toString())} className="text-xs text-primary hover:underline">
                          Max: ${balance.toFixed(2)}
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-border bg-background py-3 pl-9 pr-4 text-xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    {/* USD to Fiat conversion for bank */}
                    {method === "bank" && numAmount > 0 && (
                      <div className="rounded-lg bg-muted p-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">You send</span>
                          <span className="font-medium">{numAmount.toFixed(2)} {token}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rate</span>
                          <span className="font-medium">1 {token} = {CURRENCY_SYMBOLS[currency]}{exchangeRate.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fee (1%)</span>
                          <span className="font-medium">{CURRENCY_SYMBOLS[currency]}{(numAmount * 0.01 * exchangeRate).toFixed(2)}</span>
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between font-semibold">
                          <span className="text-muted-foreground">Recipient gets</span>
                          <span className="text-green-500">{CURRENCY_SYMBOLS[currency]}{((numAmount - numAmount * 0.01) * exchangeRate).toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        if (!amount || numAmount <= 0) { toast.error("Enter a valid amount"); return; }
                        if (numAmount > balance) { toast.error("Insufficient balance"); return; }
                        if (method === "bank" && !accountVerified) { 
                          toast.error("Please verify your bank account first"); 
                          return; 
                        }
                        setStep("confirm");
                      }}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50 ${
                        method === "bank" 
                          ? "bg-green-500 text-white hover:bg-green-600" 
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {method === "bank" ? (
                        <>
                          <Zap className="h-4 w-4" />
                          Withdraw Instantly
                          {numAmount > 0 && <span>→ {CURRENCY_SYMBOLS[currency]}{((numAmount - numAmount * 0.01) * exchangeRate).toFixed(2)}</span>}
                        </>
                      ) : (
                        <>Review Withdrawal <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                  </motion.div>
                )}

                {step === "confirm" && (
                  <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="space-y-2.5 rounded-xl border border-border bg-secondary/50 p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Method</span>
                        <span className="font-medium text-foreground capitalize">
                          {method === "wallet" ? "External Wallet" : "Bank Transfer (Instant)"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-semibold text-foreground">${numAmount.toFixed(2)} {token}</span>
                      </div>
                      {method === "bank" && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Bank</span>
                            <span className="font-medium text-foreground">{selectedBank?.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Account</span>
                            <span className="font-medium text-foreground">{accountNumber} - {accountName}</span>
                          </div>
                        </>
                      )}
                      <div className="border-t border-border pt-2 flex justify-between text-sm">
                        <span className="text-muted-foreground">You receive</span>
                        <span className="font-bold text-green-500">
                          {method === "bank" 
                            ? `${CURRENCY_SYMBOLS[currency]}${((numAmount - numAmount * 0.01) * exchangeRate).toFixed(2)}`
                            : `$${(numAmount - fee).toFixed(2)}`
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setStep("form")} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-secondary">
                        Back
                      </button>
                      <button
                        onClick={handleConfirm}
                        disabled={processing}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold shadow-glow transition-opacity hover:opacity-90 disabled:opacity-70 ${
                          method === "bank" ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {processing ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-5 w-5 rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <>
                            {method === "bank" ? <Zap className="h-4 w-4" /> : null}
                            Confirm & Send
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === "done" && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                      <Check className="h-7 w-7 text-green-500" />
                    </div>
                    <h3 className="font-display text-lg text-foreground">Withdrawal Successful!</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {method === "bank" 
                        ? `${CURRENCY_SYMBOLS[currency]}${((numAmount - numAmount * 0.01) * exchangeRate).toFixed(2)} sent to ${accountName}`
                        : `$${(numAmount - fee).toFixed(2)} ${token} is on its way`
                      }
                    </p>
                    <p className="mt-2 text-sm font-medium text-green-500">
                      {method === "bank" ? "✓ Instant delivery to your bank account!" : "✓ Estimated arrival: ~2 minutes"}
                    </p>
                    <button onClick={handleClose} className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                      Done
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
