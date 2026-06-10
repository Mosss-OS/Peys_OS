/** ContactsPage - Contact management with Supabase persistence, search, add, and delete */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Search, Trash2, Send, Mail, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Contact {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  wallet_address: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

/** ContactsPage component - Manages saved contacts with search, add form, delete, and send-to navigation */
export default function ContactsPage() {
  const { isLoggedIn, login } = useApp();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      fetchContacts();
    }
  }, [isLoggedIn]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching contacts:", error);
        // Fallback to empty array if table doesn't exist yet
        setContacts([]);
      } else {
        setContacts(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("contacts")
        .insert({
          user_id: user.id,
          name: newName.trim(),
          email: newEmail.trim() || null,
        });

      if (error) {
        console.error("Error adding contact:", error);
        toast.error("Failed to add contact");
        return;
      }

      toast.success("Contact added!");
      setNewName("");
      setNewEmail("");
      setShowAdd(false);
      fetchContacts();
    } catch (err: unknown) {
      console.error("Error:", err);
      const error = err as Error;
      toast.error(error?.message || "Failed to add contact");
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting contact:", error);
        toast.error("Failed to delete contact");
        return;
      }

      toast.success("Contact deleted");
      fetchContacts();
    } catch (err: unknown) {
      console.error("Error:", err);
      const error = err as Error;
      toast.error(error?.message || "Failed to delete contact");
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Mail className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Contacts</h2>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">Save frequent recipients for quick payments.</p>
            <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              Sign In
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q)) || (c.wallet_address && c.wallet_address.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-5xl lg:max-w-6xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-24 lg:pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl text-foreground sm:text-3xl">Contacts</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading ? "Loading..." : `${contacts.length} saved recipients`}
              </p>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
            >
              <UserPlus className="h-4 w-4" /> Add
            </button>
          </div>
        </motion.div>

        {/* Add contact form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
              <div className="rounded-xl border border-border bg-card p-4 lg:p-6 shadow-card">
                <div className="space-y-3">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
                  <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email address"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowAdd(false)} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">Cancel</button>
                    <button onClick={addContact} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Save Contact</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring sm:rounded-xl"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* All contacts */}
            {filtered.length > 0 ? (
              <div className="space-y-3 lg:space-y-4">
                {filtered.map((c, i) => (
                  <ContactRow key={c.id} contact={c} index={i} onDelete={deleteContact} formatDate={formatDate} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No contacts found.</p>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

function ContactRow({
  contact,
  index,
  onDelete,
  formatDate,
}: {
  contact: Contact;
  index: number;
  onDelete: (id: string) => void;
  formatDate: (dateStr?: string) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-secondary/20 sm:p-4 lg:p-5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{contact.name}</p>
        <p className="truncate text-xs text-muted-foreground">{contact.email || contact.wallet_address || "No email"}</p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-xs text-muted-foreground">Added: {formatDate(contact.created_at)}</p>
      </div>
      <div className="flex items-center gap-1">
        <Link to={`/send?recipient=${encodeURIComponent(contact.email || contact.wallet_address || "")}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary">
          <Send className="h-4 w-4" />
        </Link>
        <button onClick={() => onDelete(contact.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
