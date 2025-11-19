// backend/src/scripts/seed-admin.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import User from '../models/User';
import AuditLog from '../models/AuditLog';

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI environment variable is not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to', uri);

  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const password = process.env.ADMIN_PASS || process.argv[3];
  const name = process.env.ADMIN_NAME || process.argv[4] || 'Administrator';

  if (!email || !password) {
    console.error('Usage: ADMIN_EMAIL and ADMIN_PASS env vars OR pass email password as args');
    process.exit(1);
  }

  // avoid creating duplicate admin
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('User with that email already exists. Updating role to admin.');
    existing.role = 'admin';
    existing.verified = true;
    await existing.save();
    await AuditLog.create({ actor: existing._id, action: 'seed_admin:promoted_existing', details: { email } });
    console.log('Existing user promoted to admin:', email);
    await mongoose.disconnect();
    return;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    name,
    email,
    passwordHash,
    role: 'admin',
    verified: true,
    createdAt: new Date()
  });

  await user.save();
  await AuditLog.create({ actor: user._id, action: 'seed_admin:created', details: { email } });
  console.log('Admin user created:', email);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
