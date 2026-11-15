import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUsuariosController } from './controllers/admin-usuarios.controller';
import { UsersController } from './controllers/users.controller';
import { EventoProcessado } from './entities/evento-processado.entity';
import { User } from './entities/user.entity';
import { PedidoConcluidoListener } from './events/pedido-concluido.listener';
import { AdminUsuariosService } from './services/admin-usuarios.service';
import { UsersService } from './services/users.service';

/** Usuarios: perfil (/api/users/me) e consumo de order.completed (total gasto). */
@Module({
  imports: [TypeOrmModule.forFeature([User, EventoProcessado])],
  controllers: [UsersController, AdminUsuariosController],
  providers: [UsersService, AdminUsuariosService, PedidoConcluidoListener],
  exports: [UsersService],
})
export class UsersModule {}
