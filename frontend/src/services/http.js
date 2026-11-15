import axios from 'axios';

// Evento global disparado quando a sessao (cookie httpOnly) deixa de ser valida.
export const UNAUTHORIZED_EVENT = 'kumoko:unauthorized';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

// Erro normalizado: sempre tem message (string) e status (0 = sem resposta do servidor).
export class ApiError extends Error {
  constructor({ message, status = 0, error = null, details = null, requestId = null }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.error = error;
    this.details = details;
    this.requestId = requestId;
  }
}

const FALLBACK_MESSAGES = {
  400: 'Dados inválidos. Revise os campos e tente novamente.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Recurso não encontrado.',
  409: 'Conflito: o registro já existe.',
  413: 'Arquivo muito grande.',
  422: 'Não foi possível processar a solicitação.',
  429: 'Muitas tentativas. Aguarde um momento e tente novamente.',
  502: 'Serviço temporariamente indisponível. Tente novamente em instantes.',
  503: 'Serviço temporariamente indisponível. Tente novamente em instantes.',
  504: 'O servidor demorou para responder. Tente novamente em instantes.',
};

function extractMessage(data) {
  if (!data || typeof data !== 'object') return null;
  const { message } = data;
  if (Array.isArray(message)) return message.filter(Boolean).join(' ');
  return typeof message === 'string' && message.trim() ? message : null;
}

export function toApiError(err) {
  if (err instanceof ApiError) return err;

  if (axios.isCancel(err)) {
    return new ApiError({ message: 'Requisição cancelada.', error: 'Canceled' });
  }

  const response = err?.response;
  if (!response) {
    const timeout = err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT';
    return new ApiError({
      message: timeout
        ? 'O servidor demorou para responder. Tente novamente.'
        : 'Não foi possível conectar ao servidor. Verifique sua conexão.',
      error: timeout ? 'Timeout' : 'NetworkError',
    });
  }

  const { status, data, headers } = response;
  // Em erros do proprio gateway a resposta pode ser HTML; nesse caso usamos mensagem padrao.
  const message =
    extractMessage(data) ??
    FALLBACK_MESSAGES[status] ??
    (status >= 500 ? 'Erro interno do servidor. Tente novamente mais tarde.' : 'Não foi possível concluir a solicitação.');

  return new ApiError({
    message,
    status,
    error: typeof data === 'object' ? (data?.error ?? null) : null,
    details: typeof data === 'object' ? data : null,
    requestId: (typeof data === 'object' && data?.requestId) || headers?.['x-request-id'] || null,
  });
}

// Rotas em que 401 e resposta esperada (login errado, visitante anonimo, senha atual incorreta).
const SILENT_401_URLS = ['/auth/login', '/users/me'];

http.interceptors.response.use(
  (response) => response,
  (err) => {
    const apiError = toApiError(err);
    const url = err?.config?.url ?? '';
    if (apiError.status === 401 && !SILENT_401_URLS.includes(url)) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(apiError);
  },
);
