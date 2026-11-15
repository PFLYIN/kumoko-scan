import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controllers/auth.controller';
import { UsuarioRegistradoPublisher } from './events/usuario-registrado.publisher';
import { AuthService } from './services/auth.service';

/** Autenticacao: cadastro, login (JWT + cookie httpOnly) e logout. */
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, UsuarioRegistradoPublisher],
})
export class AuthModule {}
