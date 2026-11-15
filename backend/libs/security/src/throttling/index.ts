export * from './throttling.constants';
// Reexporta os decorators do throttler para os servicos nao dependerem do pacote diretamente.
export { SkipThrottle, Throttle } from '@nestjs/throttler';
