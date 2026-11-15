export const MESSAGING_OPTIONS = Symbol('MESSAGING_OPTIONS');

export interface MessagingOptions {
  /** Nome do servico publicador (vai em `envelope.source`). */
  serviceName: string;
}
