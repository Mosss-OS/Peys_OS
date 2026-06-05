import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpRight, ArrowDownLeft, Clock, Copy, ExternalLink } from "lucide-react";
import type { Transaction } from "@/types/transaction";
import { toast } from "sonner";

interface Props {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}

const statusConfig = {
  sent: { label: "Sent", icon: ArrowUpRight, class: "bg-destructive/10 text-destructive" },
  claimed: { label: "Claimed", icon: ArrowDownLeft, class: "bg-primary/10 text-primary" },
  pending: { label: "Pending", icon: Clock, class: "bg-warning/10 text-warning" },
};

export default function TransactionDetailModal({ transaction: tx, open, onClose }: Props) {
  if (!tx) return null;

  const status = statusConfig[tx.type];
  const StatusIcon = status.icon;
  const claimUrl = tx.claimLink ? `${window.location.origin}/claim/${tx.claimLink}` : null;

  const copyClaimLink = () => {
    if (claimUrl) {
      navigator.clipboard.writeText(claimUrl);
      toast.success("Claim link copied!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-lg text-foreground">Transaction Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Amount & Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {tx.type === "claimed" ? "+" : "-"}{tx.amount} {tx.token}
              </p>
              <p className="text-sm text-muted-foreground">
                ≈ ${tx.amount.toLocaleString("en", { minimumFractionDigits: 2 })} USD
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.class}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>
          </div>

          {/* Details grid */}
          <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
            <Row label="Counterparty" value={tx.counterparty} />
            {tx.memo && <Row label="Memo" value={tx.memo} />}
            <Row label="Token" value={tx.token} />
            <Row label="Date" value={tx.timestamp.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
            {tx.expiresAt && (
              <Row
                label="Expires"
                value={tx.expiresAt.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                warn={tx.expiresAt < new Date()}
              />
            )}
          </div>

          {/* Claim Link */}
          {claimUrl && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Claim Link</p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5">
                <p className="flex-1 truncate text-xs text-foreground">{claimUrl}</p>
                <button onClick={copyClaimLink} className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <a href={claimUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="shrink-0 text-xs text-muted-foreground">{label}</p>
      <p className={`text-right text-xs font-medium ${warn ? "text-destructive" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
