// backend/src/routes/applications.routes.ts
import { Router } from "express";
import { listApplications, applyToJob, acceptApplication, rejectApplication, submitDeliverable, approveSubmission } from "../controllers/applications.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware"; // if you use admin checks for certain actions

const router = Router();

// list apps (filter by worker/employer/jobId)
router.get("/", requireAuth, listApplications);

// update application status (accept/reject)
router.patch("/:appId", requireAuth, acceptApplication);

// approve submission for an application
router.patch("/:appId/approve-submission", requireAuth, approveSubmission);

// job application flow (if you want them here)
router.post("/:jobId/apply", requireAuth, applyToJob);
router.post("/:jobId/accept/:appId", requireAuth, acceptApplication); // employer
router.post("/:jobId/reject/:appId", requireAuth, rejectApplication); // employer
router.post("/:jobId/submit", requireAuth, submitDeliverable); // worker submits deliverable

export default router;
