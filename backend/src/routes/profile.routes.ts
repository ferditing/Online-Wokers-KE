// src/routes/profile.routes.ts
import { Router } from 'express';
import { updateProfile, getProfile } from '../controllers/profile.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, getProfile);
router.patch('/', requireAuth, updateProfile);

export default router;
