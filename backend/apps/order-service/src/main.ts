import { runService } from '@kumoko/common';
import { ORDER_SERVICE_NAME } from './config/env.validation';
import { OrderServiceModule } from './order-service.module';

runService(OrderServiceModule, {
  serviceName: ORDER_SERVICE_NAME,
  docsPath: 'orders',
  docsTitle: 'Kumoko Scan - Order Service',
  docsDescription: 'Vendas: criacao de pedidos (preco sempre do catalogo) e historico de compras.',
});
