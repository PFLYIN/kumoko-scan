import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { useToast } from '../../../hooks/useToast.js';
import { TIPOS_OBRA, tipoTemCapitulos, tipoTemVolume } from '../../../utils/format.js';
import FormField from '../../../components/ui/FormField.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import CapaInput from './CapaInput.jsx';
import GenerosInput from '../../../components/admin/GenerosInput.jsx';
import ObraCover from '../../../components/obras/ObraCover.jsx';
import TipoBadge from '../../../components/obras/TipoBadge.jsx';
import { catalogService } from '../../../services/catalog.service.js';
import { formatPreco } from '../../../utils/format.js';

const SUGESTOES_GENEROS = ['Ação', 'Aventura', 'Comédia', 'Drama', 'Fantasia', 'Isekai', 'Romance', 'Slice of life', 'Sobrenatural', 'Terror', 'Clássico', 'Ficção científica'];

function valoresIniciais(obra) {
  return {
    tipo: obra?.tipo ?? 'manga',
    nome: obra?.nome ?? '',
    autor: obra?.autor ?? '',
    descricao: obra?.descricao ?? '',
    volume: obra?.volume != null ? String(obra.volume) : '',
    preco: obra?.preco != null ? String(obra.preco) : '',
    avaliacao: obra?.avaliacao != null ? String(obra.avaliacao) : '5',
    generos: Array.isArray(obra?.generos) ? obra.generos : [],
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
function montarFormData(form, capa, editando, suportaGeneros) {
  const fd = new FormData();
  fd.append('tipo', form.tipo);
  fd.append('nome', form.nome.trim());
  fd.append('preco', String(Number(form.preco.replace(',', '.'))));
  if (form.avaliacao !== '') fd.append('avaliacao', String(Number(form.avaliacao)));
  // Na edicao os textos vao mesmo vazios, para permitir limpar o campo.
  if (form.autor.trim() || editando) fd.append('autor', form.autor.trim());
  if (form.descricao.trim() || editando) fd.append('descricao', form.descricao.trim());
  if (tipoTemVolume(form.tipo) && form.volume !== '') fd.append('volume', String(Number(form.volume)));
  // generos so e enviado quando o catalog-service expoe o campo (senao o whitelist recusaria).
  if (suportaGeneros && (form.generos.length || editando)) fd.append('generos', form.generos.join(','));
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
  const [tentou, setTentou] = useState(false);
  const [sugestoes, setSugestoes] = useState(SUGESTOES_GENEROS);
  const [suportaGeneros, setSuportaGeneros] = useState(Array.isArray(obra?.generos));
  const preview = useMemo(() => (capa ? URL.createObjectURL(capa) : null), [capa]);
  useEffect(() => (preview ? () => URL.revokeObjectURL(preview) : undefined), [preview]);

  // Detecta se a API ja tem o campo generos (contrato aditivo do catalog-service).
  useEffect(() => {
    let ativo = true;
    // Sugestoes = generos ja usados no acervo (mais frequentes primeiro) + lista base.
    catalogService
      .listGeneros()
      .then((lista) => ativo && setSugestoes((base) => [...new Set([...lista.map((g) => g.genero), ...base])]))
      .catch(() => {});
    if (Array.isArray(obra?.generos)) return () => {
      ativo = false;
    };
    catalogService
      .listObras({ limit: 1 })
      .then((r) => ativo && setSuportaGeneros(Array.isArray(r?.data?.[0]?.generos)))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [obra]);

  // Validacao em tempo real: por campo ao sair dele e, apos a 1a tentativa de envio, a cada tecla.
  const errosVisiveis = tentou ? validar(form) : erros;

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const blur = (campo) => () => {
    const atuais = validar(form);
    setErros((prev) => ({ ...prev, [campo]: atuais[campo] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = validar(form);
    setErros(novosErros);
    setTentou(true);
    if (Object.keys(novosErros).length) {
      toast.error('Revise os campos destacados.');
      return;
    }
    setEnviando(true);
    try {
      await onSalvar(montarFormData(form, capa, editando, suportaGeneros));
    } catch (err) {
      toast.error(err);
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="panel grid gap-6 p-6 md:grid-cols-[14rem_1fr] 2xl:grid-cols-[14rem_1fr_13rem]">
      <CapaInput capaAtual={obra?.capaMediaUrl ?? obra?.capaUrl ?? null} arquivo={capa} onChange={setCapa} nome={form.nome} />

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Tipo"
            error={errosVisiveis.tipo}
            hint={
              tipoTemCapitulos(form.tipo)
                ? 'Mangás e light novels têm volume e capítulos para leitura online.'
                : 'Livros não têm volume nem capítulos online (venda da edição completa).'
            }
          >
            <select className="field-input" value={form.tipo} onChange={set('tipo')}>
              {TIPOS_OBRA.map((t) => (
                <option key={t.value} value={t.value} className="bg-ink-800">
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>
          {tipoTemVolume(form.tipo) && (
            <FormField label="Volume" hint="Opcional." error={errosVisiveis.volume}>
              <input type="number" min="1" step="1" inputMode="numeric" className="field-input" value={form.volume} onChange={set('volume')} onBlur={blur('volume')} />
            </FormField>
          )}
        </div>

        <FormField label="Nome" error={errosVisiveis.nome}>
          <input className="field-input" value={form.nome} onChange={set('nome')} onBlur={blur('nome')} maxLength={200} required />
        </FormField>

        <FormField label="Autor" hint="Opcional." error={errosVisiveis.autor}>
          <input className="field-input" value={form.autor} onChange={set('autor')} onBlur={blur('autor')} maxLength={150} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Preço (R$)" error={errosVisiveis.preco}>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className="field-input"
              value={form.preco}
              onChange={set('preco')} onBlur={blur('preco')}
              required
            />
          </FormField>
          <FormField label="Avaliação (0 a 5)" error={errosVisiveis.avaliacao}>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              inputMode="decimal"
              className="field-input"
              value={form.avaliacao}
              onChange={set('avaliacao')} onBlur={blur('avaliacao')}
            />
          </FormField>
        </div>

        {suportaGeneros ? (
          <GenerosInput value={form.generos} onChange={(g) => setForm((f) => ({ ...f, generos: g }))} sugestoes={sugestoes} />
        ) : (
          <p className="text-xs text-zinc-500">
            Gêneros: disponível assim que o catálogo publicar o campo <code>generos</code>.
          </p>
        )}

        <FormField label="Descrição / sinopse" hint="Opcional." error={errosVisiveis.descricao}>
          <textarea rows={5} className="field-input resize-y" value={form.descricao} onChange={set('descricao')} />
        </FormField>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? <Spinner className="size-4" /> : <Save className="size-4" aria-hidden="true" />}
            {editando ? 'Salvar alterações' : 'Cadastrar obra'}
          </button>
        </div>
      </div>

      <aside className="hidden 2xl:block" aria-label="Pré-visualização do card">
        <p className="field-label mb-3">Como aparece no catálogo</p>
        <div className="flex flex-col gap-2">
          <ObraCover src={preview ?? obra?.capaMediaUrl ?? obra?.capaUrl ?? null} alt="" className="aspect-[2/3] w-full rounded-xl ring-1 ring-white/5" />
          <TipoBadge tipo={form.tipo} />
          <p className="line-clamp-2 text-sm font-medium text-zinc-100">{form.nome.trim() || 'Nome da obra'}</p>
          <p className="text-xs text-zinc-500">
            {form.autor.trim() || 'Autor desconhecido'}
            {tipoTemVolume(form.tipo) && form.volume ? ` · Vol. ${form.volume}` : ''}
          </p>
          {form.generos.length > 0 && <p className="text-[11px] text-zinc-400">{form.generos.join(' · ')}</p>}
          <p className="font-semibold text-brand-300">
            {form.preco !== '' && Number.isFinite(Number(form.preco.replace(',', '.')))
              ? formatPreco(Number(form.preco.replace(',', '.')))
              : 'R$ --'}
          </p>
        </div>
      </aside>
    </form>
  );
}
