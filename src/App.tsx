import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "@privy-io/wagmi";
import { config } from "@/lib/wagmi";
import { PrivyAppProvider } from "@/contexts/PrivyContext";
import { AppProvider } from "@/contexts/AppContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { SoundProvider } from "@/hooks/useSound";
import { HapticProvider } from "@/hooks/useHaptic";
import { WakeLockProvider } from "@/hooks/useWakeLock";
import ScrollToTop from "@/components/ScrollToTop";
import AIChatBubble from "@/components/AIChatBubble";
import MobileBottomNav from "@/components/MobileBottomNav";

import Index from "./pages/Index";
import SendPage from "./pages/SendPage";
import PublicPaymentPage from "./pages/PublicPaymentPage";
import MerchantPayPage from "./pages/MerchantPayPage";
import ClaimPage from "./pages/ClaimPage";
import DashboardPage from "./pages/DashboardPage";
import AssetsPage from "./pages/AssetsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import StreamingPage from "./pages/StreamingPage";
import BatchPage from "./pages/BatchPage";
import EscrowPage from "./pages/EscrowPage";
import CalendarPage from "./pages/CalendarPage";
import VerificationBadgesPage from "./pages/VerificationBadgesPage";
import RecurringPaymentsPage from "./pages/RecurringPaymentsPage";
import TipJarPage from "./pages/TipJarPage";
import TransactionBundlerPage from "./pages/TransactionBundlerPage";
import BlockExplorerPage from "./pages/BlockExplorerPage";
import AddressLabelsPage from "./pages/AddressLabelsPage";
import CashbackPage from "./pages/CashbackPage";
import ApprovalWorkflowPage from "./pages/ApprovalWorkflowPage";
import DisputePage from "./pages/DisputePage";
import SubscriptionPage from "./pages/SubscriptionPage";
import AffiliatePage from "./pages/AffiliatePage";
import MiniGamesPage from "./pages/MiniGamesPage";
import SmartContractPage from "./pages/SmartContractPage";
import GiftCardsPage from "./pages/GiftCardsPage";
import SocialFeedPage from "./pages/SocialFeedPage";
import TimeLockPage from "./pages/TimeLockPage";
import NfcPage from "./pages/NfcPage";
import AccountRecoveryPage from "./pages/AccountRecoveryPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import WhitelabelPage from "./pages/WhitelabelPage";
import TaxReportPage from "./pages/TaxReportPage";
import InvoicePage from "./pages/InvoicePage";
import DonationPage from "./pages/DonationPage";
import SplitBillPage from "./pages/SplitBillPage";
import StatementPage from "./pages/StatementPage";
import HistoryPage from "./pages/HistoryPage";
import BillsPage from "./pages/BillsPage";
import FiatWithdrawalPage from "./pages/FiatWithdrawalPage";
import ReceiveDepositsPage from "./pages/ReceiveDepositsPage";
import BuyCryptoPage from "./pages/BuyCryptoPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import QRPaymentsPage from "./pages/QRPaymentsPage";
import PrivacyPage from "./pages/PrivacyPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import DataDeletionPage from "./pages/DataDeletionPage";
import ReferralPage from "./pages/ReferralPage";
import ReminderPage from "./pages/ReminderPage";
import TemplatesPage from "./pages/TemplatesPage";
import MerchantToolsPage from "./pages/MerchantToolsPage";
import VerificationPage from "./pages/VerificationPage";
import LoyaltyPage from "./pages/LoyaltyPage";
import LimitsPage from "./pages/LimitsPage";
import QRServicePage from "./pages/QRServicePage";
import RoundUpSavingsPage from "./pages/RoundUpSavingsPage";
import AutoReceivePage from "./pages/AutoReceivePage";
import ClipboardPage from "./pages/ClipboardPage";
import BiometricPage from "./pages/BiometricPage";
import ScheduledPaymentsPage from "./pages/ScheduledPaymentsPage";
import BulkSendPage from "./pages/BulkSendPage";
import ImportExportPage from "./pages/ImportExportPage";
import QRScannerPage from "./pages/QRScannerPage";
import ReceiptPage from "./pages/ReceiptPage";
import NetworkGasPage from "./pages/NetworkGasPage";
import SecurityPage from "./pages/SecurityPage";
import HelpFAQPage from "./pages/HelpFAQPage";
import WalletAddressPage from "./pages/WalletAddressPage";
import WaitingRoomPage from "./pages/WaitingRoomPage";
import KeyboardShortcutsPage from "./pages/KeyboardShortcutsPage";
import AccessibilityPage from "./pages/AccessibilityPage";
import SessionManagementPage from "./pages/SessionManagementPage";
import MultiLanguagePage from "./pages/MultiLanguagePage";
import WebSocketSettingsPage from "./pages/WebSocketSettingsPage";
import CachingPage from "./pages/CachingPage";
import RateLimitingPage from "./pages/RateLimitingPage";
import GestureControlsPage from "./pages/GestureControlsPage";
import UndoFunctionalityPage from "./pages/UndoFunctionalityPage";
import VoiceInputPage from "./pages/VoiceInputPage";
import NotificationsPage from "./pages/NotificationsPage";
import PendingTransactionsPage from "./pages/PendingTransactionsPage";
import AddressBookPage from "./pages/AddressBookPage";
import RequestPage from "./pages/RequestPage";
import ContactsPage from "./pages/ContactsPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import DevelopersPage from "./pages/DevelopersPage";
import CrossChainPage from "./pages/CrossChainPage";
import MultiChainPage from "./pages/MultiChainPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import WhatsAppRegisterPage from "./pages/WhatsAppRegisterPage";
import WebhooksPage from "./pages/WebhooksPage";
import DocsPage from "./pages/docs/DocsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyAppProvider>
        <WagmiProvider config={config}>
          <AppProvider>
            <ThemeProvider>
              <OfflineProvider>
                <SoundProvider>
                  <HapticProvider>
                    <WakeLockProvider>
                      <TooltipProvider>
                        <Toaster />
                        <Sonner />
                        <BrowserRouter>
                          <ScrollToTop />
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/send" element={<SendPage />} />
                            <Route path="/public" element={<PublicPaymentPage />} />
                            <Route path="/pay/:slug" element={<MerchantPayPage />} />
                            <Route path="/pay" element={<PublicPaymentPage />} />
                            <Route path="/claim/:id" element={<ClaimPage />} />
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/assets" element={<AssetsPage />} />
                            <Route path="/analytics" element={<AnalyticsPage />} />
                            <Route path="/streaming" element={<StreamingPage />} />
                            <Route path="/batch" element={<BatchPage />} />
                            <Route path="/escrow" element={<EscrowPage />} />
                            <Route path="/calendar" element={<CalendarPage />} />
                            <Route path="/badges" element={<VerificationBadgesPage />} />
                            <Route path="/recurring" element={<RecurringPaymentsPage />} />
                            <Route path="/tipjar" element={<TipJarPage />} />
                            <Route path="/bundle" element={<TransactionBundlerPage />} />
                            <Route path="/explorer" element={<BlockExplorerPage />} />
                            <Route path="/labels" element={<AddressLabelsPage />} />
                            <Route path="/cashback" element={<CashbackPage />} />
                            <Route path="/approvals" element={<ApprovalWorkflowPage />} />
                            <Route path="/disputes" element={<DisputePage />} />
                            <Route path="/subscriptions" element={<SubscriptionPage />} />
                            <Route path="/affiliate" element={<AffiliatePage />} />
                            <Route path="/games" element={<MiniGamesPage />} />
                            <Route path="/contract" element={<SmartContractPage />} />
                            <Route path="/giftcards" element={<GiftCardsPage />} />
                            <Route path="/feed" element={<SocialFeedPage />} />
                            <Route path="/timelock" element={<TimeLockPage />} />
                            <Route path="/nfc" element={<NfcPage />} />
                            <Route path="/account-recovery" element={<AccountRecoveryPage />} />
                            <Route path="/organizations" element={<OrganizationsPage />} />
                            <Route path="/whitelabel" element={<WhitelabelPage />} />
                            <Route path="/tax-report" element={<TaxReportPage />} />
                            <Route path="/invoice" element={<InvoicePage />} />
                            <Route path="/donation" element={<DonationPage />} />
                            <Route path="/split-bill" element={<SplitBillPage />} />
                            <Route path="/statement" element={<StatementPage />} />
                            <Route path="/history" element={<HistoryPage />} />
                            <Route path="/bills" element={<BillsPage />} />
                            <Route path="/withdraw" element={<FiatWithdrawalPage />} />
                            <Route path="/deposit" element={<ReceiveDepositsPage />} />
                            <Route path="/buy" element={<BuyCryptoPage />} />
                            <Route path="/qr" element={<QRPaymentsPage />} />
                            <Route path="/privacy" element={<PrivacyPage />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                            <Route path="/data-deletion" element={<DataDeletionPage />} />
                            <Route path="/referral" element={<ReferralPage />} />
                            <Route path="/budget" element={<ReminderPage />} />
                            <Route path="/templates" element={<TemplatesPage />} />
                            <Route path="/merchant" element={<MerchantToolsPage />} />
                            <Route path="/verification" element={<VerificationPage />} />
                            <Route path="/loyalty" element={<LoyaltyPage />} />
                            <Route path="/limits" element={<LimitsPage />} />
                            <Route path="/qr-service" element={<QRServicePage />} />
                            <Route path="/roundup" element={<RoundUpSavingsPage />} />
                            <Route path="/auto-receive" element={<AutoReceivePage />} />
                            <Route path="/clipboard" element={<ClipboardPage />} />
                            <Route path="/biometric" element={<BiometricPage />} />
                            <Route path="/scheduled" element={<ScheduledPaymentsPage />} />
                            <Route path="/bulk-send" element={<BulkSendPage />} />
                            <Route path="/import-export" element={<ImportExportPage />} />
                            <Route path="/qr-scanner" element={<QRScannerPage />} />
                            <Route path="/receipt/:id" element={<ReceiptPage />} />
                            <Route path="/network-gas" element={<NetworkGasPage />} />
                            <Route path="/security" element={<SecurityPage />} />
                            <Route path="/help-faq" element={<HelpFAQPage />} />
                            <Route path="/wallet-address" element={<WalletAddressPage />} />
                            <Route path="/waiting-room" element={<WaitingRoomPage />} />
                            <Route path="/keyboard-shortcuts" element={<KeyboardShortcutsPage />} />
                            <Route path="/accessibility" element={<AccessibilityPage />} />
                            <Route path="/sessions" element={<SessionManagementPage />} />
                            <Route path="/language" element={<MultiLanguagePage />} />
                            <Route path="/websocket" element={<WebSocketSettingsPage />} />
                            <Route path="/cache" element={<CachingPage />} />
                            <Route path="/rate-limit" element={<RateLimitingPage />} />
                            <Route path="/gesture-controls" element={<GestureControlsPage />} />
                            <Route path="/undo" element={<UndoFunctionalityPage />} />
                            <Route path="/voice-input" element={<VoiceInputPage />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                            <Route path="/pending" element={<PendingTransactionsPage />} />
                            <Route path="/address-book" element={<AddressBookPage />} />
                            <Route path="/request" element={<RequestPage />} />
                            <Route path="/contacts" element={<ContactsPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/developers" element={<DevelopersPage />} />
                            <Route path="/cross-chain" element={<CrossChainPage />} />
                            <Route path="/networks" element={<MultiChainPage />} />
                            <Route path="/whatsapp" element={<WhatsAppPage />} />
                            <Route path="/whatsapp-register" element={<WhatsAppRegisterPage />} />
                            <Route path="/webhooks" element={<WebhooksPage />} />
                            <Route path="/docs" element={<DocsPage />} />
                            <Route path="/docs/:slug" element={<DocsPage />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                          <MobileBottomNav />
                          <AIChatBubble />
                        </BrowserRouter>
                      </TooltipProvider>
                    </WakeLockProvider>
                  </HapticProvider>
                </SoundProvider>
              </OfflineProvider>
            </ThemeProvider>
          </AppProvider>
        </WagmiProvider>
      </PrivyAppProvider>
    </QueryClientProvider>
  );
}
