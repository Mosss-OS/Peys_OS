import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Globe,
  Languages,
  CheckCircle2,
  ChevronRight,
  Search,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  popular?: boolean;
}

const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", popular: true },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", popular: true },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", popular: true },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", popular: true },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", popular: true },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", popular: true },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", popular: true },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "fil", name: "Filipino", nativeName: "Filipino", flag: "🇵🇭" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪" },
  { code: "ha", name: "Hausa", nativeName: "Hausa", flag: "🇳🇬" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá", flag: "🇳🇬" },
];

export default function MultiLanguagePage() {
  const [currentLang, setCurrentLang] = useState("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoDetect, setAutoDetect] = useState(true);

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popularLanguages = languages.filter((l) => l.popular);
  const otherLanguages = languages.filter((l) => !l.popular);

  const handleLanguageChange = (code: string) => {
    setCurrentLang(code);
    toast.success(`Language changed to ${languages.find((l) => l.code === code)?.name}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container px-4 py-6 pb-24 mx-auto max-w-2xl">
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Languages className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Language Settings</p>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred language
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Auto-detect language</p>
                <p className="text-xs text-muted-foreground">
                  Detect language from browser settings
                </p>
              </div>
            </div>
            <Switch checked={autoDetect} onCheckedChange={setAutoDetect} />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2"
            />
          </div>

          {searchQuery ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {filteredLanguages.length} result(s)
              </p>
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    currentLang === lang.code
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="text-left">
                      <p className="font-medium">{lang.name}</p>
                      <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
                    </div>
                  </div>
                  {currentLang === lang.code && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium px-1">Popular</p>
                {popularLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      currentLang === lang.code
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => handleLanguageChange(lang.code)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <div className="text-left">
                        <p className="font-medium">{lang.name}</p>
                        <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
                      </div>
                    </div>
                    {currentLang === lang.code && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium px-1">All Languages</p>
                {otherLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      currentLang === lang.code
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => handleLanguageChange(lang.code)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <div className="text-left">
                        <p className="font-medium">{lang.name}</p>
                        <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
                      </div>
                    </div>
                    {currentLang === lang.code && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Translation Help</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Help us improve translations! Contribute at our Crowdin project
                    or report translation errors.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Globe className="h-4 w-4 mr-1" />
                    Contribute Translations
                  </Button>
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
