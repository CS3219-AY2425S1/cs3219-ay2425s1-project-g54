import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByEmail as _findUserByEmail } from "../model/repository.js";
import { formatUserResponse } from "./user-controller.js";
import { EMAIL_TYPE, sendEmail } from "../utils/mailer.js";

export async function handleLogin(req, res) {
  const { password } = req.body;
  const email = req.body.email ? req.body.email.toLowerCase() : "";
  if (email && password) {
    try {
      const user = await _findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Wrong email and/or password" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: "Wrong email and/or password" });
      }

      if (!user.isVerified) {
        await sendEmail(email, user._id, EMAIL_TYPE.VERIFICATION);
        return res.status(403).json({ message: "Please verify your email" });
      }

      const accessToken = jwt.sign(
        {
          id: user.id,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );
      res.cookie("token", accessToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        secure: true,
        sameSite: process.env.ENV == "dev" ? "strict" : "none",
      });
      return res
        .status(200)
        .json({ message: "User logged in", data: formatUserResponse(user) });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    return res.status(400).json({ message: "Missing email and/or password" });
  }
}

export async function handleLogout(req, res) {
  res.cookie("token", "", {
    httpOnly: true,
    secure: true,
    sameSite: process.env.ENV == "dev" ? "strict" : "none",
    maxAge: -1,
  });
  return res.status(200).json({ message: "User logged out" });
}

export async function handleVerifyToken(req, res) {
  try {
    // const token = req.cookie.token;
    // const verifiedUser = jwt.verify(token, process.env.JWT_SECRET);
    const verifiedUser = req.user;
    return res
      .status(200)
      .json({ message: "Token verified", data: verifiedUser });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
