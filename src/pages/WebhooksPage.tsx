import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  event_type: string;
  success: boolean;
  response_status: number;
  duration_ms: number;
  created_at: string;
}

const EVENT_OPTIONS = [
  { value: "payment.created", label: "Payment Created" },
  { value: "payment.claimed", label: "Payment Claimed" },
  { value: "payment.expired", label: "Payment Expired" },
  { value: "payment.refunded", label: "Payment Refunded" },
];

export default function WebhooksPage() {
  const { isLoggedIn } = useApp();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, WebhookDelivery[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  
  const [newWebhook, setNewWebhook] = useState({
    url: "",
    events: ["payment.created", "payment.claimed"],
  });

  useEffect(() => {
    if (isLoggedIn) {
      loadWebhooks();
    }
  }, [isLoggedIn]);

  const loadWebhooks = async () => {
    try {
      const { data: webhooksData, error } = await supabase
        .from("webhooks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWebhooks(webhooksData || []);
    } catch (error) {
      console.error("Error loading webhooks:", error);
      toast.error("Failed to load webhooks");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeliveries = async (webhookId: string) => {
    try {
      const { data, error } = await supabase
        .from("webhook_deliveries")
        .select("*")
        .eq("webhook_id", webhookId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setDeliveries((prev) => ({ ...prev, [webhookId]: data || [] }));
    } catch (error) {
      console.error("Error loading deliveries:", error);
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.url) {
      toast.error("Please enter a webhook URL");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("webhooks")
        .insert({
          url: newWebhook.url,
          events: newWebhook.events,
          secret: crypto.randomUUID(),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setWebhooks([data, ...webhooks]);
      setShowCreateDialog(false);
      setNewWebhook({ url: "", events: ["payment.created", "payment.claimed"] });
      toast.success("Webhook created successfully");
    } catch (error) {
      console.error("Error creating webhook:", error);
      toast.error("Failed to create webhook");
    }
  };

  const toggleWebhook = async (webhookId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("webhooks")
        .update({ is_active: !currentStatus })
        .eq("id", webhookId);

      if (error) throw error;

      setWebhooks(
        webhooks.map((w) =>
          w.id === webhookId ? { ...w, is_active: !currentStatus } : w
        )
      );
      toast.success(`Webhook ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error updating webhook:", error);
      toast.error("Failed to update webhook");
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const { error } = await supabase
        .from("webhooks")
        .delete()
        .eq("id", webhookId);

      if (error) throw error;

      setWebhooks(webhooks.filter((w) => w.id !== webhookId));
      toast.success("Webhook deleted");
    } catch (error) {
      console.error("Error deleting webhook:", error);
      toast.error("Failed to delete webhook");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to manage your webhooks
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure webhooks to receive real-time notifications about payment events
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Configure a URL to receive payment event notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="url">Webhook URL</Label>
                <Input
                  id="url"
                  placeholder="https://your-server.com/webhook"
                  value={newWebhook.url}
                  maxLength={500}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Events to subscribe</Label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_OPTIONS.map((event) => (
                    <Button
                      key={event.value}
                      variant={
                        newWebhook.events.includes(event.value) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setNewWebhook({
                          ...newWebhook,
                          events: newWebhook.events.includes(event.value)
                            ? newWebhook.events.filter((e) => e !== event.value)
                            : [...newWebhook.events, event.value],
                        })
                      }
                    >
                      {event.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createWebhook}>Create Webhook</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading webhooks...</div>
      ) : webhooks.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              No webhooks configured yet. Create your first webhook to receive real-time notifications.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-lg">{webhook.url}</CardTitle>
                    <Badge variant={webhook.is_active ? "default" : "secondary"}>
                      {webhook.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleWebhook(webhook.id, webhook.is_active)}
                    >
                      {webhook.is_active ? (
                        <ToggleRight className="h-5 w-5" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Events:</span>{" "}
                    {webhook.events.map((e) => (
                      <Badge key={e} variant="outline" className="ml-1">
                        {e}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-muted-foreground">Secret:</Label>
                    <Input
                      type={showSecret ? "text" : "password"}
                      value={webhook.secret}
                      readOnly
                      className="w-64"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(webhook.secret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {webhook.last_triggered_at && (
                  <p className="text-sm text-muted-foreground">
                    Last triggered: {new Date(webhook.last_triggered_at).toLocaleString()}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedWebhookId(webhook.id);
                    loadDeliveries(webhook.id);
                  }}
                >
                  View Delivery Logs
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delivery Logs Dialog */}
      <Dialog open={!!selectedWebhookId} onOpenChange={() => setSelectedWebhookId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Webhook Delivery Logs</DialogTitle>
            <DialogDescription>
              Recent delivery attempts for this webhook
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedWebhookId && deliveries[selectedWebhookId]?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No delivery logs yet
              </p>
            ) : (
              <div className="space-y-2">
                {selectedWebhookId &&
                  deliveries[selectedWebhookId]?.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <span className="font-medium">{delivery.event_type}</span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(delivery.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={
                            delivery.success
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {delivery.success ? "Success" : "Failed"}
                        </span>
                        <span className="text-muted-foreground">
                          {delivery.duration_ms}ms
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setSelectedWebhookId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
