import { Module } from '@nestjs/common';
import { UsersModule } from '../modules/users/users.module';
import { AdminSeeder } from './admin.seeder';

/** Dados iniciais do auth-service (administrador a partir de ADMIN_*). */
@Module({
  imports: [UsersModule],
  providers: [AdminSeeder],
})
export class SeedModule {}
