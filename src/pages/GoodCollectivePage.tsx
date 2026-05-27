import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Vote, TrendingUp, Calendar, Clock, CheckCircle, XCircle,
  ArrowLeft, Loader2, Plus, ThumbsUp, ThumbsDown, ExternalLink,
  MessageSquare, Wallet, BarChart3, Globe
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface CollectiveProposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: "active" | "passed" | "rejected" | "executed";
  forVotes: number;
  againstVotes: number;
  totalVotes: number;
  deadline: string;
  category: "distribution" | "parameter" | "development" | "community";
}

interface CollectiveStats {
  totalMembers: number;
  activeProposals: number;
  treasuryBalance: number;
  totalDistributed: number;
  participationRate: number;
}

const MOCK_PROPOSALS: CollectiveProposal[] = [
  {
    id: "1",
    title: "Distribute 10,000 G$ to Active Users",
    description: "Proposal to distribute G$ tokens to users who have completed at least 5 transactions this quarter.",
    proposer: "0x1234...5678",
    status: "active",
    forVotes: 125000,
    againstVotes: 32000,
    totalVotes: 157000,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: "distribution",
  },
  {
    id: "2",
    title: "Reduce Transaction Fee to 0.5%",
    description: "Lower the platform transaction fee from 1% to 0.5% for all G$ payments.",
    proposer: "0x8765...4321",
    status: "active",
    forVotes: 89000,
    againstVotes: 45000,
    totalVotes: 134000,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: "parameter",
  },
  {
    id: "3",
    title: "Fund Community Development Grant",
    description: "Allocate 5,000 G$ for community development projects focused on financial inclusion.",
    proposer: "0xabcd...ef01",
    status: "passed",
    forVotes: 98000,
    againstVotes: 12000,
    totalVotes: 110000,
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: "development",
  },
  {
    id: "4",
    title: "Community Outreach Program",
    description: "Launch a quarterly outreach program to onboard new users from underserved communities.",
    proposer: "0x9876...fedc",
    status: "executed",
    forVotes: 75000,
    againstVotes: 8000,
    totalVotes: 83000,
    deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    category: "community",
  },
];

export default function GoodCollectivePage() {
  const { isLoggedIn, login } = useApp();
  const [proposals, setProposals] = useState<CollectiveProposal[]>(MOCK_PROPOSALS);
  const [loading, setLoading] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createCategory, setCreateCategory] = useState<CollectiveProposal["category"]>("distribution");
  const [creating, setCreating] = useState(false);

  const stats: CollectiveStats = {
    totalMembers: 1284,
    activeProposals: proposals.filter(p => p.status === "active").length,
    treasuryBalance: 250000,
    totalDistributed: 75000,
    participationRate: 67,
  };

  const handleVote = async (proposalId: string, support: boolean) => {
    if (!isLoggedIn) { login(); return; }
    setVotingId(proposalId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProposals(prev => prev.map(p => {
        if (p.id !== proposalId) return p;
        return {
          ...p,
          forVotes: support ? p.forVotes + 1 : p.forVotes,
          againstVotes: support ? p.againstVotes : p.againstVotes + 1,
          totalVotes: p.totalVotes + 1,
        };
      }));
      toast.success(`Vote recorded: ${support ? "For" : "Against"}`);
    } catch {
      toast.error("Vote failed");
    } finally {
      setVotingId(null);
    }
  };

  const handleCreateProposal = async () => {
    if (!createTitle.trim() || !createDescription.trim()) {
      toast.error("Title and description required");
      return;
    }
    setCreating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const proposal: CollectiveProposal = {
        id: Date.now().toString(),
        title: createTitle,
        description: createDescription,
        proposer: "You",
        status: "active",
        forVotes: 0,
        againstVotes: 0,
        totalVotes: 0,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        category: createCategory,
      };
      setProposals(prev => [proposal, ...prev]);
      setShowCreate(false);
      setCreateTitle("");
      setCreateDescription("");
      toast.success("Proposal created!");
    } finally {
      setCreating(false);
    }
  };

  const formatVotes = (votes: number) => {
    if (votes >= 1000) return `${(votes / 1000).toFixed(1)}k`;
    return votes.toString();
  };

  const getDaysLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const statusStyles: Record<string, string> = {
    active: "bg-blue-500/10 text-blue-600",
    passed: "bg-green-500/10 text-green-600",
    rejected: "bg-red-500/10 text-red-600",
    executed: "bg-muted text-muted-foreground",
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">GoodCollective</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Join the GoodDollar community. Propose, vote, and shape the future of universal basic income.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Participate
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
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-foreground sm:text-3xl">GoodCollective</h1>
              <p className="text-sm text-muted-foreground">Community governance for the GoodDollar ecosystem</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Proposal
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <Users className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-lg font-bold text-foreground">{stats.totalMembers}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <Vote className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-lg font-bold text-foreground">{stats.activeProposals}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <Wallet className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-lg font-bold text-foreground">{stats.treasuryBalance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Treasury</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <TrendingUp className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-lg font-bold text-foreground">{stats.totalDistributed.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Distributed</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <BarChart3 className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-lg font-bold text-foreground">{stats.participationRate}%</p>
            <p className="text-xs text-muted-foreground">Participation</p>
          </div>
        </div>

        {/* Create Proposal Form */}
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="mb-6 overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="border-b border-border bg-secondary/50 p-4">
              <h3 className="font-display text-lg text-foreground">Create Proposal</h3>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
                <input value={createTitle} onChange={e => setCreateTitle(e.target.value)}
                  placeholder="What should the collective decide?"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea value={createDescription} onChange={e => setCreateDescription(e.target.value)} rows={3}
                  placeholder="Describe your proposal in detail..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
                <select value={createCategory} onChange={e => setCreateCategory(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="distribution">Distribution</option>
                  <option value="parameter">Parameter Change</option>
                  <option value="development">Development</option>
                  <option value="community">Community</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
                  Cancel
                </button>
                <button onClick={handleCreateProposal} disabled={creating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {creating ? "Creating..." : "Submit Proposal"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Proposals */}
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <motion.div key={proposal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="p-4 sm:p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-base text-foreground sm:text-lg">{proposal.title}</h3>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[proposal.status]}`}>
                        {proposal.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      by {proposal.proposer} &middot; {proposal.category}
                    </p>
                  </div>
                </div>

                <p className="mb-4 text-sm text-muted-foreground">{proposal.description}</p>

                {/* Vote Bar */}
                <div className="mb-3">
                  <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="bg-green-500 transition-all"
                      style={{ width: `${(proposal.forVotes / Math.max(proposal.totalVotes, 1)) * 100}%` }}
                    />
                    <div
                      className="bg-red-500 transition-all"
                      style={{ width: `${(proposal.againstVotes / Math.max(proposal.totalVotes, 1)) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-green-600 font-medium">{formatVotes(proposal.forVotes)} For</span>
                    <span className="text-muted-foreground">{formatVotes(proposal.totalVotes)} total</span>
                    <span className="text-red-600 font-medium">{formatVotes(proposal.againstVotes)} Against</span>
                  </div>
                </div>

                {/* Deadline & Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {proposal.status === "active" ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getDaysLeft(proposal.deadline)} days left
                      </span>
                    ) : proposal.status === "passed" ? (
                      <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> Approved</span>
                    ) : proposal.status === "rejected" ? (
                      <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" /> Rejected</span>
                    ) : (
                      <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Executed</span>
                    )}
                  </div>
                  {proposal.status === "active" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote(proposal.id, true)}
                        disabled={votingId === proposal.id}
                        className="flex items-center gap-1 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                      >
                        {votingId === proposal.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsUp className="h-3 w-3" />}
                        For
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, false)}
                        disabled={votingId === proposal.id}
                        className="flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                      >
                        {votingId === proposal.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsDown className="h-3 w-3" />}
                        Against
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {proposals.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Vote className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No proposals yet. Be the first to create one!</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
