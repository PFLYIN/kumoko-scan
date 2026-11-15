import ObraCard from './ObraCard.jsx';

export const OBRA_GRID_CLASSES = 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

export default function ObraGrid({ obras }) {
  return (
    <ul className={OBRA_GRID_CLASSES}>
      {obras.map((obra) => (
        <li key={obra.id}>
          <ObraCard obra={obra} />
        </li>
      ))}
    </ul>
  );
}

