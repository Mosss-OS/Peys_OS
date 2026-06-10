import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePrivy } from '../components/PrivyProvider';
import { motion } from 'framer-motion';
import { Phone, Mail, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function RegisterPage() {
  const { login, authenticated, user, ready } = usePrivy();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [method, setMethod] = useState('phone');

  const whatsappNumber = searchParams.get('wa') || '';

  useEffect(() => {
    if (authenticated && user) {
      syncUserAndRedirect();
    }
  }, [authenticated, user]);

  const syncUserAndRedirect = async () => {
    if (!user) return;
    
    try {
      // Sync user to Supabase (same table as main app)
      await supabase.from('profiles').upsert({
        privy_id: user.id,
        email: user.email?.address || null,
        phone: user.phone?.number || (whatsappNumber ? `+${whatsappNumber}` : null),
        whatsapp_id: whatsappNumber,
        wallet_address: user.wallet?.address || null,
        updated_at: new Date().toISOString()
      });

      // Notify WhatsApp bot about registration
      try {
        const botUrl = import.meta.env.VITE_WHATSAPP_BOT_URL || 'https://peydot-whatsapp-bot.railway.app';
        await fetch(`${botUrl}/webhook/registration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            whatsapp_id: whatsappNumber,
            wallet_address: user.wallet?.address,
            email: user.email?.address,
            phone: user.phone?.number
          })
        });
      } catch (webhookError) {
        console.error('Webhook notification failed:', webhookError);
        // Don't fail registration if webhook fails
      }

      // Redirect to success
      navigate('/success?registered=true');
    } catch (e) {
      console.error('Sync error:', e);
      navigate('/success?registered=true');
    }
  };

  const handleLogin = () => {
    setIsLoading(true);
    login();
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C63FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] bg-grid flex flex-col">
      {/* Simple Header */}
      <header className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center shadow-md">
            <span className="text-lg text-white">💎</span>
          </div>
          <span className="font-bold text-gray-800">Peys</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Title */}
            <div className="p-5 pb-4 text-center border-b border-gray-100">
              <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
              <p className="text-gray-500 text-sm mt-1">Send payments via WhatsApp</p>
            </div>

            {/* WhatsApp Number */}
            {whatsappNumber && (
              <div className="px-5 pt-4">
                <div className="flex items-center gap-3 p-3 bg-[#6C63FF]/5 rounded-lg border border-[#6C63FF]/10">
                  <div className="h-8 w-8 rounded-full bg-[#6C63FF]/10 flex items-center justify-center">
                    <span className="text-sm">📱</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Your WhatsApp</p>
                    <p className="font-semibold text-gray-800 text-sm">+{whatsappNumber}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Auth Section */}
            <div className="p-5">
              {/* Method Toggle */}
              <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setMethod('phone')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
                    method === 'phone' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </button>
                <button
                  onClick={() => setMethod('email')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
                    method === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </button>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6] hover:opacity-90"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue with {method === 'phone' ? 'Phone' : 'Email'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Security */}
              <div className="mt-4 flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <Shield className="h-4 w-4 text-gray-400 mt-0.5" />
                <p className="text-xs text-gray-500">
                  Secured by Privy. Your wallet is created automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-4">
            By continuing, you agree to our Privacy Policy
          </p>
        </motion.div>
      </main>
    </div>
  );
}
