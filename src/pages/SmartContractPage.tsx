import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Code, Upload, FileText, Terminal, ChevronDown, 
  Play, Eye, Edit3, Loader2, Copy, Check, AlertCircle,
  FileCode, Download, Trash2 
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { usePublicClient, useWalletClient } from "wagmi";
import { encodeFunctionData, decodeFunctionResult } from "viem";
import { ESCROW_ABI } from "@/constants/blockchain";

interface ContractMethod {
  name: string;
  type: "function" | "view" | "write";
  inputs: { name: string; type: string }[];
  outputs?: { type: string }[];
}

interface ContractInteraction {
  id: string;
  address: string;
  method: string;
  params: string[];
  result: string;
  timestamp: string;
}

export default function SmartContractPage() {
  const { isLoggedIn, login } = useApp();
  const [loading, setLoading] = useState(true);
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [contractAddress, setContractAddress] = useState("");
  const [abiInput, setAbiInput] = useState("");
  const [parsedAbi, setParsedAbi] = useState<ContractMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<ContractMethod | null>(null);
  const [params, setParams] = useState<string[]>([]);
  const [isRead, setIsRead] = useState(true);
  const [result, setResult] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [interactions, setInteractions] = useState<ContractInteraction[]>([]);

  const [showAbiModal, setShowAbiModal] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(false);
  }, [isLoggedIn]);

  const parseAbi = (input: string) => {
    try {
      // Simple ABI parser for common patterns
      const methods: ContractMethod[] = [];
      
      // Try parsing as JSON array
      try {
        const abi = JSON.parse(input);
        if (Array.isArray(abi)) {
          abi.forEach((item: Record<string, unknown>) => {
            if (item.type === "function") {
              methods.push({
                name: item.name as string,
                type: item.stateMutability === "view" ? "view" : "write",
                inputs: item.inputs as unknown[] || [],
                outputs: item.outputs as unknown[],
              });
            }
          });
        }
      } catch (e) {
        // Not valid JSON, try parsing manual format
        const lines = input.split('\n');
        lines.forEach(line => {
          const match = line.match(/function\s+(\w+)\s*\(([^)]*)\)/);
          if (match) {
            const inputs = match[2].split(',').map(p => {
              const [type, name] = p.trim().split(' ');
              return { name: name || `param${methods.length}`, type: type };
            }).filter(i => i.type);
            methods.push({
              name: match[1],
              type: "function",
              inputs,
            });
          }
        });
      }

      if (methods.length === 0) {
        throw new Error("No valid methods found");
      }

      setParsedAbi(methods);
      if (methods.length > 0) {
        setSelectedMethod(methods[0]);
        setParams(new Array(methods[0].inputs.length).fill(""));
      }
      toast.success(`Parsed ${methods.length} methods`);
    } catch (error) {
      toast.error("Invalid ABI format");
      console.error(error);
    }
  };

  const executeCall = async () => {
    if (!selectedMethod || !contractAddress || !publicClient) return;

    setIsExecuting(true);
    try {
      if (isRead) {
        // Read call
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: [{ ...selectedMethod, type: "function", stateMutability: "view" }],
          functionName: selectedMethod.name,
          args: params.map(p => {
            try {
              return JSON.parse(p);
            } catch {
              return p;
            }
          }),
        });
        setResult(String(result));
      } else {
        // Write call
        if (!walletClient) {
          toast.error("Wallet not connected");
          return;
        }

        const data = encodeFunctionData({
          abi: [{ ...selectedMethod, type: "function", stateMutability: "nonpayable" }],
          functionName: selectedMethod.name,
          args: params.map(p => {
            try {
              return JSON.parse(p);
            } catch {
              return p;
            }
          }),
        });

        const hash = await walletClient.sendTransaction({
          to: contractAddress as `0x${string}`,
          data,
        });

        setResult(`Transaction hash: ${hash}`);
        toast.success("Transaction submitted!");
      }

      // Save interaction
      const interaction: ContractInteraction = {
        id: crypto.randomUUID(),
        address: contractAddress,
        method: selectedMethod.name,
        params,
        result: String(result),
        timestamp: new Date().toISOString(),
      };
      setInteractions(prev => [interaction, ...prev]);
    } catch (error: unknown) {
      const err = error as Error;
      setResult(`Error: ${err.message || "Unknown error"}`);
      toast.error("Execution failed");
    } finally {
      setIsExecuting(false);
    }
  };

  const loadSampleAbi = () => {
    const sampleAbi = JSON.stringify(ESCROW_ABI, null, 2);
    setAbiInput(sampleAbi);
    parseAbi(sampleAbi);
  };

  const loadCustomContract = () => {
    setContractAddress("0x1234567890123456789012345678901234567890");
    loadSampleAbi();
    toast.success("Sample contract loaded");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Code className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Smart Contract Interaction</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Interact with custom smart contracts on any supported network
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Interact
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-4xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Smart Contract</h1>
            <p className="mt-1 text-sm text-muted-foreground">Read and write to custom contracts</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadSampleAbi}
              className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm"
            >
              <FileCode className="h-4 w-4" />
              Load Sample
            </button>
            <button
              onClick={() => setShowAbiModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              <Upload className="h-4 w-4" />
              Upload ABI
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Contract Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Contract Address */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Contract Address</label>
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Method Selection */}
              {parsedAbi.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Function</label>
                  <select
                    value={selectedMethod?.name || ""}
                    onChange={(e) => {
                      const method = parsedAbi.find(m => m.name === e.target.value);
                      setSelectedMethod(method || null);
                      if (method) {
                        setParams(new Array(method.inputs.length).fill(""));
                      }
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {parsedAbi.map((method) => (
                      <option key={method.name} value={method.name}>
                        {method.name} ({method.type === "view" ? "read" : "write"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Call Type Toggle */}
              {selectedMethod && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-background p-2">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsRead(true)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        isRead
                          ? "bg-blue-500/10 text-blue-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      Read
                    </button>
                    <button
                      onClick={() => setIsRead(false)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        !isRead
                          ? "bg-green-500/10 text-green-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Edit3 className="h-4 w-4" />
                      Write
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {selectedMethod.type === "view" ? "View function" : "State-changing function"}
                  </span>
                </div>
              )}

              {/* Parameters */}
              {selectedMethod && selectedMethod.inputs.length > 0 && (
                <div className="space-y-2">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Parameters</label>
                  {selectedMethod.inputs.map((input, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="flex w-24 items-center justify-center rounded-l-lg bg-secondary px-2 text-xs text-muted-foreground">
                        {input.type}
                      </span>
                      <input
                        type="text"
                        value={params[index] || ""}
                        onChange={(e) => {
                          const newParams = [...params];
                          newParams[index] = e.target.value;
                          setParams(newParams);
                        }}
                        placeholder={input.name || `param${index}`}
                        className="flex-1 rounded-r-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Execute Button */}
              <button
                onClick={executeCall}
                disabled={!contractAddress || !selectedMethod || isExecuting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    {isRead ? "Read Contract" : "Write Contract"}
                  </>
                )}
              </button>
            </motion.div>

            {/* Result Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Result</h3>
                  {result && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(result);
                        toast.success("Copied!");
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Copy
                    </button>
                  )}
                </div>
                <div className="min-h-[100px] rounded-lg bg-background p-3 font-mono text-sm text-foreground break-all">
                  {result || <span className="text-muted-foreground">No result yet</span>}
                </div>
              </div>

              {/* Interaction History */}
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium text-foreground">Interaction History</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {interactions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No interactions yet</p>
                  ) : (
                    interactions.slice(0, 5).map((interaction) => (
                      <div key={interaction.id} className="flex items-center justify-between rounded-lg bg-background p-2">
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-xs text-foreground">{interaction.method}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {interaction.address.slice(0, 6)}...{interaction.address.slice(-4)}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(interaction.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      <Footer />

      {/* ABI Upload Modal */}
      {showAbiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg text-foreground">Upload ABI</h3>
              <button onClick={() => setShowAbiModal(false)} className="text-muted-foreground">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <textarea
                value={abiInput}
                onChange={(e) => setAbiInput(e.target.value)}
                placeholder="Paste ABI JSON or function signatures..."
                className="h-48 w-full rounded-lg border border-border bg-background p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    parseAbi(abiInput);
                    setShowAbiModal(false);
                  }}
                  className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground"
                >
                  Parse ABI
                </button>
                <button
                  onClick={() => {
                    loadSampleAbi();
                    setShowAbiModal(false);
                  }}
                  className="rounded-lg bg-secondary px-4 py-2 text-sm"
                >
                  Load Sample
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
