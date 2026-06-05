import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Mail,
  Phone,
  HelpCircle,
  FileText,
  MessageCircleQuestion,
  LifeBuoy,
  Globe,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";



export default function HelpFAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container px-4 py-6 pb-24 mx-auto max-w-2xl">
        <div className="space-y-6">
          <Tabs defaultValue="faq" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="articles">Articles</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="faq">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <HelpCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    FAQs are being written. Check back soon for answers to common questions.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="articles">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Help articles are coming soon. We're building guides to help you get started.
                  </p>
                </CardContent>
              </Card>
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
