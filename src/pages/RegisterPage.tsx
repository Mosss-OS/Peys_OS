import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone, Mail, Shield, ArrowRight, Loader2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { sanitizeString, sanitizeWhatsAppNumber } from "@/utils/sanitize";

export default function RegisterPage() {
  const { login, authenticated, user, ready } = usePrivy();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [isLoading, setIsLoading] = useState(false);

  const rawWhatsappNumber = searchParams.get('wa') || '';
  const whatsappNumber = sanitizeWhatsAppNumber(rawWhatsappNumber);

  // Redirect if already authenticated
  useEffect(() => {
    if (authenticated && user) {
      syncUser();
    }
  }, [authenticated, user]);

  const syncUser = async () => {
    if (!user) return;
    try {
      await supabase.from('profiles').upsert({
        privy_id: user.id,
        email: user.email?.address,
        phone: user.phone?.number || (whatsappNumber ? `+${whatsappNumber}` : null),
        whatsapp_id: whatsappNumber,
        wallet_address: user.wallet?.address,
        updated_at: new Date().toISOString()
      });
      // Navigate to success or dashboard
      navigate('/dashboard');
    } catch (e) {
      console.error('Sync error:', e);
    }
  };

  const handleLogin = () => {
    setIsLoading(true);
    login();
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <Loader2 className="h-8 w-8 animate-spin text-[#6C63FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ 
      background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
      backgroundImage: `
        linear-gradient(90deg, rgba(108, 99, 255, 0.03) 1px, transparent 1px),
        linear-gradient(rgba(108, 99, 255, 0.03) 1px, transparent 1px)
      `,
      backgroundSize: '20px 20px'
    }}>
      {/* Header */}
      <header className="p-4 flex justify-center">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center shadow-lg">
            <span className="text-xl text-white">💎</span>
          </div>
          <span className="font-bold text-xl text-gray-800">Peys</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Header Section */}
            <div className="p-6 pb-4 text-center border-b border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Create Your Account
              </h1>
              <p className="text-gray-500 text-sm">
                Send and receive payments via WhatsApp
              </p>
            </div>

            {/* WhatsApp Number Badge */}
            {whatsappNumber && (
              <div className="px-6 pt-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <MessageCircle className="h-5 w-5 text-[#25D366]" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">WhatsApp Number</p>
                    <p className="font-semibold text-gray-800 text-sm">+{whatsappNumber}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Auth Section */}
            <div className="p-6">
              {/* Method Selector */}
              <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setAuthMethod('phone')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                    authMethod === 'phone'
                      ? 'bg-white text-gray-900 shadow-sm'
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
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </button>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)' }}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue with {authMethod === 'phone' ? 'Phone' : 'Email'}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Wallet Option */}
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="4" fill="#F0F0F0"/>
                  <path d="M7 10.5V9C7 7.34315 8.34315 6 10 6H14C15.6569 6 17 7.34315 17 9V15C17 16.6569 15.6569 18 14 18H10C8.34315 18 7 16.6569 7 15V13.5" stroke="#666" strokeWidth="1.5"/>
                  <circle cx="15" cy="12" r="1.5" fill="#666"/>
                </svg>
                Connect Wallet
              </button>

              {/* Security Notice */}
              <div className="mt-5 flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <Shield className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500">
                  Secured by Privy. Your wallet is created automatically.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t text-center">
              <p className="text-xs text-gray-400">
                By continuing, you agree to our{' '}
                <a href="/privacy" className="text-[#6C63FF] hover:underline">Privacy Policy</a>
              </p>
            </div>
          </div>

          {/* Back to Bot */}
          <div className="mt-4 text-center">
            <a
              href="https://wa.me/"
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Back to WhatsApp
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
