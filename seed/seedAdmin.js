import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import Admin from "../models/Admin.js";

dotenv.config();

async function seed() {
  await connectDB();

  const login = "manjiro";
  const password = "manjiro03";

  const existing = await Admin.findOne({ login });
  if (existing) {
    console.log("Admin allaqachon mavjud:", login);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await Admin.create({ login, passwordHash });

  console.log("Admin yaratildi:", login);
  process.exit(0);
}

seed();
