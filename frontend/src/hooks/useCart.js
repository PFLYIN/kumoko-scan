import { useContext } from 'react';
import { CartContext } from '../contexts/contextObjects.js';

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de <CartProvider>.');
  return ctx;
}
