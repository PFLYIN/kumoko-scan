import React, { createContext, useState, useContext } from 'react';

type CartItem = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  capa_url: string;
  tipo_produto: string;
};

type CartContextData = {
  cart: CartItem[];
  addToCart: (produto: any) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, operacao: 'somar' | 'subtrair') => void;
  clearCart: () => void;
  getCartTotal: () => string;
};

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (produto: any) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === produto.id);
      if (exists) {
        return prev.map((item) =>
          item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      return [...prev, { 
        id: produto.id, 
        nome: produto.nome, 
        preco: parseFloat(produto.preco) || 0, 
        quantidade: 1, 
        capa_url: produto.capa_url, 
        tipo_produto: produto.tipo_produto || 'manga' 
      }];
    });
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter(item => item.id !== id));

  const updateQuantity = (id: string, operacao: 'somar' | 'subtrair') => {
    setCart((prev) => prev.map(item => {
      if (item.id === id) {
        const novaQtd = operacao === 'somar' ? item.quantidade + 1 : item.quantidade - 1;
        return { ...item, quantidade: Math.max(1, novaQtd) };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.preco * item.quantidade), 0).toFixed(2);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);