import { motion } from "framer-motion";
import { FileText, Scale, AlertTriangle, CreditCard, Shield, Globe } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";

export default function TermsOfServicePage() {
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
              <Scale className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-foreground">Terms of Service</h1>
              <p className="text-sm text-muted-foreground">Last Updated: March 28, 2026</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-8">
            <section>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to Peys OS (operated by Peys OS). These Terms of Service ("Terms") 
                govern your access to and use of the Peys OS platform, including our website, 
                WhatsApp bot, payment links, API, SDKs, and related services (collectively, the "Services").
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                By accessing or using our Services, you agree to be bound by these Terms. 
                If you disagree with any part of these Terms, you may not access the Services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                1. Eligibility
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                You must be at least 18 years old and have the legal capacity to enter into 
                binding contracts. By using our Services, you represent and warrant that you 
                meet these eligibility requirements.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <CreditCard className="h-5 w-5 text-primary" />
                2. Description of Services
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Peys OS provides a cryptocurrency payment infrastructure that enables users to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Send and receive stablecoin payments (USDC, etc.)</li>
                <li>Create payment links and QR codes</li>
                <li>Process batch payments and streaming payments</li>
                <li>Integrate via APIs and SDKs</li>
                <li>Use our WhatsApp bot for transactions</li>
                <li>Access developer tools and webhooks</li>
              </ul>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any part of the 
                Services at any time with reasonable notice.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                3. User Accounts and Responsibilities
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Maintaining the security of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Ensuring your use of the Services complies with applicable laws</li>
                <li>Providing accurate and complete information</li>
                <li>Promptly updating any changes to your information</li>
              </ul>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                You must notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <AlertTriangle className="h-5 w-5 text-primary" />
                4. Prohibited Activities
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                You may NOT use our Services for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Illegal activities or transactions</li>
                <li>Money laundering, terrorist financing, or fraud</li>
                <li>Violating sanctions (OFAC, UN, etc.)</li>
                <li>Human trafficking, child exploitation, or illegal content</li>
                <li>Purchase of illegal goods or services</li>
                <li>Attempting to compromise, hack, or disrupt our systems</li>
                <li>Using the Services for any unlawful purpose</li>
              </ul>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                We reserve the right to suspend or terminate accounts that violate these 
                prohibitions, and may report violations to law enforcement.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <CreditCard className="h-5 w-5 text-primary" />
                5. Payments and Transactions
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                All cryptocurrency transactions are final and irreversible. We are not 
                responsible for errors in transaction addresses or amounts. Network fees 
                (gas fees) are non-refundable.
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                You acknowledge that cryptocurrency values may fluctuate, and we are not 
                liable for any losses resulting from price changes.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                6. Fees and Pricing
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our fee structure is available on our website and in our documentation. 
                Fees may change from time to time with reasonable notice. By using the 
                Services, you agree to pay all applicable fees.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <Globe className="h-5 w-5 text-primary" />
                7. Intellectual Property
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                All content, features, and functionality of our Services are owned by 
                Peys OS and are protected by copyright, trademark, and other intellectual 
                property laws. You may not copy, modify, or distribute our proprietary 
                materials without prior written consent.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <AlertTriangle className="h-5 w-5 text-primary" />
                8. Disclaimer of Warranties
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES 
                OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICES WILL 
                BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                You use the Services at your own risk. Cryptocurrency and blockchain 
                technologies involve inherent risks.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                9. Limitation of Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, PEYDOT SHALL NOT BE LIABLE FOR 
                ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, 
                INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL.
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Our total liability shall not exceed the amount you paid us in the 12 
                months preceding the claim.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <Globe className="h-5 w-5 text-primary" />
                10. Indemnification
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify, defend, and hold harmless Peys OS and its officers, 
                directors, employees, and agents from any claims, damages, losses, or expenses 
                arising out of your use of the Services or violation of these Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <Globe className="h-5 w-5 text-primary" />
                11. Governing Law and Dispute Resolution
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by the laws of Nigeria. Any disputes arising 
                from these Terms shall be resolved through binding arbitration in Nigeria 
                in accordance with the Arbitration and Conciliation Act.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                12. Changes to Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these Terms from time to time. We will notify you of material 
                changes via email or through the Services. Your continued use after such 
                changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="space-y-4 border-t border-border pt-6">
              <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                13. Contact Us
              </h2>
              <p className="text-muted-foreground">For questions about these Terms:</p>
              <ul className="list-none text-muted-foreground space-y-2 mt-4">
                <li>
                  <strong className="text-foreground">Email:</strong>{" "}
                  <a href="mailto:peys.xyz@gmail.com" className="text-primary hover:underline">peys.xyz@gmail.com</a>
                </li>
              </ul>
            </section>

            <div className="mt-8 rounded-lg bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm text-muted-foreground text-center">
                By using Peys OS, you acknowledge that you have read and agreed to these Terms of Service.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}