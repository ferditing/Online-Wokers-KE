import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.get('/me', requireAuth, authCtrl.me);

export default router;
