import { Router } from "express";
import { getUserPublic, updateUser } from "../controllers/users.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/:id", getUserPublic);
router.patch("/:id", requireAuth, updateUser);

export default router;
