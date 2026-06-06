/** WaitingRoomPage - Displays an empty waiting room state for queued events/live sessions */
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";

/** WaitingRoomPage component - Shows a placeholder when there are no active queues */
export default function WaitingRoomPage() {
  const [refreshInterval, setRefreshInterval] = useState(10);
  const [showTips, setShowTips] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container px-4 py-6 pb-24 mx-auto max-w-2xl">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Queue</h3>
                <p className="text-sm text-muted-foreground">
                  There are no active waiting rooms at this time. Check back later for upcoming events.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
