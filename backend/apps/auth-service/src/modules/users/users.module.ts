import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './controllers/users.controller';
import { EventoProcessado } from './entities/evento-processado.entity';
import { User } from './entities/user.entity';
import { PedidoConcluidoListener } from './events/pedido-concluido.listener';
import { UsersService } from './services/users.service';

/** Usuarios: perfil (/api/users/me) e consumo de order.completed (total gasto). */
@Module({
  imports: [TypeOrmModule.forFeature([User, EventoProcessado])],
  controllers: [UsersController],
  providers: [UsersService, PedidoConcluidoListener],
  exports: [UsersService],
})
export class UsersModule {}
