import bcrypt from "bcrypt";
import { isValidObjectId } from "mongoose";
import {
  createUser as _createUser,
  deleteUserById as _deleteUserById,
  findAllUsers as _findAllUsers,
  findUserByEmail as _findUserByEmail,
  findUserById as _findUserById,
  findUserByUsername as _findUserByUsername,
  findUserByUsernameOrEmail as _findUserByUsernameOrEmail,
  updateUserById as _updateUserById,
  updateUserPrivilegeById as _updateUserPrivilegeById,
  findUserByForgotPasswordToken as _findUserByForgotPasswordToken,
  updateUserPasswordById as _updateUserPasswordById,
  findUserByVerificationToken as _findUserByVerificationToken,
  updateUserVerificationStatusById,
} from "../model/repository.js";
import { EMAIL_TYPE, sendEmail } from "../utils/mailer.js";
import cloudinary from "../config/cloudinary-config.js";
import { fileRemover } from "../utils/fileRemover.js";

export async function createUser(req, res) {
  try {
    const { username, password } = req.body;
    const email = req.body.email ? req.body.email.toLowerCase() : "";
    if (username && email && password) {
      const existingUser = await _findUserByUsernameOrEmail(username, email);
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "username or email already exists" });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);
      const createdUser = await _createUser(
        username,
        email.toLowerCase(),
        hashedPassword
      );
      await sendEmail(email, createdUser._id, EMAIL_TYPE.VERIFICATION);
      return res.status(201).json({
        message: `Created new user ${username} successfully`,
        data: formatUserResponse(createdUser),
      });
    } else {
      return res
        .status(400)
        .json({ message: "username and/or email and/or password are missing" });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when creating new user!" });
  }
}

export async function getUser(req, res) {
  try {
    const userId = req.params.id;
    if (!isValidObjectId(userId)) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    const user = await _findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    } else {
      return res
        .status(200)
        .json({ message: `Found user`, data: formatUserResponse(user) });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when getting user!" });
  }
}

export async function getAllUsers(req, res) {
  try {
    const users = await _findAllUsers();

    return res
      .status(200)
      .json({ message: `Found users`, data: users.map(formatUserResponse) });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when getting all users!" });
  }
}

export async function updateUser(req, res) {
  try {
    const { username, newPassword, oldPassword } = req.body;
    const { file } = req;

    if (oldPassword && (username || newPassword || file)) {
      const userId = req.params.id;
      let newAvatarPath;
      if (!isValidObjectId(userId)) {
        return res.status(404).json({ message: `User ${userId} not found` });
      }
      const user = await _findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: `User ${userId} not found` });
      }

      const match = await bcrypt.compare(oldPassword, user.password);
      if (!match) {
        return res.status(401).json({ message: "Wrong password" });
      }

      if (file) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "PeerPrep",
          });
          newAvatarPath = result.secure_url;
        } catch (err) {
          return res.status(500).json({
            message: "Unknown error when uploading image!",
          });
        } finally {
          fileRemover(file.filename);
        }
      }

      if (username) {
        let existingUser = await _findUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({ message: "username already exists" });
        }
      }

      let hashedPassword;
      if (newPassword) {
        const salt = bcrypt.genSaltSync(10);
        hashedPassword = bcrypt.hashSync(newPassword, salt);
      }

      const updatedUser = await _updateUserById(
        userId,
        username,
        newAvatarPath,
        hashedPassword
      );
      return res.status(200).json({
        message: `Updated data for user ${userId}`,
        data: formatUserResponse(updatedUser),
      });
    } else {
      return res.status(400).json({
        message:
          "Missing current password or no field to update: username and new password are all missing!",
      });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when updating user!" });
  }
}

export async function updateUserPrivilege(req, res) {
  try {
    const { isAdmin } = req.body;

    if (isAdmin !== undefined) {
      // isAdmin can have boolean value true or false
      const userId = req.params.id;
      if (!isValidObjectId(userId)) {
        return res.status(404).json({ message: `User ${userId} not found` });
      }
      const user = await _findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: `User ${userId} not found` });
      }

      const updatedUser = await _updateUserPrivilegeById(
        userId,
        isAdmin === true
      );
      return res.status(200).json({
        message: `Updated privilege for user ${userId}`,
        data: formatUserResponse(updatedUser),
      });
    } else {
      return res.status(400).json({ message: "isAdmin is missing!" });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when updating user privilege!" });
  }
}

export async function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    if (!isValidObjectId(userId)) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }
    const user = await _findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User ${userId} not found` });
    }

    await _deleteUserById(userId);
    return res
      .status(200)
      .json({ message: `Deleted user ${userId} successfully` });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when deleting user!" });
  }
}

export async function forgetPassword(req, res) {
  try {
    if (!req.params.email) {
      return res.status(400).json({ message: "Email is missing" });
    }
    const userEmail = req.params.email.toLowerCase();
    const user = await _findUserByEmail(userEmail);

    if (user) {
      await sendEmail(userEmail, user._id, EMAIL_TYPE.RESET_PASSWORD);
    }

    return res.status(200).json({
      message: `Reset password link will be send to ${userEmail} if exist`,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when sending forget password!" });
  }
}

export async function resetPassword(req, res) {
  try {
    const token = req.params.token;

    const user = await _findUserByForgotPasswordToken(token);

    if (!user) {
      return res.status(400).json({
        message: "Invalid Token!",
      });
    }

    const { newPassword } = req.body;
    let hashedPassword;
    if (newPassword) {
      const salt = bcrypt.genSaltSync(10);
      hashedPassword = bcrypt.hashSync(newPassword, salt);
      const updatedUser = await _updateUserPasswordById(
        user._id,
        hashedPassword
      );
      return res.status(200).json({
        message: `Updated password for user ${user._id}`,
        data: formatUserResponse(updatedUser),
      });
    } else {
      return res.status(400).json({
        message: "Missing password!",
      });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when reseting password!" });
  }
}

export async function verifyUserAccount(req, res) {
  try {
    const token = req.params.token;
    const user = await _findUserByVerificationToken(token);

    if (!user) {
      return res.status(400).json({
        message: "Invalid Token!",
      });
    }

    await updateUserVerificationStatusById(user._id);

    return res.status(200).json({
      message: `Verification completed for user ${user._id}`,
      data: formatUserResponse(user),
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Unknown error when verifying account!" });
  }
}

export function formatUserResponse(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}
