import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import {
  updateUserForgetPasswordTokenById as _updateUserForgetPasswordTokenById,
  updateUserVerificationTokenById as _updateUserVerificationTokenById,
} from "../model/repository.js";

export const EMAIL_TYPE = {
  VERIFICATION: 0,
  RESET_PASSWORD: 1,
};

export const sendEmail = async (email, userId, emailType) => {
  try {
    let hashedToken = await bcrypt.hash(userId.toString(), 10);
    while (
      hashedToken.charAt(hashedToken.length - 1) === "." ||
      hashedToken.includes("/")
    ) {
      hashedToken = await bcrypt.hash(userId.toString(), 10);
    }

    if (emailType === EMAIL_TYPE.VERIFICATION) {
      await _updateUserVerificationTokenById(
        userId,
        hashedToken,
        Date.now() + 3600000 // 1 hour
      );
    } else if (emailType === EMAIL_TYPE.RESET_PASSWORD) {
      await _updateUserForgetPasswordTokenById(
        userId,
        hashedToken,
        Date.now() + 3600000 // 1 hour
      );
    }
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      tls: {
        maxVersion: "TLSv1.3",
        minVersion: "TLSv1.2",
      },
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const subject =
      (emailType === EMAIL_TYPE.VERIFICATION ? "Verify" : "Reset") +
      " Your Account";

    const domain =
      process.env.ENV === "PROD"
        ? process.env.CLOUD_DOMAIN
        : process.env.FRONTEND_ENDPOINT;

    const link = `${domain}/${
      emailType === EMAIL_TYPE.VERIFICATION ? "verify" : "resetpassword"
    }?token=${hashedToken}`;

    const messageBody = `<p>Please click <a href="${link}">here</a> or copy paste the link below in your browser to
            ${
              emailType === EMAIL_TYPE.VERIFICATION ? "verify" : "reset"
            } your account.
            <br>The link is only valid for 1 hour.</br>
            <br>${link}</br>
        </p>`;

    const mailOptions = {
      from: "",
      to: email,
      subject: subject,
      html: messageBody,
    };

    const mailResponse = await transporter.sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    throw new Error(error.message);
  }
};
