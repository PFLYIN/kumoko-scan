// Regras de validacao do cliente alinhadas a politica do auth-service.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailValid(email) {
  return EMAIL_REGEX.test(String(email).trim());
}

// Senha forte: minimo 8 caracteres, com pelo menos uma letra e um numero.
export function isStrongPassword(senha) {
  return typeof senha === 'string' && senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha);
}

export const PASSWORD_HINT = 'Mínimo de 8 caracteres, com pelo menos uma letra e um número.';

// Capa/pagina: mesmas restricoes do backend (jpg, png, webp ate 5 MB).
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file) {
  if (!file) return null;
  if (!IMAGE_TYPES.includes(file.type)) return 'Envie uma imagem JPG, PNG ou WEBP.';
  if (file.size > MAX_IMAGE_BYTES) return 'A imagem deve ter no máximo 5 MB.';
  return null;
}
