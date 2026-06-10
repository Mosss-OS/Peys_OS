import { motion } from "framer-motion";
import { Shield, FileText, Link2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
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
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-foreground">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Last Updated: March 28, 2026</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-8">
            <section>
              <p className="text-muted-foreground leading-relaxed">
                Peys OS ("we", "us", or "our") operates the Peys OS platform, including the website 
                (peydot.io or peys-eight.vercel.app), WhatsApp bot, magic claim links, developer SDKs, 
                and related services (collectively, the "Services").
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                This Privacy Policy explains how we collect, use, disclose, and protect your personal 
                data when you use our Services. We are committed to protecting your privacy in line 
                with the Nigeria Data Protection Act 2023 (NDPA), the Nigeria Data Protection Regulation 
                (NDPR), and other applicable laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                1. Information We Collect
              </h2>
              <p className="text-muted-foreground">We collect the following categories of personal data:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong className="text-foreground">Contact Information:</strong> Full name, email address, phone number, and WhatsApp number.</li>
                <li><strong className="text-foreground">Location Data:</strong> Country of residence (and sometimes IP-based location for fraud prevention).</li>
                <li><strong className="text-foreground">Usage & Transaction Data:</strong> Details of payments you send or receive (amount, token type, memo), transaction history, device information, and IP address.</li>
                <li><strong className="text-foreground">Technical Data:</strong> Wallet addresses (non-custodial), webhook events, and SDK usage logs.</li>
                <li><strong className="text-foreground">Communication Data:</strong> Messages sent via our WhatsApp bot or support channels.</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We do not collect sensitive data such as government ID, BVN, or bank details during 
                waitlist or basic signup. Full KYC is only collected when required for higher transaction 
                limits or regulatory compliance.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                2. How We Use Your Personal Data
              </h2>
              <p className="text-muted-foreground">We use your data for the following purposes:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>To provide and improve the Services (e.g., process magic link claims, route WhatsApp messages, deliver webhooks).</li>
                <li>To communicate with you (transaction confirmations, testnet invites, updates).</li>
                <li>To ensure security and prevent fraud (rate limiting, suspicious activity detection).</li>
                <li>To comply with legal and regulatory obligations (including AML, CBN, SEC, and NDPC requirements).</li>
                <li>To develop and improve our product (analytics on usage patterns).</li>
              </ul>
              
              <h3 className="font-semibold text-foreground mt-6">Lawful Basis for Processing (under NDPA/NDPR):</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong className="text-foreground">Contract performance:</strong> to provide the payment service</li>
                <li><strong className="text-foreground">Legitimate interest:</strong> security, product improvement</li>
                <li><strong className="text-foreground">Legal obligation:</strong> regulatory compliance</li>
                <li><strong className="text-foreground">Consent:</strong> where required, e.g., marketing communications</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                3. Sharing of Personal Data
              </h2>
              <p className="text-muted-foreground">We may share your data with:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Service providers (Supabase, Railway, Circle for USDC, Smile Identity or Sumsub for KYC when enabled).</li>
                <li>Regulators (SEC, CBN, NDPC) when legally required.</li>
                <li>Law enforcement or third parties where necessary to protect rights, safety, or comply with law.</li>
              </ul>
              <p className="text-muted-foreground mt-4 font-medium">
                We do not sell your personal data.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                4. Data Security
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement reasonable technical and organisational measures to protect your data, 
                including encryption in transit, secure webhook signature verification, access controls, 
                and regular security reviews. However, no system is completely secure.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                5. Your Data Rights (NDPA Rights)
              </h2>
              <p className="text-muted-foreground">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion (subject to legal obligations)</li>
                <li>Object to or restrict processing</li>
                <li>Withdraw consent (where processing is based on consent)</li>
                <li>Data portability (in some cases)</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, email <a href="mailto:peys.xyz@gmail.com" className="text-primary hover:underline">peys.xyz@gmail.com</a>. 
                We will respond within 30 days (or sooner where required).
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                6. Data Retention
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your data only as long as necessary for the purposes outlined or as required 
                by law (typically 5–6 years for transaction records due to AML obligations). 
                After that, we securely delete or anonymise it.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <Link2 className="h-5 w-5 text-primary" />
                7. International Transfers
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Some of our service providers are located outside Nigeria. We ensure appropriate 
                safeguards (e.g., standard contractual clauses or adequacy decisions) are in place 
                where required.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                8. Cookies and Tracking
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We use essential cookies for functionality. You can manage preferences via our 
                cookie banner. Analytics tools may be used to improve the service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                9. Children's Privacy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Services are not directed at children under 18. We do not knowingly collect 
                data from minors.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                10. Changes to This Policy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of 
                material changes via email or in-app notice.
              </p>
            </section>

            <section className="space-y-4 border-t border-border pt-6">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                11. Contact Us
              </h2>
              <p className="text-muted-foreground">For any privacy questions or to exercise your rights:</p>
              <ul className="list-none text-muted-foreground space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">Email:</strong>{" "}
                  <a href="mailto:peys.xyz@gmail.com" className="text-primary hover:underline">peys.xyz@gmail.com</a>
                </li>
                <li>
                  <strong className="text-foreground">Data Protection Officer:</strong> Available upon request
                </li>
              </ul>
            </section>

            <div className="mt-8 rounded-lg bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm text-muted-foreground text-center">
                By using Peys OS, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
