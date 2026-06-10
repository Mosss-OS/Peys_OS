/** VerificationBadgesPage - Browse and apply for verification badges with tiered requirements. */
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, CheckCircle, Building, Award, Star, Clock, Send, ExternalLink, ArrowLeft, Users, Zap, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

type BadgeType = "verified" | "business" | "premium" | "early-adopter" | "influencer" | "developer";

interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  icon: typeof Shield;
  color: string;
  requirements: string[];
  benefits: string[];
}

const BADGES: Badge[] = [
  {
    type: "verified",
    name: "Verified User",
    description: "Identity verified through our KYC process",
    icon: CheckCircle,
    color: "text-blue-500 bg-blue-500/10",
    requirements: ["Complete identity verification", "Provide valid government ID", "Verify phone number"],
    benefits: ["Higher transaction limits", "Priority support", "Verified badge on profile"],
  },
  {
    type: "business",
    name: "Business Account",
    description: "For businesses and organizations",
    icon: Building,
    color: "text-purple-500 bg-purple-500/10",
    requirements: ["Business verification", "Company documentation", "Designated contact person"],
    benefits: ["Unlimited transactions", "API access", "Custom payment pages", "Dedicated support"],
  },
  {
    type: "premium",
    name: "Premium Member",
    description: "Active user with premium features",
    icon: Award,
    color: "text-yellow-500 bg-yellow-500/10",
    requirements: ["Minimum 50 transactions", "Account age > 30 days", "No policy violations"],
    benefits: ["Lower fees", "Advanced analytics", "Priority withdrawals", "Exclusive features"],
  },
  {
    type: "early-adopter",
    name: "Early Adopter",
    description: "Joined during our beta period",
    icon: Star,
    color: "text-amber-500 bg-amber-500/10",
    requirements: ["Joined before launch", "Provided feedback", "Active beta tester"],
    benefits: ["Lifetime premium features", "Special badge", "Founder recognition"],
  },
  {
    type: "influencer",
    name: "Influencer",
    description: "Community advocate and promoter",
    icon: Users,
    color: "text-pink-500 bg-pink-500/10",
    requirements: ["100+ referrals", "Active social presence", "Community contributions"],
    benefits: ["Affiliate rewards", "Featured on platform", "Exclusive events access"],
  },
  {
    type: "developer",
    name: "Developer",
    description: "Built on the Peys platform",
    icon: Zap,
    color: "text-green-500 bg-green-500/10",
    requirements: ["Published integration", "Active API usage", "Developer community participation"],
    benefits: ["API priority access", "Technical support", "Developer community access"],
  },
];

interface BadgeApplication {
  badgeType: BadgeType;
  status: "pending" | "approved" | "rejected";
  appliedAt: Date;
  reviewedAt?: Date;
}

/** Page for browsing verification badges, viewing requirements, and submitting applications. */
export default function VerificationBadgesPage() {
  const { isLoggedIn, login } = useApp();
  const [applications, setApplications] = useState<BadgeApplication[]>([]);
  const [showApplyModal, setShowApplyModal] = useState<BadgeType | null>(null);
  const [applying, setApplying] = useState(false);

  const getBadgeStatus = (type: BadgeType): BadgeApplication | undefined => {
    return applications.find((app) => app.badgeType === type);
  };

  const handleApply = async (badgeType: BadgeType) => {
    if (!isLoggedIn) {
      toast.error("Please sign in to apply for badges");
      return;
    }

    setApplying(true);
    setApplications((prev) => [
      ...prev,
      {
        badgeType,
        status: "pending",
        appliedAt: new Date(),
      },
    ]);
    
    setApplying(false);
    setShowApplyModal(null);
    toast.success("Application submitted! We'll review it soon.");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Verification Badges</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Unlock exclusive features and showcase your credibility with verification badges.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Get Started
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-5xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-3xl text-foreground sm:text-4xl">Verification Badges</h1>
          </div>
          <p className="text-muted-foreground">Showcase your credibility and unlock exclusive features</p>
        </motion.div>

        {/* Badge Types Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {BADGES.map((badge, index) => {
            const status = getBadgeStatus(badge.type);
            const Icon = badge.icon;
            
            return (
              <motion.div
                key={badge.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${badge.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {status && (
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      status.status === "approved"
                        ? "bg-green-500/10 text-green-500"
                        : status.status === "rejected"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-yellow-500/10 text-yellow-600"
                    }`}>
                      {status.status}
                    </span>
                  )}
                </div>

                <h3 className="mb-1 font-display text-lg text-foreground">{badge.name}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{badge.description}</p>

                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Requirements</p>
                  <ul className="space-y-1">
                    {badge.requirements.map((req, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                        <CheckCircle className="h-3 w-3 text-primary" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Benefits</p>
                  <ul className="space-y-1">
                    {badge.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {status ? (
                  status.status === "pending" ? (
                    <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-600">
                      <Clock className="h-4 w-4" />
                      Under review - typically takes 1-3 days
                    </div>
                  ) : status.status === "approved" ? (
                    <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-500">
                      <CheckCircle className="h-4 w-4" />
                      Badge earned! Displayed on your profile.
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowApplyModal(badge.type)}
                      className="w-full rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      Re-apply
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => setShowApplyModal(badge.type)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                    Apply Now
                  </button>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Leaderboard */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl text-foreground">Badge Leaderboard</h2>
            </div>
          </div>

          <div className="space-y-2">
            <div className="rounded-lg border border-border bg-secondary/30 p-8 text-center">
              <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Leaderboard coming soon</p>
            </div>
          </div>
        </motion.div>

        {/* Apply Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              {(() => {
                const badge = BADGES.find((b) => b.type === showApplyModal);
                if (!badge) return null;
                const Icon = badge.icon;

                return (
                  <>
                    <div className="mb-4 flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${badge.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg text-foreground">Apply for {badge.name}</h3>
                        <p className="text-xs text-muted-foreground">Submit your application for review</p>
                      </div>
                    </div>

                    <div className="mb-6 space-y-3">
                      <p className="text-sm text-foreground/80">To apply for this badge, you'll need:</p>
                      <ul className="space-y-2">
                        {badge.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                            {req}
                          </li>
                        ))}
                      </ul>
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground">
                          Our team will review your application within 1-3 business days. You'll receive a notification once reviewed.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowApplyModal(null)}
                        className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleApply(showApplyModal)}
                        disabled={applying}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {applying ? "Submitting..." : "Submit Application"}
                        {!applying && <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
