import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Resend } from "resend";
import wholesaleSellerModel from "../models/wholesale-sellerModel.js";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Function to send reset password email
const sendResetPasswordEmail = async (sellerEmail, resetToken) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const response = await resend.emails.send({
      from: "noreply@trading.printing.coop",
      to: sellerEmail,
      subject: "Reset Your Password - Trading & Printing Coop",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #666; font-size: 16px;">
            You have requested to reset your password. Click the link below to proceed:
          </p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            This link will expire in 10 minutes. If you didn't request this, please ignore this email.
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 14px;">
              Best regards,<br/>
              <strong>Trading & Printing Coop Team</strong>
            </p>
          </div>
        </div>
      `,
    });

    if (response.error) {
      console.error("[v0] Resend API error:", response.error);
      return false;
    } else {
      console.log("[v0] Reset password email sent successfully to:", sellerEmail, "ID:", response.data.id);
      return true;
    }
  } catch (error) {
    console.error("[v0] Error sending reset password email:", error.message);
    return false;
  }
};

// Route for wholesale seller login
const loginWholesaleSeller = async (req, res) => {
  try {
    const { email, password } = req.body;

    const seller = await wholesaleSellerModel.findOne({ email });

    if (!seller) {
      return res.json({ success: false, message: "Seller not found" });
    }

    const isMatch = await bcrypt.compare(password, seller.password);

    if (isMatch) {
      const token = createToken(seller._id);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for wholesale seller registration
const registerWholesaleSeller = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, address, companyName, country, city, state, zipcode, website } = req.body;

    // Check if seller already exists
    const exists = await wholesaleSellerModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "Seller already exists" });
    }

    // Validate email format and strong password
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "Password must be at least 8 characters long" });
    }

    // Validate required fields
    if (!name || !phoneNumber || !address || !companyName || !country || !city || !state || !zipcode) {
      return res.json({ success: false, message: "All required fields must be filled" });
    }

    // Hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newSeller = new wholesaleSellerModel({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      address,
      companyName,
      country,
      city,
      state,
      zipcode,
      website,
    });

    const seller = await newSeller.save();

    const token = createToken(seller._id);
    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for wholesale seller forgot password - sends reset link
const forgotPasswordSeller = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if seller exists
    const seller = await wholesaleSellerModel.findOne({ email });
    if (!seller) {
      return res.json({ success: false, message: "Seller not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Hash the reset token for storage
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    // Set token and expiration (10 minutes)
    seller.resetPasswordToken = hashedToken;
    seller.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await seller.save();

    // Send reset password email
    const emailSent = await sendResetPasswordEmail(email, resetToken);

    if (emailSent) {
      res.json({ success: true, message: "Reset password link sent to your email" });
    } else {
      res.json({ success: false, message: "Failed to send reset password email" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for wholesale seller reset password
const resetPasswordSeller = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate new password
    if (newPassword.length < 8) {
      return res.json({ success: false, message: "Password must be at least 8 characters long" });
    }

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find seller with matching reset token and check if it's not expired
    const seller = await wholesaleSellerModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }, // Token not expired
    });

    if (!seller) {
      return res.json({ success: false, message: "Invalid or expired reset token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token fields
    seller.password = hashedPassword;
    seller.resetPasswordToken = null;
    seller.resetPasswordExpires = null;

    await seller.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { loginWholesaleSeller, registerWholesaleSeller, forgotPasswordSeller, resetPasswordSeller };
