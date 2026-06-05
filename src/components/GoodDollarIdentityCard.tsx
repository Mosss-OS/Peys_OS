import { useState } from "react";
import { Shield, CheckCircle, Loader2, UserCheck, Globe, ExternalLink, AlertCircle, RefreshCw, Network } from "lucide-react";
import { toast } from "sonner";
import { useGoodDollarIdentity } from "@/hooks/useGoodDollarIdentity";
import { useSwitchChain } from "wagmi";

export default function GoodDollarIdentityCard() {
  const { identity, loading, error, checkIdentity, requestVerification, isIdentityDeployed, needsNetworkSwitch, identityChainId } = useGoodDollarIdentity();
  const { switchChainAsync } = useSwitchChain();
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (needsNetworkSwitch) {
      try {
        await switchChainAsync({ chainId: identityChainId });
      } catch {
        toast.error("Please switch to Celo Alfajores to verify your identity");
        return;
      }
    }
    setVerifying(true);
    try {
      await requestVerification();
      toast.success("GoodDollar Identity verification started! Complete it in the opened tab.");
    } catch (err: any) {
      toast.error(err?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const statusColor = identity.isVerified ? "text-green-500 bg-green-500/10" : "text-muted-foreground bg-secondary/50";
  const statusIcon = identity.isVerified ? CheckCircle : Shield;
  const StatusIcon = statusIcon;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg text-foreground">GoodDollar Identity</h3>
          <p className="text-xs text-muted-foreground">Decentralized identity verification</p>
        </div>
        {identity.verificationLevel !== "none" && (
          <div className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
            <StatusIcon className="h-3 w-3" />
            {identity.verificationLevel === "unique-human" ? "Unique Human" : identity.isVerified ? "Verified" : "Registered"}
          </div>
        )}
      </div>

      <div className="mb-3 flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1.5">
        <Network className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Powered by Celo Alfajores</span>
      </div>

      {!isIdentityDeployed ? (
        <div className="rounded-lg border border-dashed border-border bg-background/50 p-4 text-center">
          <Globe className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">Identity Contract Not Deployed</p>
          <p className="mt-1 text-xs text-muted-foreground">
            GoodDollar Identity will be available once deployed on this network.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm font-medium">Check Failed</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <button onClick={checkIdentity} className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
            <div className="flex items-center gap-2">
              <UserCheck className={`h-4 w-4 ${identity.isVerified ? "text-green-500" : "text-muted-foreground"}`} />
              <span className="text-sm text-foreground">Identity Status</span>
            </div>
            <span className={`text-xs font-medium ${identity.isVerified ? "text-green-500" : "text-muted-foreground"}`}>
              {identity.verificationLevel === "unique-human" ? "Unique Human ✓" : identity.isVerified ? "Verified ✓" : identity.isRegistered ? "Registered" : "Not Set Up"}
            </span>
          </div>

          {identity.isVerified && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-foreground">Verification Level</span>
              </div>
              <span className="text-xs font-medium text-primary">
                {identity.verificationLevel === "unique-human" ? "Unique Human" : "Basic Verified"}
              </span>
            </div>
          )}

          {identity.lastVerified && (
            <p className="text-xs text-muted-foreground">
              Last verified: {identity.lastVerified.toLocaleDateString()}
            </p>
          )}

          <div className="flex gap-2">
            {!identity.isVerified && (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                {verifying ? "Waiting for verification..." : "Verify via GoodDollar App"}
              </button>
            )}
            <button
              onClick={checkIdentity}
              disabled={loading}
              title="Refresh identity status"
              className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 px-3 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {!identity.isVerified && (
            <p className="text-xs text-muted-foreground text-center">
              Opens GoodDollar App in a new tab. Complete verification there, then refresh here.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
