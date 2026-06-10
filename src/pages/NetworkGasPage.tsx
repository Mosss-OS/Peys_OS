/** NetworkGasPage - Live gas price tracker and gas saving tips across supported networks. */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Fuel,
  Info,
  ArrowDownRight,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";



/** Page displaying live gas tracker placeholder and gas-saving tips. */
export default function NetworkGasPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container px-4 py-6 pb-24 mx-auto max-w-2xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Fuel className="h-5 w-5" />
                Gas Tracker
              </CardTitle>
              <CardDescription>
                Live gas prices across supported networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Fuel className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-1">
                  Gas price data requires a real RPC connection.
                </p>
                <p className="text-xs text-muted-foreground">
                  Connect a wallet or configure an RPC endpoint to see live gas estimates.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Gas Saving Tips</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-start gap-2">
                      <ArrowDownRight className="h-3 w-3 mt-0.5" />
                      Send during off-peak hours (weekends, late nights) for lower fees
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowDownRight className="h-3 w-3 mt-0.5" />
                      Batch multiple transactions to reduce per-transaction overhead
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowDownRight className="h-3 w-3 mt-0.5" />
                      Use Standard speed for non-urgent transfers to save up to 50%
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
