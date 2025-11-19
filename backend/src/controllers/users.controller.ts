// backend/src/controllers/users.controller.ts
import { Request, Response } from "express";
import User from "../models/User";
import logger from "../utils/logger";

/** GET /api/users/:id - public user info */
export async function getUserPublic(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const user = await User.findById(id).select("name email phone skills verified role createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (err: any) {
    logger.error("getUserPublic error", err);
    return res.status(500).json({ message: "Could not fetch user" });
  }
}

/** PATCH /api/users/:id - allow owner to update certain fields (skills, phone) */
export async function updateUser(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const actor = (req as any).userId;
    if (actor !== id) return res.status(403).json({ message: "Forbidden" });

    const { skills, phone, name } = req.body;
    const upd: any = {};
    if (skills) upd.skills = Array.isArray(skills) ? skills : skills.split?.(",").map((s:string)=>s.trim());
    if (phone) upd.phone = phone;
    if (name) upd.name = name;

    const user = await User.findByIdAndUpdate(id, { $set: upd }, { new: true }).select("name email phone skills verified role");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (err: any) {
    logger.error("updateUser error", err);
    return res.status(500).json({ message: "Could not update user" });
  }
}
