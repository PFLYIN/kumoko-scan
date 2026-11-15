import { useState } from 'react';
import { Save } from 'lucide-react';
import { useToast } from '../../../hooks/useToast.js';
import { TIPOS_OBRA, tipoTemVolume } from '../../../utils/format.js';
import FormField from '../../../components/ui/FormField.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import CapaInput from './CapaInput.jsx';

function valoresIniciais(obra) {
  return {
    tipo: obra?.tipo ?? 'manga',
    nome: obra?.nome ?? '',
    autor: obra?.autor ?? '',
    descricao: obra?.descricao ?? '',
    volume: obra?.volume != null ? String(obra.volume) : '',
    preco: obra?.preco != null ? String(obra.preco) : '',
    avaliacao: obra?.avaliacao != null ? String(obra.avaliacao) : '5',
  };
}

function validar(form) {
  const erros = {};
  if (!TIPOS_OBRA.some((t) => t.value === form.tipo)) erros.tipo = 'Selecione o tipo.';
  if (form.nome.trim().length < 1) erros.nome = 'Informe o nome da obra.';
  else if (form.nome.trim().length > 200) erros.nome = 'Máximo de 200 caracteres.';
  if (form.autor.trim().length > 150) erros.autor = 'Máximo de 150 caracteres.';

  const preco = Number(form.preco);
  if (form.preco === '' || !Number.isFinite(preco) || preco < 0) erros.preco = 'Informe um preço válido (ex.: 29.90).';
  else if (!/^\d+([.,]\d{1,2})?$/.test(form.preco.trim())) erros.preco = 'Use no máximo 2 casas decimais.';

  const avaliacao = Number(form.avaliacao);
  if (form.avaliacao !== '' && (!Number.isFinite(avaliacao) || avaliacao < 0 || avaliacao > 5)) {
    erros.avaliacao = 'A avaliação vai de 0 a 5.';
  }

  if (tipoTemVolume(form.tipo) && form.volume !== '') {
    const volume = Number(form.volume);
    if (!Number.isInteger(volume) || volume < 1) erros.volume = 'O volume deve ser um inteiro maior que zero.';
  }
  return erros;
}

// Monta o multipart esperado pelo catalog-service (POST/PATCH /api/obras).
function montarFormData(form, capa, editando) {
  const fd = new FormData();
  fd.append('tipo', form.tipo);
  fd.append('nome', form.nome.trim());
  fd.append('preco', String(Number(form.preco.replace(',', '.'))));
  if (form.avaliacao !== '') fd.append('avaliacao', String(Number(form.avaliacao)));
  // Na edicao os textos vao mesmo vazios, para permitir limpar o campo.
  if (form.autor.trim() || editando) fd.append('autor', form.autor.trim());
  if (form.descricao.trim() || editando) fd.append('descricao', form.descricao.trim());
  if (tipoTemVolume(form.tipo) && form.volume !== '') fd.append('volume', String(Number(form.volume)));
  if (capa) fd.append('capa', capa);
  return fd;
}

export default function ObraEditor({ obra, onSalvar }) {
  const toast = useToast();
  const editando = Boolean(obra);
  const [form, setForm] = useState(() => valoresIniciais(obra));
  const [capa, setCapa] = useState(null);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = validar(form);
    setErros(novosErros);
    if (Object.keys(novosErros).length) {
      toast.error('Revise os campos destacados.');
      return;
    }
    setEnviando(true);
    try {
      await onSalvar(montarFormData(form, capa, editando));
    } catch (err) {
      toast.error(err);
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="panel grid gap-6 p-6 md:grid-cols-[14rem_1fr]">
      <CapaInput capaAtual={obra?.capaMediaUrl ?? obra?.capaUrl ?? null} arquivo={capa} onChange={setCapa} nome={form.nome} />

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Tipo" error={erros.tipo}>
            <select className="field-input" value={form.tipo} onChange={set('tipo')}>
              {TIPOS_OBRA.map((t) => (
                <option key={t.value} value={t.value} className="bg-ink-800">
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>
          {tipoTemVolume(form.tipo) && (
            <FormField label="Volume" hint="Opcional." error={erros.volume}>
              <input type="number" min="1" step="1" inputMode="numeric" className="field-input" value={form.volume} onChange={set('volume')} />
            </FormField>
          )}
        </div>

        <FormField label="Nome" error={erros.nome}>
          <input className="field-input" value={form.nome} onChange={set('nome')} maxLength={200} required />
        </FormField>

        <FormField label="Autor" hint="Opcional." error={erros.autor}>
          <input className="field-input" value={form.autor} onChange={set('autor')} maxLength={150} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Preço (R$)" error={erros.preco}>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className="field-input"
              value={form.preco}
              onChange={set('preco')}
              required
            />
          </FormField>
          <FormField label="Avaliação (0 a 5)" error={erros.avaliacao}>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              inputMode="decimal"
              className="field-input"
              value={form.avaliacao}
              onChange={set('avaliacao')}
            />
          </FormField>
        </div>

        <FormField label="Descrição / sinopse" hint="Opcional." error={erros.descricao}>
          <textarea rows={5} className="field-input resize-y" value={form.descricao} onChange={set('descricao')} />
        </FormField>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? <Spinner className="size-4" /> : <Save className="size-4" aria-hidden="true" />}
            {editando ? 'Salvar alterações' : 'Cadastrar obra'}
          </button>
        </div>
      </div>
    </form>
  );
}
