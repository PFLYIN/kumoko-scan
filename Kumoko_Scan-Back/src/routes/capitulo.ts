import { Router } from 'express';
import CapituloController from '../controllers/CapituloController';

const router = Router();

router.post('/', CapituloController.create);
router.put('/:id', CapituloController.update);
router.delete('/:id', CapituloController.delete);
router.get('/manga/:manga_id', CapituloController.listByManga);

export default router;