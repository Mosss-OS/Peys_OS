import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, Settings, Clock, DollarSign, AlertCircle, Info, X, Filter } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "payment" | "claim" | "system" | "security";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const { isLoggedIn, login } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "1", type: "payment", title: "Payment Received", message: "You received $50.00 USDC from 0x1234...5678", timestamp: "2026-03-18 14:30", read: false },
    { id: "2", type: "claim", title: "Funds Ready to Claim", message: "You have $125.00 USDC waiting to be claimed", timestamp: "2026-03-18 12:00", read: false },
    { id: "3", type: "security", title: "New Device Login", message: "A new device logged into your account from Chrome on Mac", timestamp: "2026-03-17 09:15", read: true },
    { id: "4", type: "system", title: "Maintenance Complete", message: "Scheduled maintenance has been completed successfully", timestamp: "2026-03-16 18:00", read: true },
    { id: "5", type: "payment", title: "Payment Sent", message: "You sent $25.00 USDC to 0xabcd...efgh", timestamp: "2026-03-15 10:30", read: true },
  ]);
  const [filter, setFilter] = useState<"all" | Notification["type"]>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (showUnreadOnly && n.read) return false;
    if (filter !== "all" && n.type !== filter) return false;
    return true;
  });

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "payment":
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case "claim":
        return <DollarSign className="h-5 w-5 text-yellow-500" />;
      case "security":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "system":
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Notifications</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            View all your notifications and alerts in one place.
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to View Notifications
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
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </button>
            <button
              onClick={clearAll}
              disabled={notifications.length === 0}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            All
          </button>
          {(["payment", "claim", "security", "system"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                filter === type ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {type}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <input
              type="checkbox"
              id="unreadOnly"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="unreadOnly" className="text-sm text-muted-foreground">
              Unread only
            </label>
          </div>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No notifications</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {showUnreadOnly ? "You've read all notifications!" : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification, i) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl border bg-card p-5 ${
                  notification.read ? "border-border" : "border-primary/50 bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    notification.type === "payment" ? "bg-green-500/10" :
                    notification.type === "claim" ? "bg-yellow-500/10" :
                    notification.type === "security" ? "bg-red-500/10" :
                    "bg-blue-500/10"
                  }`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{notification.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className={`rounded-lg p-2 transition-colors ${
                          notification.read ? "opacity-0" : "hover:bg-secondary"
                        }`}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </button>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
