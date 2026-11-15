import { useState } from 'react';
import { useToast } from '../../../hooks/useToast.js';
import FormField from '../../../components/ui/FormField.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';

// Numero aceita fracao com ate 2 casas (ex.: 10.5), como o DECIMAL(6,2) do backend.
function validar({ numero, titulo }) {
  const erros = {};
  const n = Number(String(numero).replace(',', '.'));
  if (numero === '' || !Number.isFinite(n) || n <= 0 || n >= 10000) erros.numero = 'Informe um número entre 0 e 9999.';
  else if (!/^\d+([.,]\d{1,2})?$/.test(String(numero).trim())) erros.numero = 'Use no máximo 2 casas decimais.';
  if (titulo.trim().length > 200) erros.titulo = 'Máximo de 200 caracteres.';
  return erros;
}

// Usado para criar e para editar capitulos (onSubmit deve lancar o ApiError em caso de falha).
export default function CapituloForm({ numeroInicial = '', tituloInicial = '', submitLabel, onSubmit, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState({ numero: String(numeroInicial), titulo: tituloInicial ?? '' });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = validar(form);
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    setEnviando(true);
    try {
      const titulo = form.titulo.trim();
      await onSubmit({ numero: Number(form.numero.replace(',', '.')), ...(titulo ? { titulo } : { titulo: null }) });
    } catch (err) {
      toast.error(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-3 sm:grid-cols-[8rem_1fr_auto] sm:items-start">
      <FormField label="Número" error={erros.numero}>
        <input
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          className="field-input"
          value={form.numero}
          onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
          required
        />
      </FormField>
      <FormField label="Título (opcional)" error={erros.titulo}>
        <input
          className="field-input"
          value={form.titulo}
          maxLength={200}
          onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
        />
      </FormField>
      <div className="flex gap-2 sm:pt-6">
        <button type="submit" className="btn-primary whitespace-nowrap" disabled={enviando}>
          {enviando && <Spinner className="size-4" />}
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={enviando}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
