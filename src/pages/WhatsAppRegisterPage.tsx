import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone, Mail, Shield, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { usePrivyAuth } from "@/contexts/PrivyContext";
import { useApp } from "@/contexts/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sanitizeWhatsAppNumber } from "@/utils/sanitize";

export default function WhatsAppRegisterPage() {
  const { login, loginWithEmailOnly, isLoggedIn, user, ready } = usePrivyAuth();
  const { walletAddress } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get WhatsApp number from URL params (passed from bot) - sanitize
  const rawWhatsappNumber = searchParams.get('wa') || '';
  const whatsappNumber = sanitizeWhatsAppNumber(rawWhatsappNumber);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      // Sync user to database and redirect
      syncUserToDatabase();
      navigate('/dashboard');
    }
  }, [isLoggedIn, user]);

  const syncUserToDatabase = async () => {
    if (!user) return;
    
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/peys-sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          privyId: user.id,
          email: user.email,
          phone: user.phone || whatsappNumber,
          walletAddress: user.walletAddress || walletAddress,
          whatsappNumber: whatsappNumber,
        }),
      });
    } catch (error) {
      console.error('Error syncing user:', error);
    }
  };

  const handlePhoneAuth = () => {
    setIsProcessing(true);
    login(); // Opens Privy modal with phone option
  };

  const handleEmailAuth = () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    setIsProcessing(true);
    loginWithEmailOnly(email);
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#25D366]" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#25D366] to-[#128C7E] flex flex-col">
      {/* Header */}
      <header className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-2xl">💎</span>
          </div>
          <span className="text-white font-semibold text-lg">Peys</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] p-6 text-white text-center">
            <h1 className="text-2xl font-bold mb-2">Create Your Peys Account</h1>
            <p className="text-white/80 text-sm">
              Send and receive USDC via WhatsApp
            </p>
          </div>

          {/* WhatsApp Number Display */}
          {whatsappNumber && (
            <div className="px-6 pt-6">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
                <div>
                  <p className="text-xs text-gray-500">WhatsApp Number</p>
                  <p className="font-semibold text-gray-800">{whatsappNumber}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-[#25D366] ml-auto" />
              </div>
            </div>
          )}

          {/* Auth Method Selector */}
          <div className="p-6">
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setAuthMethod('phone')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                  authMethod === 'phone'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Phone className="h-4 w-4" />
                Phone
              </button>
              <button
                onClick={() => setAuthMethod('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                  authMethod === 'email'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
            </div>

            {authMethod === 'phone' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none"
                  />
                </div>
                <button
                  onClick={handlePhoneAuth}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-lg font-semibold hover:bg-[#128C7E] transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Continue with Phone
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none"
                  />
                </div>
                <button
                  onClick={handleEmailAuth}
                  disabled={isProcessing || !email}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-lg font-semibold hover:bg-[#128C7E] transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Continue with Email
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-6 flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500">
                Your account is secured with Privy. We'll create an embedded wallet for you automatically.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t text-center">
            <p className="text-xs text-gray-500">
              By signing up, you agree to our{' '}
              <a href="/privacy" className="text-[#25D366] hover:underline">Privacy Policy</a>
            </p>
          </div>
        </motion.div>

        {/* Back to Bot Link */}
        <a
          href="https://wa.me/"
          className="mt-6 text-white/80 hover:text-white text-sm flex items-center gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Return to WhatsApp
        </a>
      </main>
    </div>
  );
}
