// backend/src/routes/verification.routes.ts
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadVerification, listUserVerifications, getVerification } from '../controllers/verification.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Use disk storage to keep things simple
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// POST /api/verification/request
router.post('/request', requireAuth, upload.single('file'), uploadVerification);

// GET /api/verification  -> list verifications for current user
router.get('/', requireAuth, listUserVerifications);

// GET /api/verification/:id
router.get('/:id', requireAuth, getVerification);

export default router;
