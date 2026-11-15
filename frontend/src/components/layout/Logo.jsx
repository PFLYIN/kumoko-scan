import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="shrink-0 rounded-md" aria-label="Kumoko Scan - página inicial">
      <span className="text-lg font-light tracking-[0.2em] text-zinc-100 uppercase sm:text-xl">
        Kumoko<span className="ml-1 font-medium text-brand-400">Scan</span>
      </span>
    </Link>
  );
}
