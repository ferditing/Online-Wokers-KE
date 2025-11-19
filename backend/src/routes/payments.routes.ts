// backend/src/routes/payments.routes.ts
import { Router } from "express";

// Named imports (keep these as named exports in your controller files)
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
  b2cResultWebhook,
  b2cTimeoutWebhook,
  releaseEscrowFunds,
  queryStkStatus
} from "../controllers/mpesa.controller";

// middlewares
import { requireAuth } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";

const router = Router();

function assertExists(value: any, name: string) {
  if (typeof value === "undefined") {
    // eslint-disable-next-line no-console
    console.error(`[ROUTES ERROR] ${name} is undefined — check exports/imports for this symbol.`);
    throw new Error(`${name} is undefined`);
  }
}

/* ---------- sanity checks ---------- */
assertExists(getBalance, "getBalance (payments.controller)");
assertExists(createTopup, "createTopup (payments.controller)");
assertExists(confirmTopupWebhook, "confirmTopupWebhook (payments.controller)");
assertExists(requestPayout, "requestPayout (payments.controller)");
assertExists(listPayments, "listPayments (payments.controller)");
assertExists(adminPatchPayment, "adminPatchPayment (payments.controller)");

assertExists(payForJob, "payForJob (mpesa.controller)");
assertExists(verifyJob, "verifyJob (mpesa.controller)");
assertExists(mpesaCallback, "mpesaCallback (mpesa.controller)");
assertExists(releaseEscrowFunds, "releaseEscrowFunds (mpesa.controller)");
assertExists(queryStkStatus, "queryStkStatus (mpesa.controller)");
assertExists(b2cResultWebhook, "b2cResultWebhook (mpesa.controller)");
assertExists(b2cTimeoutWebhook, "b2cTimeoutWebhook (mpesa.controller)");

assertExists(requireAuth, "requireAuth (middleware)");
assertExists(requireAdmin, "requireAdmin (middleware)");

/* ---------- PUBLIC (M-Pesa webhooks) ---------- */
// Single callback endpoint handled by mpesaController
router.post("/mpesa/callback", mpesaCallback);
router.post("/mpesa/b2c-result", b2cResultWebhook);
router.post("/mpesa/b2c-timeout", b2cTimeoutWebhook);

/* ---------- AUTHENTICATED USER: M-Pesa actions ---------- */
router.post("/mpesa/pay-job", requireAuth, payForJob);
router.post("/mpesa/verify-job", requireAuth, verifyJob);
router.post("/mpesa/release-escrow/:escrowId", requireAuth, releaseEscrowFunds);
router.get("/mpesa/query-stk/:checkoutRequestId", requireAuth, queryStkStatus);

/* ---------- AUTHENTICATED USER: payments ---------- */
router.get("/balance", requireAuth, getBalance);
router.post("/topup", requireAuth, createTopup);

/* note:
   remove duplicate /mpesa/callback route that previously pointed to payments.controller.
   mpesaCallback should handle any STK callbacks and update payments accordingly.
*/
router.post("/request-payout", requireAuth, requestPayout);
router.get("/", requireAuth, listPayments);

/* ---------- ADMIN ---------- */
router.patch("/admin/:id", requireAuth, requireAdmin, adminPatchPayment);
router.patch("/admin/:id/release", requireAuth, requireAdmin, adminPatchPayment);

export default router;
