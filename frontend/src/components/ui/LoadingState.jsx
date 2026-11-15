import Spinner from './Spinner.jsx';

export default function LoadingState({ message = 'Carregando...' }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400">
      <Spinner className="size-8 text-brand-400" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
