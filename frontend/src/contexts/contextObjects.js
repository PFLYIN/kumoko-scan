import { createContext } from 'react';

// Objetos de contexto ficam separados dos providers para manter o Fast Refresh do Vite.
export const AuthContext = createContext(null);
export const CartContext = createContext(null);
export const ToastContext = createContext(null);
