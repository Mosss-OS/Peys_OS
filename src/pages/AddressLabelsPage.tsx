import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Plus, X, Check, Trash2, Edit2, Search, Filter, Loader2, Palette } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Label {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface AddressLabel {
  id: string;
  address: string;
  label_id: string;
  note?: string;
}

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6",
  "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280", "#1F2937",
];

export default function AddressLabelsPage() {
  const { isLoggedIn, login, transactions, walletAddress } = useApp();
  const [labels, setLabels] = useState<Label[]>([]);
  const [addressLabels, setAddressLabels] = useState<AddressLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<Label | null>(null);
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState(PRESET_COLORS[0]);
  const [assignAddress, setAssignAddress] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchLabels();
    fetchAddressLabels();
  }, [isLoggedIn]);

  const fetchLabels = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (data) {
        const stored = localStorage.getItem(`peys_labels_${data.id}`);
        if (stored) {
          setLabels(JSON.parse(stored));
        }
      }
    } catch (err) {
      console.error("Error fetching labels:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddressLabels = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        const stored = localStorage.getItem(`peys_address_labels_${profile.id}`);
        if (stored) {
          setAddressLabels(JSON.parse(stored));
        }
      }
    } catch (err) {
      console.error("Error fetching address labels:", err);
    }
  };

  const saveLabels = async (newLabels: Label[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        localStorage.setItem(`peys_labels_${profile.id}`, JSON.stringify(newLabels));
      }
    } catch (err) {
      console.error("Error saving labels:", err);
    }
  };

  const saveAddressLabels = async (newAddressLabels: AddressLabel[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        localStorage.setItem(`peys_address_labels_${profile.id}`, JSON.stringify(newAddressLabels));
      }
    } catch (err) {
      console.error("Error saving address labels:", err);
    }
  };

  const createLabel = async () => {
    if (!labelName.trim()) {
      toast.error("Please enter a label name");
      return;
    }

    const newLabel: Label = {
      id: crypto.randomUUID(),
      name: labelName.trim(),
      color: labelColor,
      created_at: new Date().toISOString(),
    };

    const newLabels = [...labels, newLabel];
    setLabels(newLabels);
    await saveLabels(newLabels);
    setLabelName("");
    setLabelColor(PRESET_COLORS[0]);
    setShowCreateModal(false);
    toast.success(`Label "${newLabel.name}" created`);
  };

  const updateLabel = async () => {
    if (!editingLabel || !labelName.trim()) return;

    const newLabels = labels.map(l =>
      l.id === editingLabel.id ? { ...l, name: labelName.trim(), color: labelColor } : l
    );
    setLabels(newLabels);
    await saveLabels(newLabels);
    setEditingLabel(null);
    setLabelName("");
    setLabelColor(PRESET_COLORS[0]);
    toast.success("Label updated");
  };

  const deleteLabel = async (labelId: string) => {
    const newLabels = labels.filter(l => l.id !== labelId);
    const newAddressLabels = addressLabels.filter(al => al.label_id !== labelId);
    setLabels(newLabels);
    setAddressLabels(newAddressLabels);
    await saveLabels(newLabels);
    await saveAddressLabels(newAddressLabels);
    toast.success("Label deleted");
  };

  const assignAddressToLabel = async () => {
    if (!selectedLabel || !assignAddress.trim()) {
      toast.error("Please enter an address");
      return;
    }

    if (!assignAddress.startsWith("0x") || assignAddress.length !== 42) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    const newAddressLabel: AddressLabel = {
      id: crypto.randomUUID(),
      address: assignAddress.toLowerCase(),
      label_id: selectedLabel.id,
      note: assignNote.trim() || undefined,
    };

    const existing = addressLabels.find(
      al => al.address === newAddressLabel.address && al.label_id === selectedLabel.id
    );

    if (existing) {
      toast.error("This address already has this label");
      return;
    }

    const newAddressLabels = [...addressLabels, newAddressLabel];
    setAddressLabels(newAddressLabels);
    await saveAddressLabels(newAddressLabels);
    setAssignAddress("");
    setAssignNote("");
    setShowAssignModal(false);
    setSelectedLabel(null);
    toast.success("Address labeled");
  };

  const removeAddressLabel = async (addressLabelId: string) => {
    const newAddressLabels = addressLabels.filter(al => al.id !== addressLabelId);
    setAddressLabels(newAddressLabels);
    await saveAddressLabels(newAddressLabels);
  };

  const filteredAddressLabels = useMemo(() => {
    let filtered = addressLabels;

    if (filterLabel) {
      filtered = filtered.filter(al => al.label_id === filterLabel);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(al =>
        al.address.toLowerCase().includes(query) ||
        al.note?.toLowerCase().includes(query)
      );
    }

    return filtered.map(al => {
      const label = labels.find(l => l.id === al.label_id);
      return { ...al, label };
    }).sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
  }, [addressLabels, labels, filterLabel, searchQuery]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Tag className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Address Labels</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Create custom labels and tags for wallet addresses to organize your contacts and favorite addresses.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Manage Labels
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
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Address Labels</h1>
            <p className="mt-1 text-sm text-muted-foreground">Organize wallet addresses with custom labels</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Label
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Labels Section */}
            <div className="mb-6 rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">Your Labels</h3>
              {labels.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No labels yet. Create your first label!
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {labels.map(label => (
                    <div
                      key={label.id}
                      className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
                      style={{ backgroundColor: `${label.color}20`, color: label.color }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                      <button
                        onClick={() => {
                          setEditingLabel(label);
                          setLabelName(label.name);
                          setLabelColor(label.color);
                          setShowCreateModal(true);
                        }}
                        className="ml-1 hover:opacity-70"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteLabel(label.id)}
                        className="hover:opacity-70"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filter & Search */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search addresses..."
                  className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={filterLabel || ""}
                  onChange={(e) => setFilterLabel(e.target.value || null)}
                  className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-10 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-48"
                >
                  <option value="">All Labels</option>
                  {labels.map(label => (
                    <option key={label.id} value={label.id}>{label.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Labeled Addresses */}
            <div className="space-y-2">
              <h3 className="mb-2 text-sm font-medium text-foreground">
                Labeled Addresses ({filteredAddressLabels.length})
              </h3>
              {filteredAddressLabels.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <Tag className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || filterLabel
                      ? "No addresses match your search"
                      : "No addresses labeled yet. Click a label to assign it to an address."}
                  </p>
                </div>
              ) : (
                filteredAddressLabels.map(({ id, address, note, label }) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {label && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: `${label.color}20`, color: label.color }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: label.color }} />
                            {label.name}
                          </span>
                        )}
                        <span className="truncate font-mono text-sm text-foreground">
                          {address.slice(0, 6)}...{address.slice(-4)}
                        </span>
                        {walletAddress?.toLowerCase() === address && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">You</span>
                        )}
                      </div>
                      {note && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">{note}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeAddressLabel(id)}
                      className="ml-3 shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      <Footer />

      {/* Create/Edit Label Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => { setShowCreateModal(false); setEditingLabel(null); setLabelName(""); setLabelColor(PRESET_COLORS[0]); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg text-foreground">
                  {editingLabel ? "Edit Label" : "Create Label"}
                </h3>
                <button
                  onClick={() => { setShowCreateModal(false); setEditingLabel(null); }}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Label Name</label>
                  <input
                    type="text"
                    value={labelName}
                    onChange={(e) => setLabelName(e.target.value)}
                    placeholder="e.g., Friends, Work, DAO..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setLabelColor(color)}
                        className="h-8 w-8 rounded-full transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                      >
                        {labelColor === color && <Check className="mx-auto h-4 w-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={editingLabel ? updateLabel : createLabel}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
                >
                  {editingLabel ? "Update Label" : "Create Label"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Address Modal */}
      <AnimatePresence>
        {showAssignModal && selectedLabel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => { setShowAssignModal(false); setSelectedLabel(null); setAssignAddress(""); setAssignNote(""); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg text-foreground">
                  Assign to{" "}
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium"
                    style={{ backgroundColor: `${selectedLabel.color}20`, color: selectedLabel.color }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedLabel.color }} />
                    {selectedLabel.name}
                  </span>
                </h3>
                <button
                  onClick={() => { setShowAssignModal(false); setSelectedLabel(null); }}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Wallet Address</label>
                  <input
                    type="text"
                    value={assignAddress}
                    onChange={(e) => setAssignAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Note (optional)</label>
                  <input
                    type="text"
                    value={assignNote}
                    onChange={(e) => setAssignNote(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <button
                  onClick={assignAddressToLabel}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
                >
                  <Tag className="h-4 w-4" />
                  Assign Label
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
