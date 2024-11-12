import UserModel from "./user-model.js";
import "dotenv/config";
import { connect } from "mongoose";

export async function connectToDB() {
  let mongoDBUri =
    process.env.ENV === "PROD"
      ? process.env.DB_CLOUD_URI
      : process.env.DB_LOCAL_URI;

  await connect(mongoDBUri);
}

export async function createUser(username, email, password) {
  return new UserModel({ username, email, password }).save();
}

export async function findUserByEmail(email) {
  return UserModel.findOne({ email });
}

export async function findUserById(userId) {
  return UserModel.findById(userId);
}

export async function findUserByUsername(username) {
  return UserModel.findOne({ username });
}

export async function findUserByForgotPasswordToken(token) {
  return UserModel.findOne({ forgotPasswordToken: token });
}

export async function findUserByVerificationToken(token) {
  return UserModel.findOne({ verificationToken: token });
}

export async function findUserByUsernameOrEmail(username, email) {
  return UserModel.findOne({
    $or: [{ username }, { email }],
  });
}

export async function findAllUsers() {
  return UserModel.find();
}

export async function updateUserById(userId, username, avatar, password) {
  const updateFields = {};
  if (username) updateFields.username = username;
  if (password) updateFields.password = password;
  if (avatar) updateFields.avatar = avatar;
  return UserModel.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true }
  );
}

export async function updateUserForgetPasswordTokenById(
  userId,
  forgotPasswordToken,
  forgotPasswordTokenExpiry
) {
  return UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        forgotPasswordToken,
        forgotPasswordTokenExpiry,
      },
    },
    { new: true, runValidators: true } // return the updated user
  );
}

export async function updateUserPasswordById(userId, password) {
  return UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        password: password,
        forgotPasswordToken: "",
        forgotPasswordTokenExpiry: "",
      },
    },
    { new: true }
  );
}

export async function updateUserVerificationTokenById(
  userId,
  verificationToken,
  verificationTokenExpiry
) {
  return UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        verificationToken,
        verificationTokenExpiry,
      },
    },
    { new: true, runValidators: true } // return the updated user
  );
}

export async function updateUserVerificationStatusById(userId, password) {
  return UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        isVerified: true,
        verificationToken: "",
        verificationTokenExpiry: "",
      },
    },
    { new: true }
  );
}

export async function updateUserPrivilegeById(userId, isAdmin) {
  return UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        isAdmin,
      },
    },
    { new: true } // return the updated user
  );
}

export async function deleteUserById(userId) {
  return UserModel.findByIdAndDelete(userId);
}
