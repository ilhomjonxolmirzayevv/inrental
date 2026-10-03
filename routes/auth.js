import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const router = Router();

// POST /api/auth/admin-login
router.post("/admin-login", async (req, res) => {
  const { login, password } = req.body;

  const admin = await Admin.findOne({ login });
  if (!admin) {
    return res.status(401).json({ message: "Login yoki parol noto'g'ri" });
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Login yoki parol noto'g'ri" });
  }

  const token = jwt.sign(
    { id: admin._id, login: admin.login },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: "12h" }
  );

  res.json({ token });
});

export default router;
