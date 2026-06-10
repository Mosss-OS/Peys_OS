import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Loader2, ArrowDown, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ConfirmPage() {
  const { txId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  const phone = searchParams.get('phone') || '';

  useEffect(() => {
    fetchTransaction();
  }, [txId]);

  const fetchTransaction = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', txId)
        .single();

      if (error) throw error;
      setTransaction(data);
    } catch (e) {
      setError('Transaction not found');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      // Update transaction status
      await supabase
        .from('transactions')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', txId);

      // Notify via WhatsApp bot that transaction is confirmed
      await fetch(`${import.meta.env.VITE_BOT_API_URL || 'http://localhost:3002'}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phone,
          message: `✅ Transaction confirmed!\n\nAmount: ${transaction.amount_usd} ${transaction.token}\n\nYour payment is being processed.`
        })
      });

      navigate('/success?type=confirmed');
    } catch (e) {
      setError('Failed to confirm transaction');
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async () => {
    try {
      await supabase
        .from('transactions')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', txId);

      await fetch(`${import.meta.env.VITE_BOT_API_URL || 'http://localhost:3002'}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phone,
          message: `❌ Transaction rejected.\n\nIf this was a mistake, please contact support.`
        })
      });

      navigate('/success?type=rejected');
    } catch (e) {
      setError('Failed to reject transaction');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C63FF]" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-lg">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500">{error || 'Something went wrong'}</p>
        </div>
      </div>
    );
  }

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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-5 pb-4 text-center border-b border-gray-100">
              <div className="h-14 w-14 rounded-full bg-[#6C63FF]/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💸</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Confirm Payment</h1>
              <p className="text-gray-500 text-sm mt-1">Review and confirm this transaction</p>
            </div>

            {/* Transaction Details */}
            <div className="p-5">
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {transaction.amount_usd} {transaction.token}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">From</span>
                    <span className="text-gray-900 font-medium truncate ml-4">
                      {transaction.sender_wallet?.slice(0, 8)}...{transaction.sender_wallet?.slice(-6)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">To</span>
                    <span className="text-gray-900 font-medium">You</span>
                  </div>
                </div>
              </div>

              {transaction.memo && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Note</p>
                  <p className="text-sm text-gray-700">{transaction.memo}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={confirming}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                  Reject
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6] hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {confirming ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Confirm
                    </>
                  )}
                </button>
              </div>

              {/* Security */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Shield className="h-3.5 w-3.5" />
                <span>Secured transaction</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
