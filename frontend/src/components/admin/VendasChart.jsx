import { useState } from 'react';
import { formatPreco } from '../../utils/format.js';

const W = 760;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 24, left: 56 };

const diaCurto = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

// Receita por dia (serie unica, barras com hover e tabela acessivel).
export default function VendasChart({ dados }) {
  const [ativo, setAtivo] = useState(null);
  const max = Math.max(1, ...dados.map((d) => d.receita));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const passo = plotW / Math.max(1, dados.length);
  const barra = Math.max(2, passo - 2);
  const ticks = [0, 0.5, 1].map((f) => f * max);
  const marcarCada = Math.ceil(dados.length / 8);
  const sel = ativo != null ? dados[ativo] : null;

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Receita por dia" onMouseLeave={() => setAtivo(null)}>
        {ticks.map((t) => {
          const y = PAD.top + plotH - (t / max) * plotH;
          return (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="currentColor" className="text-white/10" />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" className="fill-zinc-500 text-[10px]">
                {formatPreco(t).replace(/,\d+$/, '')}
              </text>
            </g>
          );
        })}
        {dados.map((d, i) => {
          const h = (d.receita / max) * plotH;
          const x = PAD.left + i * passo + 1;
          return (
            <g key={d.data} onMouseEnter={() => setAtivo(i)}>
              <rect x={PAD.left + i * passo} y={PAD.top} width={passo} height={plotH} fill="transparent" />
              {d.receita > 0 && (
                <rect
                  x={x}
                  y={PAD.top + plotH - h}
                  width={barra}
                  height={h}
                  rx={Math.min(4, barra / 2)}
                  className={ativo === i ? 'fill-brand-300' : 'fill-brand-500'}
                />
              )}
              {i % marcarCada === 0 && (
                <text x={x + barra / 2} y={H - 6} textAnchor="middle" className="fill-zinc-500 text-[10px]">
                  {diaCurto(d.data)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {sel && (
        <div
          role="tooltip"
          className="pointer-events-none absolute top-0 rounded-md border border-white/10 bg-ink-800 px-2 py-1 text-xs text-zinc-200 shadow-lg"
          style={{ left: `${((PAD.left + ativo * passo) / W) * 100}%` }}
        >
          <strong>{diaCurto(sel.data)}</strong> · {formatPreco(sel.receita)} · {sel.pedidos} pedido(s)
        </div>
      )}
      <table className="sr-only">
        <caption>Receita por dia</caption>
        <thead>
          <tr>
            <th>Dia</th>
            <th>Receita</th>
            <th>Pedidos</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d) => (
            <tr key={d.data}>
              <td>{d.data}</td>
              <td>{formatPreco(d.receita)}</td>
              <td>{d.pedidos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
