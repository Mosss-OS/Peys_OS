/** DonationPage - Crypto donation campaigns with progress tracking and quick-amount giving */
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, DollarSign, Users, Gift, TrendingUp, Loader2, ExternalLink, Share2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface DonationCampaign {
  id: string;
  title: string;
  description: string;
  target: number;
  raised: number;
  currency: string;
  creator: string;
  imageUrl?: string;
  createdAt: string;
  donors: number;
}

const SAMPLE_CAMPAIGNS: DonationCampaign[] = [
  {
    id: "1",
    title: "Open Source Project Support",
    description: "Support developers creating open source tools for the community",
    target: 10000,
    raised: 6500,
    currency: "USDC",
    creator: "0x1234...5678",
    createdAt: new Date().toISOString(),
    donors: 42,
  },
  {
    id: "2",
    title: "Community Fundraiser",
    description: "Help fund community events and meetups",
    target: 5000,
    raised: 2100,
    currency: "USDC",
    creator: "0xabcd...efgh",
    createdAt: new Date().toISOString(),
    donors: 28,
  },
];

/** DonationPage component - Displays donation campaigns, handles donation amounts, and processes contributions */
export default function DonationPage() {
  const { isLoggedIn, login } = useApp();
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>(SAMPLE_CAMPAIGNS);
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDonate = async (campaign: DonationCampaign) => {
    if (!isLoggedIn) {
      login();
      return;
    }

    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid donation amount");
      return;
    }

    setLoading(true);
    try {
      toast.success(`Thank you for your donation of ${amount} ${campaign.currency}!`);
      setDonationAmount("");
      setSelectedCampaign(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Donations</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Support creators and causes you believe in with instant crypto donations.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Donate
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
        <div className="mb-8">
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Donations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Support creators and causes with crypto donations</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {campaigns.map((campaign) => {
            const progress = (campaign.raised / campaign.target) * 100;
            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{campaign.title}</h3>
                    <p className="text-sm text-muted-foreground">{campaign.creator}</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">{campaign.description}</p>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Raised</span>
                    <span className="font-semibold text-foreground">
                      {campaign.raised.toLocaleString()} {campaign.currency}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{progress.toFixed(0)}% of {campaign.target.toLocaleString()} {campaign.currency}</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {campaign.donors} donors
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCampaign(campaign)}
                  className="mt-6 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Donate
                </button>
              </motion.div>
            );
          })}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50"
          >
            <Gift className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-foreground">Create Campaign</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Start accepting donations for your cause
            </p>
          </motion.div>
        </div>

        {selectedCampaign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedCampaign(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="w-full max-w-md rounded-xl border border-border bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-foreground">Donate to {selectedCampaign.title}</h3>
              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-foreground">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-foreground"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                {[5, 10, 25, 50].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setDonationAmount(quickAmount.toString())}
                    className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    ${quickAmount}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDonate(selectedCampaign)}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Donate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}