import { ToastProvider } from '../contexts/ToastContext.jsx';
import { AuthProvider } from '../contexts/AuthContext.jsx';
import { CartProvider } from '../contexts/CartContext.jsx';

// Ordem: toasts disponiveis para todos; auth antes do carrinho (checkout depende da sessao).
export default function AppProviders({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
