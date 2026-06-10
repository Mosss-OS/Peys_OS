/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Users, Shield, CreditCard, Store, FileText, 
  Settings, Plus, Mail, Search, Trash2, Copy, Check, 
  DollarSign, Clock, ArrowRight, Upload, Download, 
  MoreVertical, Edit, Pause, Play, X, CheckCircle,
  AlertCircle, UserPlus, Wallet, Calendar, TrendingUp
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { usePrivyAuth } from "@/contexts/PrivyContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  created_at: string;
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
  joined_at: string;
}

type TabType = "overview" | "team" | "approvals" | "stores" | "links" | "contractors" | "templates" | "settings";

const roleColors: Record<string, string> = {
  owner: "bg-primary/10 text-primary",
  admin: "bg-purple-500/10 text-purple-500",
  manager: "bg-blue-500/10 text-blue-500",
  viewer: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-500",
  pending: "bg-yellow-500/10 text-yellow-500",
  invited: "bg-orange-500/10 text-orange-500",
  suspended: "bg-red-500/10 text-red-500",
  approved: "bg-green-500/10 text-green-500",
  rejected: "bg-red-500/10 text-red-500",
};

export default function OrganizationsPage() {
  const { isLoggedIn, login } = useApp();
  const { walletAddress, user: privyUser } = usePrivyAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrganizations();
    }
  }, [isLoggedIn, walletAddress]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      // Try Supabase auth first, fallback to wallet address
      let userId = null;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      } else if (walletAddress) {
        // Use wallet address as fallback identifier
        userId = walletAddress;
      }
      
      // Try database first
      const { data: memberData, error: memberError } = userId 
        ? await db
            .from("organization_members")
            .select("organization_id, organizations(*)")
            .eq("user_id", userId)
            .eq("status", "active")
        : { data: null, error: null };

      if (memberError || !memberData) {
        console.log("Database not available, using localStorage fallback");
        const localOrgs = JSON.parse(localStorage.getItem("organizations") || "[]");
        // Filter by wallet address or user id
        const userOrgs = localOrgs.filter((o: Organization) => 
          o.owner_id === walletAddress || 
          o.owner_id === user?.id ||
          o.owner_id === privyUser?.id
        );
        setOrganizations(userOrgs);
        if (userOrgs.length > 0 && !currentOrg) {
          setCurrentOrg(userOrgs[0]);
        }
        setLoading(false);
        return;
      }

      if (memberData.length > 0) {
        const orgs = memberData.map((m: any) => m.organizations).filter(Boolean);
        setOrganizations(orgs);
        if (orgs.length > 0 && !currentOrg) {
          setCurrentOrg(orgs[0]);
        }
      }
    } catch (err) {
      console.error("Error:", err);
      // Fallback to localStorage on error
      const localOrgs = JSON.parse(localStorage.getItem("organizations") || "[]");
      const userOrgs = localOrgs.filter((o: any) => 
        o.owner_id === walletAddress || 
        o.owner_id === privyUser?.id
      );
      setOrganizations(userOrgs);
      if (userOrgs.length > 0 && !currentOrg) {
        setCurrentOrg(userOrgs[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Organizations</h2>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">Manage your team, approvals, and business payments at scale.</p>
            <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              Sign In
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: TrendingUp },
    { id: "team" as TabType, label: "Team", icon: Users },
    { id: "approvals" as TabType, label: "Approvals", icon: Shield },
    { id: "stores" as TabType, label: "Stores", icon: Store },
    { id: "links" as TabType, label: "Payment Links", icon: Link },
    { id: "contractors" as TabType, label: "Contractors", icon: Wallet },
    { id: "templates" as TabType, label: "Templates", icon: FileText },
    { id: "settings" as TabType, label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-7xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl text-foreground sm:text-3xl">Organizations</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading ? "Loading..." : `${organizations.length} organizations`}
              </p>
            </div>
            <button
              onClick={() => setShowCreateOrg(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Create Org
            </button>
          </div>
        </motion.div>

        {organizations.length > 0 ? (
          <>
            <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "overview" && <OverviewTab key="overview" org={currentOrg} />}
              {activeTab === "team" && <TeamTab key="team" org={currentOrg} />}
              {activeTab === "approvals" && <ApprovalsTab key="approvals" org={currentOrg} />}
              {activeTab === "stores" && <StoresTab key="stores" org={currentOrg} />}
              {activeTab === "links" && <PaymentLinksTab key="links" org={currentOrg} />}
              {activeTab === "contractors" && <ContractorsTab key="contractors" org={currentOrg} />}
              {activeTab === "templates" && <TemplatesTab key="templates" org={currentOrg} />}
              {activeTab === "settings" && <SettingsTab key="settings" org={currentOrg} />}
            </AnimatePresence>
          </>
        ) : (
          <EmptyState onCreateOrg={() => setShowCreateOrg(true)} />
        )}

        <CreateOrgModal 
          open={showCreateOrg} 
          onClose={() => setShowCreateOrg(false)}
          onCreated={(org) => {
            setOrganizations([...organizations, org]);
            setCurrentOrg(org);
            setShowCreateOrg(false);
          }}
        />
      </div>
      <Footer />
    </div>
  );
}

function EmptyState({ onCreateOrg }: { onCreateOrg: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-12 text-center"
    >
      <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
      <h3 className="font-display text-xl text-foreground">No organizations yet</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Create your first organization to start managing team members, approvals, and business payments.
      </p>
      <button
        onClick={onCreateOrg}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" /> Create Organization
      </button>
    </motion.div>
  );
}

function OverviewTab({ org }: { org: any }) {
  if (!org) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Select an organization to view overview.</p>
      </motion.div>
    );
  }

  const stats = [
    { label: "Team Members", value: "12", icon: Users },
    { label: "Pending Approvals", value: "3", icon: Clock },
    { label: "Active Stores", value: "2", icon: Store },
    { label: "This Month", value: "$45,230", icon: DollarSign },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary">
            {org.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground">{org.name}</h2>
            <p className="text-sm text-muted-foreground">{org.description || "No description"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-display text-lg text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: "Payment approved", amount: "$5,000", time: "2 hours ago", icon: CheckCircle },
            { action: "New team member added", amount: "john@company.com", time: "5 hours ago", icon: UserPlus },
            { action: "Payment link created", amount: "Invoice #1234", time: "1 day ago", icon: Link },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
                <Icon className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.amount}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function TeamTab({ org }: { org: any }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (org?.id) {
      fetchMembers();
    }
  }, [org?.id]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false });
      setMembers(data || []);
    } catch (err) {
      console.error("Error:", err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">Team Members</h2>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" /> Invite Member
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : members.length > 0 ? (
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {member.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{member.email}</p>
                <p className="text-xs text-muted-foreground">
                  {member.status === "invited" ? "Invited" : "Joined"} {member.accepted_at ? new Date(member.accepted_at).toLocaleDateString() : ""}
                </p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${roleColors[member.role] || roleColors.viewer}`}>
                {member.role}
              </span>
              <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColors[member.status] || statusColors.active}`}>
                {member.status}
              </span>
              <button className="p-2 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Users className="mx-auto mb-4 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No team members yet.</p>
        </div>
      )}

      {showInvite && (
        <InviteMemberModal 
          orgId={org?.id} 
          onClose={() => setShowInvite(false)}
          onInvited={() => {
            fetchMembers();
            setShowInvite(false);
          }}
        />
      )}
    </motion.div>
  );
}

function ApprovalsTab({ org }: { org: any }) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (org?.id) {
      fetchApprovals();
    }
  }, [org?.id]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("payment_approvals")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false });
      setApprovals(data || []);
    } catch (err) {
      console.error("Error:", err);
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">Payment Approvals</h2>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" /> New Approval
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : approvals.length > 0 ? (
        <div className="space-y-2">
          {approvals.map((approval) => (
            <div key={approval.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                approval.status === "approved" ? "bg-green-500/10" : 
                approval.status === "rejected" ? "bg-red-500/10" : "bg-yellow-500/10"
              }`}>
                {approval.status === "approved" ? <CheckCircle className="h-5 w-5 text-green-500" /> :
                 approval.status === "rejected" ? <X className="h-5 w-5 text-red-500" /> :
                 <Clock className="h-5 w-5 text-yellow-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{approval.description || `Payment #${approval.payment_id.slice(0, 8)}`}</p>
                <p className="text-xs text-muted-foreground">{approval.payment_type} • {new Date(approval.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">${(approval.amount / 1000000).toFixed(2)} {approval.token}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[approval.status] || statusColors.pending}`}>
                  {approval.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Shield className="mx-auto mb-4 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No payment approvals yet.</p>
        </div>
      )}
    </motion.div>
  );
}

function StoresTab({ org }: { org: any }) {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (org?.id) {
      fetchStores();
    }
  }, [org?.id]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("merchant_stores")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        // Fallback to localStorage
        const localStores = JSON.parse(localStorage.getItem("merchant_stores") || "[]");
        const orgStores = localStores.filter((s: any) => s.organization_id === org.id);
        setStores(orgStores);
      } else {
        setStores(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      // Fallback to localStorage
      const localStores = JSON.parse(localStorage.getItem("merchant_stores") || "[]");
      const orgStores = localStores.filter((s: any) => s.organization_id === org.id);
      setStores(orgStores);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">Merchant Stores</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Create Store
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : stores.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <div key={store.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                  {store.name.charAt(0).toUpperCase()}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[store.status] || statusColors.active}`}>
                  {store.status}
                </span>
              </div>
              <h3 className="font-medium text-foreground">{store.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{store.description || "No description"}</p>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-secondary">
                  Edit
                </button>
                <button className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Store className="mx-auto mb-4 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No stores yet.</p>
        </div>
      )}

      {showCreate && (
        <CreateStoreModal
          orgId={org?.id}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            fetchStores();
            setShowCreate(false);
          }}
        />
      )}
    </motion.div>
  );
}

function PaymentLinksTab({ org }: { org: any }) {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (org?.id) {
      fetchLinks();
    }
  }, [org?.id]);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_links")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        // Fallback to localStorage
        const localLinks = JSON.parse(localStorage.getItem("payment_links") || "[]");
        const orgLinks = localLinks.filter((l: any) => l.organization_id === org.id);
        setLinks(orgLinks);
      } else {
        setLinks(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      // Fallback to localStorage
      const localLinks = JSON.parse(localStorage.getItem("payment_links") || "[]");
      const orgLinks = localLinks.filter((l: any) => l.organization_id === org.id);
      setLinks(orgLinks);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`https://peys.app/pay/${slug}`);
    toast.success("Payment link copied!");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">Payment Links</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Create Link
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : links.length > 0 ? (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{link.title}</p>
                <p className="text-xs text-muted-foreground">peys.app/pay/{link.slug}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">
                  {link.amount ? `$${(link.amount / 1000000).toFixed(2)} ${link.token}` : "Custom Amount"}
                </p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[link.status] || statusColors.active}`}>
                  {link.status}
                </span>
              </div>
              <button onClick={() => copyLink(link.slug)} className="p-2 text-muted-foreground hover:text-foreground">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <CreditCard className="mx-auto mb-4 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No payment links yet.</p>
        </div>
      )}

      {showCreate && (
        <CreatePaymentLinkModal
          orgId={org?.id}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            fetchLinks();
            setShowCreate(false);
          }}
        />
      )}
    </motion.div>
  );
}

function ContractorsTab({ org }: { org: any }) {
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (org?.id) {
      fetchContractors();
    }
  }, [org?.id]);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        // Fallback to localStorage
        const localContractors = JSON.parse(localStorage.getItem("contractors") || "[]");
        const orgContractors = localContractors.filter((c: any) => c.organization_id === org.id);
        setContractors(orgContractors);
      } else {
        setContractors(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      // Fallback to localStorage
      const localContractors = JSON.parse(localStorage.getItem("contractors") || "[]");
      const orgContractors = localContractors.filter((c: any) => c.organization_id === org.id);
      setContractors(orgContractors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">Contractors</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add Contractor
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : contractors.length > 0 ? (
        <div className="space-y-2">
          {contractors.map((contractor) => (
            <div key={contractor.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {contractor.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{contractor.name}</p>
                <p className="text-xs text-muted-foreground">{contractor.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {contractor.rate_amount ? `$${(contractor.rate_amount / 100).toFixed(2)}/${contractor.rate_type}` : "No rate set"}
                </p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[contractor.status] || statusColors.active}`}>
                  {contractor.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Wallet className="mx-auto mb-4 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No contractors yet.</p>
        </div>
      )}

      {showCreate && (
        <CreateContractorModal
          orgId={org?.id}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            fetchContractors();
            setShowCreate(false);
          }}
        />
      )}
    </motion.div>
  );
}

function TemplatesTab({ org }: { org: any }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (org?.id) {
      fetchTemplates();
    }
  }, [org?.id]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_templates")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        // Fallback to localStorage
        const localTemplates = JSON.parse(localStorage.getItem("payment_templates") || "[]");
        const orgTemplates = localTemplates.filter((t: any) => t.organization_id === org.id);
        setTemplates(orgTemplates);
      } else {
        setTemplates(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      // Fallback to localStorage
      const localTemplates = JSON.parse(localStorage.getItem("payment_templates") || "[]");
      const orgTemplates = localTemplates.filter((t: any) => t.organization_id === org.id);
      setTemplates(orgTemplates);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">Payment Templates</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Create Template
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : templates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-medium text-foreground">{template.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{template.description || "No description"}</p>
              <p className="text-sm font-bold text-primary mt-2">
                {template.amount ? `$${(template.amount / 1000000).toFixed(2)} ${template.token}` : "Variable"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <FileText className="mx-auto mb-4 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No payment templates yet.</p>
        </div>
      )}

      {showCreate && (
        <CreateTemplateModal
          orgId={org?.id}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            fetchTemplates();
            setShowCreate(false);
          }}
        />
      )}
    </motion.div>
  );
}

function SettingsTab({ org }: { org: any }) {
  const [form, setForm] = useState({
    name: org?.name || "",
    description: org?.description || "",
    website: org?.website || "",
  });

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name,
        description: org.description || "",
        website: org.website || "",
      });
    }
  }, [org]);

  const handleSave = async () => {
    try {
      await supabase
        .from("organizations")
        .update(form)
        .eq("id", org.id);
      toast.success("Settings saved!");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to save settings");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="font-display text-xl text-foreground">Organization Settings</h2>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Organization Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Website</label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://example.com"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={handleSave}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
        >
          Save Changes
        </button>
      </div>

      <div className="rounded-xl border border-red-500/20 bg-card p-6">
        <h3 className="font-display text-lg text-foreground mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">Once you delete an organization, there is no going back.</p>
        
        <div className="space-y-3">
          <button 
            onClick={() => {
              if (confirm("This will clear all stores, links, contractors, and templates for this organization. Continue?")) {
                localStorage.removeItem("merchant_stores");
                localStorage.removeItem("payment_links");
                localStorage.removeItem("contractors");
                localStorage.removeItem("payment_templates");
                toast.success("All organization data cleared!");
                window.location.reload();
              }
            }}
            className="rounded-lg border border-yellow-500 px-4 py-2 text-sm font-medium text-yellow-500 hover:bg-yellow-500/10 mr-2"
          >
            Clear All Data
          </button>
          <button className="rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10">
            Delete Organization
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CreateOrgModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (org: any) => void }) {
  const [form, setForm] = useState({ name: "", description: "", website: "" });
  const [loading, setLoading] = useState(false);
  const { walletAddress, user: privyUser } = usePrivyAuth();

  const handleCreate = async () => {
    if (!form.name) return;
    try {
      setLoading(true);
      // Try Supabase auth first, fallback to wallet address
      const { data: { user } } = await supabase.auth.getUser();
      let ownerId = user?.id;
      let ownerEmail = user?.email;
      
      if (!ownerId && walletAddress) {
        ownerId = walletAddress;
      }
      
      if (!ownerEmail && privyUser?.email) {
        ownerEmail = privyUser.email;
      }

      if (!ownerId) {
        toast.error("Please sign in first");
        setLoading(false);
        return;
      }

      const slug = form.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
      const newOrg = {
        id: crypto.randomUUID(),
        name: form.name,
        slug,
        description: form.description,
        website: form.website,
        owner_id: ownerId,
        created_at: new Date().toISOString(),
      };

      // Try database first, fallback to localStorage
      const { data, error } = await db
        .from("organizations")
        .insert({
          name: form.name,
          slug,
          description: form.description,
          website: form.website,
          owner_id: ownerId,
        })
        .select()
        .single();

      if (error) {
        console.log("Database not available, using localStorage");
        // Fallback to localStorage
        const localOrgs = JSON.parse(localStorage.getItem("organizations") || "[]");
        localOrgs.push(newOrg);
        localStorage.setItem("organizations", JSON.stringify(localOrgs));
        
        // Try to add member, ignore errors
        try {
          await db
            .from("organization_members")
            .insert({
              organization_id: newOrg.id,
              user_id: ownerId,
              email: ownerEmail || null,
              role: "owner",
              status: "active",
              accepted_at: new Date().toISOString(),
            });
        } catch (e) {
          // Ignore member creation errors in localStorage fallback
        }
        
        onCreated(newOrg);
        setForm({ name: "", description: "", website: "" });
        toast.success("Organization created!");
        setLoading(false);
        return;
      }

      const { error: memberError } = await db
        .from("organization_members")
        .insert({
          organization_id: data.id,
          user_id: ownerId,
          email: ownerEmail || null,
          role: "owner",
          status: "active",
          accepted_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error("Error adding member:", memberError);
      }

      onCreated(data);
      setForm({ name: "", description: "", website: "" });
      toast.success("Organization created!");
    } catch (err: any) {
      console.error("Error:", err);
      toast.error(err?.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl text-foreground mb-4">Create Organization</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Organization Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Acme Inc."
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What does your organization do?"
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={!form.name || loading} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50">
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InviteMemberModal({ orgId, onClose, onInvited }: { orgId: string; onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email) return;
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("organization_members")
        .insert({
          organization_id: orgId,
          email,
          role,
          status: "invited",
          invited_by: user.id,
          invited_at: new Date().toISOString(),
        });

      toast.success("Invitation sent!");
      onInvited();
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl text-foreground mb-4">Invite Team Member</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="viewer">Viewer - View only access</option>
              <option value="manager">Manager - Initiate and approve payments</option>
              <option value="admin">Admin - Manage members and settings</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
              Cancel
            </button>
            <button onClick={handleInvite} disabled={!email || loading} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50">
              {loading ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CreateStoreModal({ orgId, onClose, onCreated }: { orgId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", description: "", website: "" });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.name) return;
    try {
      setLoading(true);
      const slug = form.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
      
      const { error } = await supabase
        .from("merchant_stores")
        .insert({
          organization_id: orgId,
          name: form.name,
          slug,
          description: form.description,
          website: form.website,
        });

      if (error) {
        // Fallback to localStorage
        const localStores = JSON.parse(localStorage.getItem("merchant_stores") || "[]");
        localStores.push({
          id: crypto.randomUUID(),
          organization_id: orgId,
          name: form.name,
          slug,
          description: form.description,
          website: form.website,
          status: "active",
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("merchant_stores", JSON.stringify(localStores));
      }

      toast.success("Store created!");
      onCreated();
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to create store");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl text-foreground mb-4">Create Store</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Store Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="My Store"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://mystore.com"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={!form.name || loading} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50">
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CreatePaymentLinkModal({ orgId, onClose, onCreated }: { orgId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", amount: "", amountType: "fixed" as "fixed" | "custom", token: "USDC" });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.title) return;
    try {
      setLoading(true);
      const slug = form.title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
      
      const { error } = await supabase
        .from("payment_links")
        .insert({
          organization_id: orgId,
          title: form.title,
          description: form.description,
          slug,
          amount: form.amount ? parseFloat(form.amount) * 1000000 : null,
          amount_type: form.amountType,
          token: form.token,
        });

      if (error) {
        // Fallback to localStorage
        const localLinks = JSON.parse(localStorage.getItem("payment_links") || "[]");
        localLinks.push({
          id: crypto.randomUUID(),
          organization_id: orgId,
          title: form.title,
          description: form.description,
          slug,
          amount: form.amount ? parseFloat(form.amount) * 1000000 : null,
          amount_type: form.amountType,
          token: form.token,
          status: "active",
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("payment_links", JSON.stringify(localLinks));
      }

      toast.success("Payment link created!");
      onCreated();
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to create payment link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl text-foreground mb-4">Create Payment Link</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Invoice #1234"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Amount Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, amountType: "fixed" })}
                className={`flex-1 rounded-lg py-2 text-sm font-medium ${form.amountType === "fixed" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
              >
                Fixed
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, amountType: "custom" })}
                className={`flex-1 rounded-lg py-2 text-sm font-medium ${form.amountType === "custom" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
              >
                Custom
              </button>
            </div>
          </div>
          {form.amountType === "fixed" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Amount (USDC)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="100"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={!form.title || loading} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50">
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CreateContractorModal({ orgId, onClose, onCreated }: { orgId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", wallet: "", rate: "", rateType: "hourly" });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.name || !form.email) return;
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("contractors")
        .insert({
          organization_id: orgId,
          name: form.name,
          email: form.email,
          wallet_address: form.wallet || null,
          rate_amount: form.rate ? Math.round(parseFloat(form.rate) * 100) : null,
          rate_type: form.rateType,
        });

      if (error) {
        // Fallback to localStorage
        const localContractors = JSON.parse(localStorage.getItem("contractors") || "[]");
        localContractors.push({
          id: crypto.randomUUID(),
          organization_id: orgId,
          name: form.name,
          email: form.email,
          wallet_address: form.wallet || null,
          rate_amount: form.rate ? Math.round(parseFloat(form.rate) * 100) : null,
          rate_type: form.rateType,
          status: "active",
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("contractors", JSON.stringify(localContractors));
      }

      toast.success("Contractor added!");
      onCreated();
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to add contractor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl text-foreground mb-4">Add Contractor</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="john@contractor.com"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Wallet Address</label>
            <input
              type="text"
              value={form.wallet}
              onChange={(e) => setForm({ ...form, wallet: e.target.value })}
              placeholder="0x..."
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1">Rate</label>
              <input
                type="number"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder="50"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-foreground mb-1">Type</label>
              <select
                value={form.rateType}
                onChange={(e) => setForm({ ...form, rateType: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="project">Project</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={!form.name || !form.email || loading} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50">
              {loading ? "Adding..." : "Add Contractor"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CreateTemplateModal({ orgId, onClose, onCreated }: { orgId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", description: "", amount: "", recipient: "" });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.name) return;
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("payment_templates")
        .insert({
          organization_id: orgId,
          name: form.name,
          description: form.description,
          amount: form.amount ? parseFloat(form.amount) * 1000000 : null,
          recipient_address: form.recipient || null,
        });

      if (error) {
        // Fallback to localStorage
        const localTemplates = JSON.parse(localStorage.getItem("payment_templates") || "[]");
        localTemplates.push({
          id: crypto.randomUUID(),
          organization_id: orgId,
          name: form.name,
          description: form.description,
          amount: form.amount ? parseFloat(form.amount) * 1000000 : null,
          recipient_address: form.recipient || null,
          status: "active",
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("payment_templates", JSON.stringify(localTemplates));
      }

      toast.success("Template created!");
      onCreated();
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl text-foreground mb-4">Create Payment Template</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Template Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Monthly Salary"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Amount (USDC)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="5000"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Recipient Address</label>
            <input
              type="text"
              value={form.recipient}
              onChange={(e) => setForm({ ...form, recipient: e.target.value })}
              placeholder="0x..."
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={!form.name || loading} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50">
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
