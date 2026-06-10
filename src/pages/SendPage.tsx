import AppHeader from "@/components/AppHeader";
import SendPaymentForm from "@/components/SendPaymentForm";
import Footer from "@/components/Footer";

export default function SendPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <SendPaymentForm />
      <Footer />
    </div>
  );
}
