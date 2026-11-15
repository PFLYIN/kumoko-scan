import ObraCard from './ObraCard.jsx';

export const OBRA_GRID_CLASSES = 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8';

// visiveisAte2xl: em vitrines de uma linha, os itens excedentes so aparecem na grade de 8 colunas.
export default function ObraGrid({ obras, visiveisAte2xl }) {
  return (
    <ul className={OBRA_GRID_CLASSES}>
      {obras.map((obra, i) => (
        <li key={obra.id} className={visiveisAte2xl && i >= visiveisAte2xl ? 'hidden 2xl:block' : undefined}>
          <ObraCard obra={obra} />
        </li>
      ))}
    </ul>
  );
}

