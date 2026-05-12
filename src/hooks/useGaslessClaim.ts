import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GaslessClaimResult {
  success: boolean;
  transactionHash: string;
  action: string;
  paymentId?: number;
}

export function useGaslessClaim() {
  const claimGaslessly = useCallback(async (
    paymentId: number,
    secret: string,
    chainId?: number
  ): Promise<GaslessClaimResult> => {
    const { data, error } = await supabase.functions.invoke("blockchain-signer", {
      body: {
        action: "claim",
        paymentId,
        secret,
        chainId: chainId || 84532,
      },
    });

    if (error) {
      throw new Error(error.message || "Failed to submit gasless claim");
    }

    return data as GaslessClaimResult;
  }, []);

  return { claimGaslessly };
}
