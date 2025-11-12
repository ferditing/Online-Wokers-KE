// src/routes/skills.routes.ts
import { Router } from 'express';
import { listSkills, createSkill } from '../controllers/skills.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

router.get('/', listSkills);
router.post('/', requireAuth, requireAdmin, createSkill); // only admin can create new skills for now

export default router;
