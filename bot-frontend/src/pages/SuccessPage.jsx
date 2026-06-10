import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, UserPlus } from 'lucide-react';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const type = searchParams.get('type') || 'registered';
  const whatsappNumber = searchParams.get('wa') || '';

  const content = {
    registered: {
      icon: <UserPlus className="h-12 w-12" />,
      title: 'Account Created!',
      message: 'Your Peys wallet is ready. You can now send and receive payments via WhatsApp.',
      color: '#6C63FF'
    },
    confirmed: {
      icon: <CheckCircle2 className="h-12 w-12" />,
      title: 'Payment Confirmed!',
      message: 'Your transaction has been confirmed and is being processed.',
      color: '#22c55e'
    },
    rejected: {
      icon: <XCircle className="h-12 w-12" />,
      title: 'Payment Rejected',
      message: 'The transaction has been rejected.',
      color: '#ef4444'
    }
  };

  const current = content[type] || content.registered;

  return (
    <div className="min-h-screen bg-[#f8f9fa] bg-grid flex flex-col">
      {/* Header */}
      <header className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center shadow-md">
            <span className="text-lg text-white">💎</span>
          </div>
          <span className="font-bold text-gray-800">Peys</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${current.color}15`, color: current.color }}
            >
              {current.icon}
            </motion.div>

            {/* Text */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-2"
            >
              {current.title}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-500 mb-6"
            >
              {current.message}
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              {type === 'registered' && (
                <a
                  href="https://peys.xyz/dashboard"
                  className="block w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6] hover:opacity-90 transition-all"
                >
                  Go to Dashboard
                </a>
              )}
              <a
                href="https://wa.me/"
                className="block w-full py-3 rounded-xl font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
              >
                {type === 'registered' ? 'Back to WhatsApp' : 'Close'}
              </a>
            </motion.div>
          </div>

          {/* Help */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Need help? Send "help" to the bot
          </p>
        </motion.div>
      </main>
    </div>
  );
}
