import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  ChevronRight,
  MessageSquare,
  Mail,
  Phone,
  Book,
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageCircleQuestion,
  AlertCircle,
  CheckCircle2,
  LifeBuoy,
  Globe,
  Clock,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  views: number;
}

const mockFAQs: FAQItem[] = [
  {
    id: "1",
    question: "How do I send money to another user?",
    answer:
      "To send money, click the 'Send' button on the home screen, enter the recipient's wallet address or search for their username, enter the amount, and confirm the transaction. Make sure to double-check the recipient address before confirming.",
    category: "Payments",
    helpful: 245,
  },
  {
    id: "2",
    question: "What is the minimum amount I can send?",
    answer:
      "The minimum amount for a standard transfer is $1.00 (or equivalent in crypto). For smaller amounts, you can use our micro-payment feature which allows transfers down to $0.01.",
    category: "Payments",
    helpful: 189,
  },
  {
    id: "3",
    question: "How long do transactions take?",
    answer:
      "Transaction times vary by network. Base transactions typically confirm in 2-5 seconds. Network congestion can affect these times.",
    category: "Payments",
    helpful: 312,
  },
  {
    id: "4",
    question: "Is my wallet backed up? How do I recover it?",
    answer:
      "Your wallet is secured by your recovery phrase. Go to Settings > Security > Backup Recovery Phrase to view and securely store your 12 or 24-word recovery phrase. Never share this phrase with anyone.",
    category: "Security",
    helpful: 456,
  },
  {
    id: "5",
    question: "How do I enable two-factor authentication?",
    answer:
      "Go to Settings > Security > Two-Factor Authentication. You can enable 2FA using an authenticator app (recommended) or SMS verification. We strongly recommend using an authenticator app for better security.",
    category: "Security",
    helpful: 234,
  },
  {
    id: "6",
    question: "What networks does Peys support?",
    answer:
      "Peys currently supports Base Sepolia (testnet). We are working on adding more chains in the future.",
    category: "General",
    helpful: 178,
  },
  {
    id: "7",
    question: "How do I add funds to my wallet?",
    answer:
      "You can add funds by: 1) Receiving crypto from another wallet, 2) Using the 'Buy' feature with a credit/debit card, 3) Receiving payments from other users, or 4) Converting existing crypto from another chain.",
    category: "Wallet",
    helpful: 298,
  },
  {
    id: "8",
    question: "What are the transaction fees?",
    answer:
      "Transaction fees on Base typically cost $0.01-0.10 per transaction. Peys does not charge additional fees beyond network gas costs.",
    category: "Payments",
    helpful: 367,
  },
];

const mockArticles: HelpArticle[] = [
  {
    id: "1",
    title: "Getting Started with Peys",
    description: "Learn the basics of setting up and using your Peys wallet",
    category: "Getting Started",
    readTime: "5 min",
    views: 15420,
  },
  {
    id: "2",
    title: "Understanding Gas Fees",
    description: "A comprehensive guide to blockchain gas fees and optimization",
    category: "Payments",
    readTime: "8 min",
    views: 8934,
  },
  {
    id: "3",
    title: "Security Best Practices",
    description: "Protect your funds with these essential security measures",
    category: "Security",
    readTime: "10 min",
    views: 12340,
  },
  {
    id: "4",
    title: "Setting Up 2FA",
    description: "Secure your account with two-factor authentication",
    category: "Security",
    readTime: "3 min",
    views: 7650,
  },
  {
    id: "5",
    title: "Managing Multiple Wallets",
    description: "How to create and manage multiple wallet addresses",
    category: "Wallet",
    readTime: "6 min",
    views: 4321,
  },
];

const categories = ["All", "Payments", "Security", "Wallet", "General"];

export default function HelpFAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredFAQs = mockFAQs.filter(
    (faq) =>
      (selectedCategory === "All" || faq.category === selectedCategory) &&
      (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleFAQHelpful = (id: string) => {
    toast.success("Thanks for your feedback!");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container px-4 py-6 pb-24 mx-auto max-w-2xl">
        <div className="space-y-6">
          <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            maxLength={200}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        <Tabs defaultValue="faq" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-3">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => (
                <Card key={faq.id}>
                  <button
                    className="w-full text-left"
                    onClick={() =>
                      setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)
                    }
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <CardTitle className="text-base">{faq.question}</CardTitle>
                            <CardDescription>{faq.category}</CardDescription>
                          </div>
                        </div>
                        {expandedFAQ === faq.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </button>
                  {expandedFAQ === faq.id && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-4 pl-8">
                        {faq.answer}
                      </p>
                      <div className="flex items-center justify-between pl-8">
                        <span className="text-xs text-muted-foreground">
                          {faq.helpful} people found this helpful
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFAQHelpful(faq.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Helpful
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No results found for "{searchQuery}"
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try different keywords or browse categories
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="articles" className="space-y-3">
            {mockArticles.map((article) => (
              <Card key={article.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <CardTitle className="text-base">{article.title}</CardTitle>
                        <CardDescription>{article.description}</CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pl-8">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <Badge variant="outline">{article.category}</Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readTime}
                    </span>
                    <span>{article.views.toLocaleString()} views</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" className="w-full">
              <Book className="h-4 w-4 mr-2" />
              Browse All Articles
            </Button>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Support</CardTitle>
                <CardDescription>
                  Our support team is available 24/7
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="h-4 w-4 mr-3" />
                  Live Chat
                  <Badge variant="outline" className="ml-auto text-green-500 border-green-500">
                    Online
                  </Badge>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-3" />
                  Email Support
                  <span className="ml-auto text-xs text-muted-foreground">
                    Response in ~2 hours
                  </span>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-3" />
                  Phone Support
                  <span className="ml-auto text-xs text-muted-foreground">
                    Premium only
                  </span>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <MessageCircleQuestion className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium">Community Help</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get help from our community of experts and Peys users. Join our
                      Discord or Telegram for real-time assistance.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm">
                        <Globe className="h-4 w-4 mr-1" />
                        Discord
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Telegram
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submit a Ticket</CardTitle>
                <CardDescription>
                  Describe your issue and we'll get back to you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Subject" maxLength={200} />
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[120px]"
                  placeholder="Describe your issue..."
                  maxLength={2000}
                />
                <Button className="w-full">
                  <LifeBuoy className="h-4 w-4 mr-2" />
                  Submit Ticket
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
