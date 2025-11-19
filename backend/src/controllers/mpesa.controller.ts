// backend/src/controllers/mpesa.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import Payment from "../models/Payment";
import Escrow from "../models/Escrow";
import Job from "../models/Job";
import User from "../models/User";
import WebhookLog from "../models/WebhookLog";
import * as mpesaService from "../services/mpesa.service";

/**
 * Helper to get string id variants
 */
const getStringId = (val: any) => (typeof val === "string" && val.trim()) ? val.trim() : null;

const parseCallbackMetadata = (metadata: any) => {
  const map: Record<string, any> = {};
  try {
    const items = metadata?.Item ?? metadata;
    if (Array.isArray(items)) {
      items.forEach((it: any) => {
        const name = it?.Name ?? it?.name;
        if (name) map[name] = it.Value ?? it.value ?? null;
      });
    }
  } catch (e) {
    // ignore
  }
  return map;
};

/* -------------------------- payForJob (STK Push) --------------------------- */
/** POST /api/payments/mpesa/pay-job */
export const payForJob = async (req: Request, res: Response) => {
  try {
    const { jobId, phoneNumber, amount } = req.body;
    const workerId = (req as any).userId;

    if (!jobId || !phoneNumber || !amount) return res.status(400).json({ message: "jobId, phoneNumber, amount required" });

    const job = await Job.findById(jobId).populate("employer");
    if (!job) return res.status(404).json({ message: "Job not found" });

    const worker = await User.findById(workerId);
    if (!worker) return res.status(403).json({ message: "Worker not found or unauthorized" });

    // create escrow
    const escrow = await Escrow.create({
      jobId,
      employerId: job.employer,
      amount,
      currency: "KES",
      platformFeePercent: 25,
      status: "pending"
    });

    // create payment record (pending)
    const payment = await Payment.create({
      userId: workerId,
      jobId,
      amount,
      currency: "KES",
      type: "escrow",
      status: "pending",
      meta: {
        escrowId: escrow._id,
        phoneNumber,
        provider: "mpesa"
      }
    });

    // initiate STK
    const stk: any = await mpesaService.initiateSTKPush(phoneNumber, amount, `Job-${jobId}`, `Payment for job: ${job.title}`);

    // save providerData with canonical and raw keys
    payment.providerData = {
      ...(payment.providerData || {}),
      checkoutRequestId: stk?.CheckoutRequestID ?? stk?.checkoutRequestId ?? null,
      MerchantRequestID: stk?.MerchantRequestID ?? stk?.merchantRequestId ?? null,
      raw: stk
    };

    payment.meta = { ...payment.meta, checkoutRequestId: payment.providerData.checkoutRequestId };
    await payment.save();

    return res.json({
      success: true,
      message: "M-Pesa payment initiated. Complete payment on phone.",
      payment,
      escrow,
      mpesa: { checkoutRequestId: payment.providerData.checkoutRequestId }
    });
  } catch (err: any) {
    console.error("payForJob error", err);
    return res.status(500).json({ message: "Failed to initiate job payment", error: err.message });
  }
};

/* -------------------------- verifyJob (Employer STK) ----------------------- */
/** POST /api/payments/mpesa/verify-job */
export const verifyJob = async (req: Request, res: Response) => {
  try {
    const { jobId, phoneNumber, amount } = req.body;
    const employerId = (req as any).userId;

    if (!jobId || !phoneNumber || !amount) return res.status(400).json({ message: "jobId, phoneNumber, amount required" });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // create payment record for verification
    const payment = await Payment.create({
      userId: employerId,
      jobId,
      amount,
      currency: "KES",
      type: "job_verification",
      status: "pending",
      meta: { phoneNumber, provider: "mpesa" }
    });

    const stk: any = await mpesaService.initiateSTKPush(phoneNumber, amount, `Job-Verification-${jobId}`, `Job verification for ${job.title}`);

    payment.providerData = {
      ...(payment.providerData || {}),
      checkoutRequestId: stk?.CheckoutRequestID ?? stk?.checkoutRequestId ?? null,
      MerchantRequestID: stk?.MerchantRequestID ?? null,
      raw: stk
    };
    payment.meta = { ...payment.meta, checkoutRequestId: payment.providerData.checkoutRequestId };
    await payment.save();

    return res.json({
      success: true,
      message: "Job verification STK initiated. Complete payment on phone.",
      payment,
      mpesa: { checkoutRequestId: payment.providerData.checkoutRequestId }
    });
  } catch (err: any) {
    console.error("verifyJob error", err);
    return res.status(500).json({ message: "Failed to initiate job verification", error: err.message });
  }
};

/* ------------------------------- mpesaCallback ---------------------------- */
/** POST /api/payments/mpesa/callback */
export const mpesaCallback = async (req: Request, res: Response) => {
  try {
    console.log("[mpesaCallback] payload:", JSON.stringify(req.body, null, 2));
    const body = req.body?.Body ?? req.body;
    const stk = body?.stkCallback ?? body;

    const checkoutRequestId = getStringId(
      (stk as any)?.CheckoutRequestID ??
      (stk as any)?.checkoutRequestID ??
      (stk as any)?.checkoutRequestId ??
      null
    );

    const merchantRequestId = getStringId(
      (stk as any)?.MerchantRequestID ??
      (stk as any)?.merchantRequestID ??
      (stk as any)?.merchantRequestId ??
      null
    );

    const callbackMeta = parseCallbackMetadata((stk as any)?.CallbackMetadata ?? (stk as any)?.callbackMetadata);

    // try to find payment by various fields (providerData or meta)
    const orClauses: any[] = [];
    if (checkoutRequestId) {
      orClauses.push(
        { "providerData.checkoutRequestId": checkoutRequestId },
        { "providerData.CheckoutRequestID": checkoutRequestId },
        { "providerData.checkoutRequestID": checkoutRequestId },
        { "meta.checkoutRequestId": checkoutRequestId },
        { "meta.CheckoutRequestID": checkoutRequestId },
        { "meta.checkoutRequestID": checkoutRequestId },
        { "providerData.raw.CheckoutRequestID": checkoutRequestId },
        { "providerData.raw.checkoutRequestId": checkoutRequestId }
      );
    }
    if (merchantRequestId) {
      orClauses.push(
        { "providerData.MerchantRequestID": merchantRequestId },
        { "providerData.merchantRequestId": merchantRequestId },
        { "meta.merchantRequestID": merchantRequestId },
        { "providerData.raw.MerchantRequestID": merchantRequestId }
      );
    }

    let payment = null;
    if (orClauses.length) payment = await Payment.findOne({ $or: orClauses }).exec();

    if (!payment) {
      console.warn("[mpesaCallback] payment not found, saving webhook for manual reconciliation", { checkoutRequestId, merchantRequestId });
      await WebhookLog.create({
        receivedAt: new Date(),
        source: "mpesa",
        event: "stkCallback",
        lookupKeys: { checkoutRequestId, merchantRequestId },
        payload: req.body
      });
      // respond 200 to stop retries
      return res.status(200).json({ message: "Payment not found" });
    }

    const resultCode = (stk as any)?.ResultCode ?? (stk as any)?.resultCode ?? null;
    const isPaid = Number(resultCode) === 0;

    payment.providerData = {
      ...(payment.providerData || {}),
      lastCallbackAt: new Date(),
      mpesaCallback: req.body,
      checkoutRequestId: checkoutRequestId ?? payment.providerData?.checkoutRequestId,
      MerchantRequestID: merchantRequestId ?? payment.providerData?.MerchantRequestID
    };

    payment.meta = {
      ...(payment.meta || {}),
      ...callbackMeta,
      checkoutRequestId: checkoutRequestId ?? payment.meta?.checkoutRequestId,
      merchantRequestId: merchantRequestId ?? payment.meta?.merchantRequestId
    };

    if (callbackMeta?.MpesaReceiptNumber) payment.meta.receipt = callbackMeta.MpesaReceiptNumber;
    if (callbackMeta?.PhoneNumber) payment.meta.phone = callbackMeta.PhoneNumber;
    if (callbackMeta?.Amount) payment.amount = Number(callbackMeta.Amount) || payment.amount;

    payment.status = isPaid ? "paid" : "failed";
    payment.updatedAt = new Date();
    await payment.save();

    console.log("[mpesaCallback] payment updated", { paymentId: payment._id?.toString(), status: payment.status });
    return res.status(200).json({ message: "Payment processed" });
  } catch (err: any) {
    console.error("[mpesaCallback] error", err);
    // still respond 200 to avoid sending retries while we log
    return res.status(200).json({ message: "error processed - check logs" });
  }
};

/* --------------------------- Query STK Status ------------------------------ */
/** GET /api/payments/mpesa/query-stk/:checkoutRequestId */
export const queryStkStatus = async (req: Request, res: Response) => {
  try {
    const { checkoutRequestId } = req.params;
    if (!checkoutRequestId) return res.status(400).json({ message: "checkoutRequestId required" });
    const result = await mpesaService.querySTKPush(checkoutRequestId);
    return res.json(result);
  } catch (err: any) {
    console.error("queryStkStatus error", err);
    return res.status(500).json({ message: "Failed to query STK status", error: err.message });
  }
};
