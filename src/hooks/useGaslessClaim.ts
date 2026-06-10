/**
 * @file Provides a gasless claim mechanism by invoking a Supabase Edge Function.
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Result returned from the gasless claim edge function. */
interface GaslessClaimResult {
  success: boolean;
  transactionHash: string;
  action: string;
  paymentId?: number;
}

/**
 * Hook that submits a claim transaction via a Supabase Edge Function,
 * allowing the user to claim without paying gas fees.
 */
export function useGaslessClaim() {
  const claimGaslessly = useCallback(async (
    paymentId: number,
    secret: string,
    chainId?: number
  ): Promise<GaslessClaimResult> => {
    const { data, error } = await supabase.functions.invoke("peys-blockchain-signer", {
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
