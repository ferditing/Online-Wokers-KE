// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import jobsRoutes from './jobs.routes';
import paymentsRoutes from './payments.routes';
import verificationRoutes from './verification.routes';
import skillsRoutes from './skills.routes';
import profileRoutes from './profile.routes';
import adminRoutes from './admin.routes';

// ...

const router = Router();

router.use('/auth', authRoutes);
router.use('/jobs', jobsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/verification', verificationRoutes);
router.use('/skills', skillsRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);


export default router;
