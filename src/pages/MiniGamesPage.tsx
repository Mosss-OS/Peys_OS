/** MiniGamesPage - Play mini games (spin wheel, scratch card), complete challenges, and earn badges. */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gift, Star, Trophy, Award, Target, Zap, Calendar, 
  Medal, Crown, ChevronRight, Play, Check, RefreshCw,
  Gift as GiftIcon, Sparkles, Loader2, ChevronUp, ChevronDown
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface SpinResult {
  id: string;
  prize: string;
  amount: number;
  token: string;
  date: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  rewardToken: string;
  progress: number;
  goal: number;
  completed: boolean;
  expiresAt: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  dateUnlocked?: string;
}

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  score: number;
  isYou?: boolean;
}

/** Mini games page with spin wheel, scratch card, challenges, badges, and leaderboard tabs. */
export default function MiniGamesPage() {
  const { isLoggedIn, login } = useApp();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"spin" | "scratch" | "challenges" | "badges" | "leaderboard">("spin");

  // Spin wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastSpin, setLastSpin] = useState<SpinResult | null>(null);

  // Scratch card state
  const [scratched, setScratched] = useState(false);
  const [scratchAmount, setScratchAmount] = useState(25);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(false);
  }, [isLoggedIn]);

  const spinWheel = async () => {
    if (isSpinning) return;
    toast.info("No spin game available");
  };

  const scratchCard = async () => {
    if (scratched) return;

    setScratched(true);
    const amount = Math.floor(Math.random() * 50) + 5;
    setScratchAmount(amount);
    toast.success(`You won ${amount} USDC!`);
  };

  const claimReward = async (challengeId: string) => {
    toast.info("No challenges available");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Gift className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Mini Games</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Play games, complete challenges, and earn rewards!
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Play
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-3xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Mini Games</h1>
            <p className="mt-1 text-sm text-muted-foreground">Win USDC rewards by playing!</p>
          </div>
        </div>

        {/* Game Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-primary">
              <Trophy className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">Total Won</span>
            </div>
            <p className="mt-1 font-display text-lg text-foreground">0 USDC</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-primary">
              <Award className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">Badges</span>
            </div>
            <p className="mt-1 font-display text-lg text-foreground">
              0 / 0
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex overflow-x-auto gap-1 rounded-xl border border-border bg-card p-1">
          {[
            { id: "spin", label: "Spin", icon: <Zap className="h-4 w-4" /> },
            { id: "scratch", label: "Scratch", icon: <Gift className="h-4 w-4" /> },
            { id: "challenges", label: "Challenges", icon: <Target className="h-4 w-4" /> },
            { id: "badges", label: "Badges", icon: <Medal className="h-4 w-4" /> },
            { id: "leaderboard", label: "Leaderboard", icon: <Crown className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "spin" | "scratch" | "challenges" | "badges" | "leaderboard")}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Spin Wheel Tab */}
            {activeTab === "spin" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No spin game available</p>
              </motion.div>
            )}

            {/* Scratch Card Tab */}
            {activeTab === "scratch" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div
                  onClick={scratchCard}
                  className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 cursor-pointer overflow-hidden shadow-lg"
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <GiftIcon className="h-12 w-12 mb-2" />
                    <p className="text-lg font-bold">SCRATCH TO WIN</p>
                    <p className="text-sm opacity-80">Up to 50 USDC</p>
                  </div>
                  {!scratched ? (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: scratched ? 0 : 1 }}
                    >
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center text-gray-600">
                          <Sparkles className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">Click to scratch!</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <p className="text-sm text-white/80">You Won!</p>
                      <p className="text-3xl font-bold text-white">{scratchAmount} USDC</p>
                      <Check className="h-8 w-8 mt-2 text-white" />
                    </motion.div>
                  )}
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setScratched(false)}
                    className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm text-foreground"
                  >
                    <RefreshCw className="h-4 w-4" />
                    New Card
                  </button>
                </div>
              </motion.div>
            )}

            {/* Challenges Tab */}
            {activeTab === "challenges" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Target className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No challenges available</p>
              </motion.div>
            )}

            {/* Badges Tab */}
            {activeTab === "badges" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Medal className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No badges earned yet</p>
              </motion.div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === "leaderboard" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Top Players</h3>
                  <span className="text-xs text-muted-foreground">This Month</span>
                </div>

                <div className="text-center py-12">
                  <Crown className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Leaderboard coming soon</p>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
