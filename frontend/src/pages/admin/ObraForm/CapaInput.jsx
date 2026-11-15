import { useEffect, useId, useMemo, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { IMAGE_ACCEPT, validateImageFile } from '../../../utils/validation.js';
import ObraCover from '../../../components/obras/ObraCover.jsx';

// Seletor de capa com pre-visualizacao local (object URL liberado ao trocar/desmontar).
export default function CapaInput({ capaAtual, arquivo, onChange, nome }) {
  const inputId = useId();
  const [erro, setErro] = useState(null);
  const preview = useMemo(() => (arquivo ? URL.createObjectURL(arquivo) : null), [arquivo]);

  useEffect(() => {
    if (!preview) return undefined;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const handleFile = (e) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    const problema = validateImageFile(file);
    setErro(problema);
    if (!problema) onChange(file);
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="field-label">Capa</span>
      <ObraCover
        src={preview ?? capaAtual}
        alt={nome ? `Pré-visualização da capa de ${nome}` : 'Pré-visualização da capa'}
        className="aspect-[2/3] w-full rounded-xl ring-1 ring-white/10"
      />
      <input
        id={inputId}
        type="file"
        accept={IMAGE_ACCEPT}
        onChange={handleFile}
        className="peer sr-only"
        aria-describedby={`${inputId}-hint`}
      />
      <label htmlFor={inputId} className="btn-secondary cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-brand-400">
        <ImagePlus className="size-4" aria-hidden="true" />
        {preview || capaAtual ? 'Trocar capa' : 'Escolher capa'}
      </label>
      {arquivo && (
        <button type="button" className="btn-secondary text-xs" onClick={() => onChange(null)}>
          <X className="size-3.5" aria-hidden="true" /> Descartar nova capa
        </button>
      )}
      <p id={`${inputId}-hint`} className={`text-xs ${erro ? 'text-red-400' : 'text-zinc-500'}`} role={erro ? 'alert' : undefined}>
        {erro ?? 'JPG, PNG ou WEBP, até 5 MB.'}
      </p>
    </div>
  );
}
