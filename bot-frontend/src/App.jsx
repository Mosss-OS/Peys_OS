import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivyProvider } from './components/PrivyProvider';
import ErrorBoundary from './components/ErrorBoundary';
import RegisterPage from './pages/RegisterPage';
import ConfirmPage from './pages/ConfirmPage';
import SuccessPage from './pages/SuccessPage';
import WhatsAppRegisterPage from './pages/whatsapp/WhatsAppRegisterPage';

const Fallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
    <div className="text-center p-8">
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center shadow-md mx-auto mb-4">
        <span className="text-2xl text-white">💎</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Peys</h1>
      <p className="text-gray-500">Loading...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary fallback={<Fallback />}>
      <PrivyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/register/whatsapp" element={<WhatsAppRegisterPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/confirm/:txId" element={<ConfirmPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="*" element={<Navigate to="/register" replace />} />
          </Routes>
        </BrowserRouter>
      </PrivyProvider>
    </ErrorBoundary>
  );
}