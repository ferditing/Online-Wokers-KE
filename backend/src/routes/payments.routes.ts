// backend/src/routes/payments.routes.ts
import { Router } from "express";

// Named imports
import {
  getBalance,
  createTopup,
  confirmTopupWebhook,
  requestPayout,
  listPayments,
  adminPatchPayment
} from "../controllers/payments.controller";

import {
  payForJob,
  verifyJob,
  mpesaCallback,
  queryStkStatus
} from "../controllers/mpesa.controller";

// middlewares
import { requireAuth } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";

const router = Router();

/* ---------- sanity checks ---------- */
function assertExists(value: any, name: string) {
  if (typeof value === "undefined") {
    console.error(`[ROUTES ERROR] ${name} is undefined — check exports/imports.`);
    throw new Error(`${name} is undefined`);
  }
}

assertExists(getBalance, "getBalance");
assertExists(createTopup, "createTopup");
assertExists(confirmTopupWebhook, "confirmTopupWebhook");
assertExists(requestPayout, "requestPayout");
assertExists(listPayments, "listPayments");
assertExists(adminPatchPayment, "adminPatchPayment");

assertExists(payForJob, "payForJob");
assertExists(verifyJob, "verifyJob");
assertExists(mpesaCallback, "mpesaCallback");
assertExists(queryStkStatus, "queryStkStatus");

assertExists(requireAuth, "requireAuth");
assertExists(requireAdmin, "requireAdmin");

/* ---------- PUBLIC (M-Pesa STK Callback) ---------- */
router.post("/mpesa/callback", mpesaCallback);

/* ---------- AUTHENTICATED USER: M-Pesa actions ---------- */
router.post("/mpesa/pay-job", requireAuth, payForJob);
router.post("/mpesa/verify-job", requireAuth, verifyJob);
router.get("/mpesa/query-stk/:checkoutRequestId", requireAuth, queryStkStatus);

/* ---------- AUTHENTICATED USER: payments ---------- */
router.get("/balance", requireAuth, getBalance);
router.post("/topup", requireAuth, createTopup);

// No duplicate callback route anymore
router.post("/request-payout", requireAuth, requestPayout);
router.get("/", requireAuth, listPayments);

/* ---------- ADMIN ---------- */
router.patch("/admin/:id", requireAuth, requireAdmin, adminPatchPayment);

export default router;
