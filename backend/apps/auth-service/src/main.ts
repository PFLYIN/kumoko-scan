import { runService } from '@kumoko/common';
import { AuthServiceModule } from './auth-service.module';
import { AUTH_SERVICE_NAME } from './config/env.validation';

runService(AuthServiceModule, {
  serviceName: AUTH_SERVICE_NAME,
  docsPath: 'auth',
  docsTitle: 'Kumoko Scan - Auth Service',
  docsDescription: 'Identidade e acesso: cadastro, login (JWT em cookie httpOnly) e perfil do usuario.',
});
