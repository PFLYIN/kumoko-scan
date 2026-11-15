// Aceita apenas caminhos internos para evitar open redirect via ?redirect=.
export function safeRedirect(value, fallback = '/') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback;
  }
  return value;
}
