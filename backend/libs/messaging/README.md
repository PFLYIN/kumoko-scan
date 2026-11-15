# @kumoko/messaging

Eventos entre servicos via Redis Pub/Sub (entrega at-most-once).

| Arquivo | Conteudo |
|---|---|
| `messaging.module.ts` | `MessagingModule.forRoot({ serviceName })` (global; requer `RedisModule.forRoot()`). |
| `event-bus.ts` | `EventBus.publish<T>(type, payload)` -> envelope `{ id, type, source, occurredAt, correlationId, payload }` no canal `kumoko.events.<type>` (nunca lanca; falha e logada). `EventBus.subscribe<T>(type, handler)` para chamar no `onModuleInit` dos listeners; erro no handler e logado e nao derruba o subscriber. |
| `contracts/` | `EventTypes`, `EventType`, `channelForEvent()`, `EventEnvelope<T>`, `OrderCompletedPayload`, `ObraChangedPayload`, `UserRegisteredPayload`, `EventPayloadMap`. |

Exemplo de listener:

```ts
@Injectable()
export class PedidoConcluidoListener implements OnModuleInit {
  constructor(private readonly eventBus: EventBus) {}

  onModuleInit(): void {
    this.eventBus.subscribe<OrderCompletedPayload>(EventTypes.OrderCompleted, (payload, envelope) =>
      this.handle(payload, envelope.id),
    );
  }
}
```
