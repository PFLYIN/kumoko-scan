import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap } from 'lucide-react';
import { useCart } from '../../hooks/useCart.js';
import { useToast } from '../../hooks/useToast.js';
import QuantityStepper from '../../components/ui/QuantityStepper.jsx';

export default function AdicionarAoCarrinho({ obra }) {
  const [quantidade, setQuantidade] = useState(1);
  const { addItem } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const adicionar = () => {
    const ok = addItem(obra, quantidade);
    if (!ok) toast.error('O carrinho aceita no máximo 20 obras diferentes.');
    return ok;
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <QuantityStepper value={quantidade} onChange={setQuantidade} />
      <button
        type="button"
        className="btn-secondary"
        onClick={() => adicionar() && toast.success(`"${obra.nome}" adicionado ao carrinho.`)}
      >
        <ShoppingCart className="size-4" aria-hidden="true" />
        Adicionar ao carrinho
      </button>
      <button type="button" className="btn-primary" onClick={() => adicionar() && navigate('/carrinho')}>
        <Zap className="size-4" aria-hidden="true" />
        Comprar agora
      </button>
    </div>
  );
}
