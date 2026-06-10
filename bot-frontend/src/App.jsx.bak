import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivyProvider } from './components/PrivyProvider';
import RegisterPage from './pages/RegisterPage';
import ConfirmPage from './pages/ConfirmPage';
import SuccessPage from './pages/SuccessPage';

export default function App() {
  return (
    <PrivyProvider>
      <BrowserRouter>
        <Routes>
          {/* WhatsApp Registration */}
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Transaction Confirmation */}
          <Route path="/confirm/:txId" element={<ConfirmPage />} />
          
          {/* Success Page */}
          <Route path="/success" element={<SuccessPage />} />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="*" element={<Navigate to="/register" replace />} />
        </Routes>
      </BrowserRouter>
    </PrivyProvider>
  );
}
