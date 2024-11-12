import jwt from "jsonwebtoken";
import { findUserById as _findUserById } from "../model/repository.js";

export function verifyAccessToken(req, res, next) {
  const token = req.cookies["token"];
  if (!token) {
    return res.status(401).json({ message: "Authentication failed" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    // load latest user info from DB
    const dbUser = await _findUserById(user.id);
    if (!dbUser) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    req.user = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      isAdmin: dbUser.isAdmin,
      avatar: dbUser.avatar,
    };
    next();
  });
}

export function verifyIsAdmin(req, res, next) {
  if (req.user.isAdmin) {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Not authorized to access this resource" });
  }
}

export function verifyIsOwnerOrAdmin(req, res, next) {
  if (req.user.isAdmin) {
    return next();
  }

  const userIdFromReqParams = req.params.id;
  const userIdFromToken = req.user.id;
  if (userIdFromReqParams === userIdFromToken) {
    return next();
  }

  return res
    .status(403)
    .json({ message: "Not authorized to access this resource" });
}
