import { motion } from "framer-motion";
import { Trash2, Mail, Clock, AlertTriangle, CheckCircle, ExternalLink, FileText } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-3xl px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-invert max-w-none"
        >
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10">
              <Trash2 className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-foreground">Data Deletion Instructions</h1>
              <p className="text-sm text-muted-foreground">How to request deletion of your data</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-8">
            <section>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground font-medium">Important Notice</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Data deletion is irreversible. Once your data is deleted, it cannot be recovered. 
                      Please download any important data before requesting deletion.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <CheckCircle className="h-5 w-5 text-primary" />
                What Data We Hold
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Depending on your usage, we may hold the following personal data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Account information (name, email, phone number)</li>
                <li>Transaction history (send/receive records, amounts, timestamps)</li>
                <li>Wallet addresses (for non-custodial wallet users)</li>
                <li>API keys and webhook configurations</li>
                <li>KYC data (if submitted for verification)</li>
                <li>Communication history (support tickets, WhatsApp messages)</li>
                <li>Analytics and usage data</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <Trash2 className="h-5 w-5 text-primary" />
                How to Request Data Deletion
              </h2>
              
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h3 className="font-semibold text-foreground mb-3">Option 1: Email Request (Recommended)</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Send an email to our support team with your request.
                  </p>
                  <div className="bg-background rounded-md p-3 border border-border">
                    <p className="text-sm text-foreground font-mono">To: peys.xyz@gmail.com</p>
                    <p className="text-sm text-foreground font-mono">Subject: Data Deletion Request</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Include your registered email address and account details in the email body.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h3 className="font-semibold text-foreground mb-3">Option 2: In-App Request</h3>
                  <p className="text-muted-foreground text-sm">
                    If you have an active account, you can request data deletion through our 
                    support system or by contacting us via WhatsApp.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h3 className="font-semibold text-foreground mb-3">Option 3: Third-Party Integration</h3>
                  <p className="text-muted-foreground text-sm">
                    If you signed up through a third party (e.g., WhatsApp), you may need to 
                    request deletion through that platform or contact us directly.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <Clock className="h-5 w-5 text-primary" />
                Processing Time
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We will process your data deletion request within <strong>30 days</strong> of receiving 
                your verified request. In some cases, complete deletion may take longer due to 
                technical constraints or legal obligations (e.g., retaining transaction records 
                for regulatory compliance).
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                You will receive a confirmation email once your data has been deleted.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Exceptions to Deletion
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We may retain certain data even after a deletion request when required for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Regulatory compliance (AML, financial record-keeping - typically 5-6 years)</li>
                <li>Legal proceedings or disputes</li>
                <li>Security and fraud prevention</li>
                <li>Completing incomplete transactions</li>
              </ul>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                In such cases, we will inform you of the specific data that cannot be deleted and 
                the reason for retention.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <Mail className="h-5 w-5 text-primary" />
                What Happens After Deletion
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Your account will be deactivated</li>
                <li>You will no longer have access to transaction history</li>
                <li>API keys will be revoked</li>
                <li>All personal data will be removed from our active systems</li>
                <li>You may need to create a new account to use our services again</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Related Policies
              </h2>
              <div className="flex flex-wrap gap-3">
                <a href="/privacy-policy" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary/30 text-sm text-foreground hover:bg-secondary transition-colors">
                  <FileText className="h-4 w-4" />
                  Privacy Policy
                </a>
                <a href="/terms-of-service" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary/30 text-sm text-foreground hover:bg-secondary transition-colors">
                  <FileText className="h-4 w-4" />
                  Terms of Service
                </a>
              </div>
            </section>

            <section className="space-y-4 border-t border-border pt-6">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <Mail className="h-5 w-5 text-primary" />
                Contact Us
              </h2>
              <p className="text-muted-foreground">For data deletion requests or questions:</p>
              <ul className="list-none text-muted-foreground space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">Email:</strong>{" "}
                  <a href="mailto:peys.xyz@gmail.com" className="text-primary hover:underline">peys.xyz@gmail.com</a>
                </li>
                <li>
                  <strong className="text-foreground">WhatsApp:</strong>{" "}
                  <span className="text-primary">Use our WhatsApp bot</span>
                </li>
              </ul>
            </section>

            <div className="mt-8 rounded-lg bg-red-500/5 border border-red-500/20 p-4">
              <p className="text-sm text-muted-foreground text-center">
                If you are unable to resolve your concern through us, you may also file a complaint 
                with the Nigeria Data Protection Commission (NDPC).
              </p>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}