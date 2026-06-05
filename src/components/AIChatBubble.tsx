import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What's my balance?",
  "Show recent transactions",
  "How do I send a payment?",
  "How do claim links work?",
];

// Use local Ollama in development, Supabase in production
const IS_DEV = import.meta.env.DEV || import.meta.env.MODE === 'development';
const CHAT_URL = IS_DEV 
  ? '/api/ai'  // Proxied to Ollama in dev mode
  : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-assistant`;

// Ollama model configuration - change this to use different models
// Available models: qwen2.5-coder:1.5b, llama2, mistral, etc.
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'qwen2.5-coder:1.5b';

export default function AIChatBubble() {
  const { isLoggedIn, wallet, walletAddress, transactions } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm **Peys AI** 👋 I can help you send payments, check balances, and navigate the app. What would you like to do?" },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const buildContext = useCallback(() => ({
    isLoggedIn,
    walletAddress,
    balanceUSDC: wallet.balanceUSDC,
    balanceUSDT: wallet.balanceUSDT,
    balanceG$: wallet.balanceG$,
    networkBalances: wallet.networkBalances,
    transactions: transactions.slice(0, 10).map((tx) => ({
      type: tx.type,
      amount: tx.amount,
      token: tx.token,
      counterparty: tx.counterparty,
      memo: tx.memo,
      timestamp: tx.timestamp.toISOString(),
    })),
  }), [isLoggedIn, walletAddress, wallet, transactions]);

  // Build system prompt for Ollama (dev mode)
  const buildOllamaSystemPrompt = useCallback((context: ReturnType<typeof buildContext>) => {
    let prompt = `You are Peys AI, a friendly and helpful payment assistant for the Peys app — a multi-chain payment platform for stablecoins and G$ (GoodDollar).

## What Peys Does
- Users send USDC or G$ to anyone via email using magic claim links
- Funds are held in an on-chain escrow smart contract until claimed
- Recipients sign in (email/Google via Privy) and get an auto-created embedded wallet
- Unclaimed payments auto-refund after 7 days
- Near-zero fees on supported networks

## Supported Tokens
- **USDC** (6 decimals) — on Base Sepolia and Celo Alfajores
- **G$ (GoodDollar)** (18 decimals) — on Celo Alfajores

## Supported Networks
- **Base Sepolia** (Chain ID: 84532) — USDC available
- **Celo Alfajores** (Chain ID: 44787) — USDC and G$ available
- G$ is the GoodDollar UBI token — it's the native token of the GoodDollar ecosystem

## Your Capabilities
1. **Payment Creation** - Parse natural language like "send 10 USDC to john@email.com" or "send 5 G$ to alice@email.com" and extract: amount, token, recipient
2. **Balance Analysis** - Show real balances including G$
3. **Transaction History** - Display and explain past transactions
4. **Crypto Education** - Explain concepts in simple terms

## Guidelines
- Be concise (2-3 sentences max unless explaining a concept)
- Use markdown for formatting (bold, lists, tables)
- Always use real data from context, never make up balances
- If user is not logged in, encourage them to sign in
- Be helpful about crypto concepts but keep it simple
- Use emoji sparingly for personality

## Current User Context:
`;
    if (context.isLoggedIn) {
      prompt += `- **Logged in**: Yes\n`;
      prompt += `- **Wallet address**: ${context.walletAddress || "Not connected"}\n`;
      prompt += `- **USDC Balance**: $${context.balanceUSDC?.toFixed(2) || "0.00"}\n`;
      prompt += `- **USDT Balance**: $${context.balanceUSDT?.toFixed(2) || "0.00"}\n`;
      prompt += `- **G$ Balance**: ${context.balanceG$?.toFixed(2) || "0.00"} G$ (worth ~$${((context.balanceG$ || 0) * 0.000113).toFixed(2)} USD)\n`;
      
      const total = ((context.balanceUSDC || 0) + (context.balanceUSDT || 0) + ((context.balanceG$ || 0) * 0.000113));
      prompt += `- **Total Balance**: $${total.toFixed(2)}\n`;
      
      if (context.transactions && context.transactions.length > 0) {
        prompt += `\n### Recent Transactions:\n`;
        for (const tx of context.transactions.slice(0, 5)) {
          const icon = tx.type === "sent" ? "🔴 Sent" : tx.type === "claimed" ? "🟢 Claimed" : "⏳ Pending";
          prompt += `- ${icon} $${tx.amount} ${tx.token} ${tx.type === "sent" ? "→" : "←"} ${tx.counterparty}\n`;
        }
      } else {
        prompt += `- No transactions yet\n`;
      }
    } else {
      prompt += `- **Logged in**: No (user is not signed in)\n`;
      prompt += `\nEncourage the user to sign in to send payments and view their balance.`;
    }
    
    return prompt;
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    // Only send user/assistant messages (no system)
    const apiMessages = updatedMessages.map(({ role, content }) => ({ role, content }));

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantContent = "";

    try {
      // Build context for both dev and prod modes
      const context = buildContext();
      
      // Prepare request body based on mode
      const requestBody = IS_DEV 
        ? {
            model: OLLAMA_MODEL, // Uses VITE_OLLAMA_MODEL env var or defaults to qwen2.5-coder:1.5b
            messages: [
              { 
                role: "system", 
                content: buildOllamaSystemPrompt(context) 
              },
              ...apiMessages,
            ],
            stream: true,
          }
        : {
            messages: apiMessages,
            context: context,
          };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Only add auth header for production (Supabase)
      if (!IS_DEV) {
        headers["Authorization"] = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        const errorMsg = errorData.error || "Something went wrong. Please try again.";
        setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${errorMsg}` }]);
        setIsStreaming(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Handle Ollama streaming format (JSON lines)
        if (IS_DEV) {
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              const content = parsed.message?.content || parsed.response || "";
              if (content) {
                assistantContent += content;
                const current = assistantContent;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant" && prev.length > updatedMessages.length) {
                    return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: current } : m));
                  }
                  return [...prev, { role: "assistant", content: current }];
                });
              }
              if (parsed.done) {
                streamDone = true;
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        } else {
          // Handle OpenAI streaming format (SSE)
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
                const current = assistantContent;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant" && prev.length > updatedMessages.length) {
                    return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: current } : m));
                  }
                  return [...prev, { role: "assistant", content: current }];
                });
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }
      }

      // Final flush for OpenAI format
      if (!IS_DEV && buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              const current = assistantContent;
              setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: current } : m)));
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: unknown) {
      const error = e as { name?: string };
      if (error.name !== "AbortError") {
        console.error("Chat error:", e);
        if (!assistantContent) {
          setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Connection error. Please try again." }]);
        }
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSuggestion = (s: string) => {
    setInput(s);
    // Auto-send after a tick
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      document.getElementById("peys-chat-form")?.dispatchEvent(new Event("submit", { bubbles: true }));
    }, 50);
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 xl:bottom-6 xl:right-6 xl:h-14 xl:w-14"
        whileTap={{ scale: 0.9 }}
        aria-label="Open AI assistant"
      >
        {isOpen ? <X className="h-5 w-5 xl:h-6 xl:w-6" /> : <MessageCircle className="h-5 w-5 xl:h-6 xl:w-6" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-36 right-4 z-50 flex h-[28rem] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elevated xl:bottom-24 xl:right-6 xl:w-96 xl:h-[32rem]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Peys AI</p>
                <p className="text-xs text-muted-foreground">
                  {isStreaming ? "Thinking..." : "Payment assistant"}
                </p>
              </div>
              {isStreaming && <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary" />}
              {!isStreaming && <div className="ml-auto flex h-2 w-2 rounded-full bg-primary animate-pulse" />}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-0.5 [&>ul]:my-1 [&>ol]:my-1 [&>li]:my-0">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} className="text-primary underline hover:opacity-80">
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex gap-1 rounded-xl bg-secondary px-3 py-2">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="flex gap-1.5 overflow-x-auto px-3 pb-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border p-3">
              <form
                id="peys-chat-form"
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isLoggedIn ? "Ask about your payments..." : "Ask me anything..."}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isStreaming}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
