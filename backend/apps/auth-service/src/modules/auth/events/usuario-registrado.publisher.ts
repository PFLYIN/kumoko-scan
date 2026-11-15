import { Injectable } from '@nestjs/common';
import { EventBus, EventTypes, type UserRegisteredPayload } from '@kumoko/messaging';
import type { User } from '../../users/entities/user.entity';

/** Publica `user.registered` apos um cadastro (o EventBus nunca lanca; falhas sao logadas). */
@Injectable()
export class UsuarioRegistradoPublisher {
  constructor(private readonly eventBus: EventBus) {}

  async publish(user: Pick<User, 'id' | 'email'>): Promise<void> {
    await this.eventBus.publish<UserRegisteredPayload>(EventTypes.UserRegistered, {
      usuarioId: user.id,
      email: user.email,
    });
  }
}
