import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      <Icon className="size-12 text-zinc-600" aria-hidden="true" />
      <h2 className="text-base font-semibold text-zinc-200">{title}</h2>
      {description && <p className="max-w-md text-sm text-zinc-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
