// backend/src/controllers/payments.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import Payment from "../models/Payment";
import * as mpesaService from "../services/mpesa.service";
import WebhookLog from "../models/WebhookLog";

/** GET /api/payments/balance */
export const getBalance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const payments = await Payment.find({ userId });
    let balance = 0;
    for (const p of payments) {
      if (p.type === "topup" && p.status === "paid") balance += p.amount;
      if (p.type === "payout" && p.status === "paid") balance -= p.amount;
    }
    return res.json({ balance });
  } catch (err: any) {
    console.error("getBalance error", err);
    return res.status(500).json({ message: "Failed to get balance", error: err.message });
  }
};

/** POST /api/payments/topup */
export const createTopup = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { amount, phoneNumber } = req.body;
    if (!userId || !amount || !phoneNumber) return res.status(400).json({ message: "user, amount, phoneNumber required" });

    // Create payment record
    const payment = await Payment.create({
      userId,
      amount,
      currency: "KES",
      type: "topup",
      status: "pending",
      meta: { phoneNumber, provider: "mpesa" }
    });

    // initiate STK
    const stk = await mpesaService.initiateSTKPush(phoneNumber, amount, `TOPUP-${userId}`, "Wallet topup");

    // write providerData
    payment.providerData = {
      ...(payment.providerData || {}),
      CheckoutRequestID: stk?.CheckoutRequestID ?? stk?.checkoutRequestId ?? null,
      MerchantRequestID: stk?.MerchantRequestID ?? stk?.merchantRequestId ?? null,
      checkoutRequestId: stk?.CheckoutRequestID ?? stk?.checkoutRequestId ?? null,
      raw: stk
    };
    payment.meta = { ...(payment.meta || {}), checkoutRequestId: payment.providerData.checkoutRequestId };
    await payment.save();

    return res.json({
      success: true,
      message: "Top-up STK Push sent. Enter PIN on your phone.",
      checkoutRequestID: payment.providerData.checkoutRequestId,
      paymentId: payment._id
    });
  } catch (err: any) {
    console.error("createTopup error", err);
    return res.status(500).json({ message: "Failed to create topup", error: err.message });
  }
};

/** POST /api/payments/mpesa/callback (used earlier by mpesa.controller, kept for compatibility) */
export const confirmTopupWebhook = async (req: Request, res: Response) => {
  try {
    // This function can be used if you prefer payments.controller to handle some callbacks.
    // We keep it to satisfy the original route assertions; but your main mpesaCallback handles STK callbacks.
    await WebhookLog.create({ receivedAt: new Date(), source: "mpesa", event: "confirmTopupWebhook", payload: req.body });
    return res.status(200).json({ message: "ok" });
  } catch (err: any) {
    console.error("confirmTopupWebhook error", err);
    return res.status(500).json({ message: "confirmTopupWebhook failed", error: err.message });
  }
};

/** POST /api/payments/request-payout */
export const requestPayout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { amount, method, accountInfo } = req.body;
    if (!userId || !amount || !method) return res.status(400).json({ message: "Invalid input" });

    // Basic balance check (you may extend this)
    const payments = await Payment.find({ userId });
    let balance = 0;
    for (const p of payments) {
      if (p.type === "topup" && p.status === "paid") balance += p.amount;
      if (p.type === "payout" && p.status === "paid") balance -= p.amount;
    }
    if (amount > balance) return res.status(400).json({ message: "Insufficient balance" });

    const payout = await Payment.create({
      userId,
      amount,
      currency: "KES",
      type: "payout",
      status: "pending",
      meta: { method, accountInfo }
    });

    return res.json({ success: true, message: "Payout requested (pending)", payout });
  } catch (err: any) {
    console.error("requestPayout error", err);
    return res.status(500).json({ message: "Request payout failed", error: err.message });
  }
};

/** GET /api/payments */
export const listPayments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId ?? req.query.userId;
    const limit = Number(req.query.limit ?? 50);
    if (!userId) return res.status(400).json({ message: "userId required" });

    const payments = await Payment.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    return res.json({ payments });
  } catch (err: any) {
    console.error("listPayments error", err);
    return res.status(500).json({ message: "Could not list payments", error: err.message });
  }
};

/** PATCH /api/payments/admin/:id */
export const adminPatchPayment = async (req: Request, res: Response) => {
  try {
    const update = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!update) return res.status(404).json({ message: "Payment not found" });
    return res.json(update);
  } catch (err: any) {
    console.error("adminPatchPayment error", err);
    return res.status(500).json({ message: "Failed to update payment", error: err.message });
  }
};
