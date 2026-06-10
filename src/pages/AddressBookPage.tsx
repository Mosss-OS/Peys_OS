/** AddressBookPage - Wallet address book with starred favorites, search, add, delete, and send actions */
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Search, User, Trash2, Edit, Star, Clock, ChevronRight, X, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Contact {
  id: string;
  address: string;
  label: string;
  avatar?: string;
  starred: boolean;
  lastTransaction?: string;
  transactionCount: number;
}

/** AddressBookPage component - Manages wallet contacts with starring, search filtering, add/delete, and quick-send */
export default function AddressBookPage() {
  const { isLoggedIn, login } = useApp();
  const [contacts, setContacts] = useState<Contact[]>([
    { id: "1", address: "0x1234567890abcdef1234567890abcdef12345678", label: "John Doe", starred: true, lastTransaction: "2026-03-18", transactionCount: 15 },
    { id: "2", address: "0xabcdef1234567890abcdef1234567890abcdef12", label: "Jane Smith", starred: true, lastTransaction: "2026-03-17", transactionCount: 8 },
    { id: "3", address: "0x9876543210fedcba9876543210fedcba98765432", label: "Work Account", starred: false, lastTransaction: "2026-03-15", transactionCount: 3 },
    { id: "4", address: "0xmoses1234567890abcdef1234567890abcdef1234", label: "Savings", starred: false, lastTransaction: "2026-03-10", transactionCount: 12 },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({ label: "", address: "" });

  const filteredContacts = contacts.filter(c =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const starredContacts = filteredContacts.filter(c => c.starred);
  const otherContacts = filteredContacts.filter(c => !c.starred);

  const handleAdd = () => {
    if (!newContact.label || !newContact.address) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(newContact.address)) {
      toast.error("Invalid Ethereum address");
      return;
    }
    const contact: Contact = {
      id: Date.now().toString(),
      ...newContact,
      starred: false,
      transactionCount: 0,
    };
    setContacts([...contacts, contact]);
    setNewContact({ label: "", address: "" });
    setShowAddForm(false);
    toast.success("Contact added!");
  };

  const handleDelete = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
    toast.success("Contact deleted");
  };

  const toggleStar = (id: string) => {
    setContacts(contacts.map(c =>
      c.id === id ? { ...c, starred: !c.starred } : c
    ));
  };

  const handleSendTo = (contact: Contact) => {
    toast.success(`Opening send flow for ${contact.label}`);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Address Book</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Manage your contacts and frequently used addresses.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to View Contacts
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Address Book</h1>
            <p className="mt-1 text-sm text-muted-foreground">{contacts.length} contacts</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Contact
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Add New Contact</h3>
              <button onClick={() => setShowAddForm(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Label</label>
                <input
                  type="text"
                  value={newContact.label}
                  onChange={(e) => setNewContact({ ...newContact, label: e.target.value })}
                  placeholder="e.g., John Doe"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Address</label>
                <input
                  type="text"
                  value={newContact.address}
                  onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                  placeholder="0x..."
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:opacity-90"
            >
              Add Contact
            </button>
          </motion.div>
        )}

        {filteredContacts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No contacts</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery ? "No contacts match your search" : "Add your first contact to get started"}
            </p>
          </div>
        ) : (
          <>
            {starredContacts.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Starred ({starredContacts.length})
                </h2>
                <div className="space-y-2">
                  {starredContacts.map((contact) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{contact.label}</p>
                          <p className="font-mono text-sm text-muted-foreground">
                            {contact.address.slice(0, 10)}...{contact.address.slice(-8)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStar(contact.id)}
                          className="rounded-lg p-2 hover:bg-secondary"
                        >
                          <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                        </button>
                        <button
                          onClick={() => handleSendTo(contact)}
                          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                        >
                          Send
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="rounded-lg p-2 hover:bg-secondary"
                        >
                          <Trash2 className="h-5 w-5 text-red-500" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {otherContacts.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                  All Contacts ({otherContacts.length})
                </h2>
                <div className="space-y-2">
                  {otherContacts.map((contact) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{contact.label}</p>
                          <p className="font-mono text-sm text-muted-foreground">
                            {contact.address.slice(0, 10)}...{contact.address.slice(-8)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStar(contact.id)}
                          className="rounded-lg p-2 hover:bg-secondary"
                        >
                          <Star className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleSendTo(contact)}
                          className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
                        >
                          Send
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="rounded-lg p-2 hover:bg-secondary"
                        >
                          <Trash2 className="h-5 w-5 text-red-500" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
