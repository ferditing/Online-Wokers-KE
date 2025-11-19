// backend/src/services/auth.service.ts
import User, { IUser } from "../models/User";
import bcrypt from "bcryptjs";
import jwt, { SignOptions, Secret } from "jsonwebtoken";
import config from "../config";

/**
 * Register a new user.
 * Throws on duplicate email.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: IUser["role"]
): Promise<IUser> {
  const existing = await User.findOne({ email }).exec();
  if (existing) throw new Error("Email already in use");

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
  });

  return user as unknown as IUser;
}

/* ------------------ JWT helpers ------------------ */

// fail fast if not configured
const JWT_SECRET = config.jwtSecret;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in config (auth.service)");
}

// keep expiry as string (default to 7d)
const RAW_JWT_EXPIRES_IN = config.jwtExpiresIn ?? "7d";

/**
 * Sign a JWT for a user id.
 *
 * Note: we cast the options into SignOptions to satisfy typings without importing
 * non-exported internal types from jsonwebtoken.
 */
export function signToken(userId: string): string {
  const secret = JWT_SECRET as Secret;

  // build opts as unknown and then assert to SignOptions to avoid overload confusion
  const opts = ({ expiresIn: RAW_JWT_EXPIRES_IN } as unknown) as SignOptions;

  const payload = { userId };

  return jwt.sign(payload, secret, opts);
}

/**
 * Validate credentials and return the user if valid.
 */
export async function validateUser(email: string, password: string): Promise<IUser | null> {
  const userDoc = await User.findOne({ email }).exec();
  if (!userDoc) return null;

  // cast due to mongoose Document typing differences across setups
  const user = userDoc as unknown as IUser & { passwordHash: string };

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return null;

  return user;
}
