import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory store for OTPs
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Lazy initialize Nodemailer transporter with the provided fallback credentials
let transporter: any = null;

function getTransporter() {
  if (!transporter) {
    const user = process.env.SMTP_USER || "wolfshop181@gmail.com";
    const pass = process.env.SMTP_PASS || "hlbd oqtq sies bzeb";
    
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user.trim(),
        pass: pass.trim(),
      },
    });
  }
  return transporter;
}

// Secure API endpoint to generate, store, and send 6-digit OTP
app.post("/api/send-otp", async (req, res) => {
  const { email, action } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email address is required.",
      error: "Email address is required.",
      data: {}
    });
  }
  const cleanEmail = email.trim().toLowerCase();
  
  // Generate a secure 6-digit verification code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set code expiry time to 5 minutes
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(cleanEmail, { otp, expiresAt });
  
  try {
    const mailTransporter = getTransporter();
    const senderEmail = process.env.SMTP_USER || "wolfshop181@gmail.com";
    
    const appName = "Hridoy Coaching Management Platform";
    const senderName = "Hridoy Coaching";
    const subject = "Your Login Verification Code";
    
    const actionText = action === "signup" 
       ? "creating your account" 
       : (action === "forgot" ? "resetting your password" : "logging into your account");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="background-color: #F8FAFC; padding: 32px 16px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 550px; background-color: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <tr>
              <td style="padding: 40px 32px;">
                <!-- Header/Branding -->
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="color: #0F172A; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px; font-family: 'Segoe UI', sans-serif;">${appName}</h1>
                  <p style="color: #16A34A; font-size: 13px; font-weight: 700; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-family: 'Segoe UI', sans-serif;">Secure Verification</p>
                </div>
                
                <!-- Main Body Content -->
                <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hello,</p>
                <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">You requested a verification code for <strong>${actionText}</strong>. Please use the secure 6-digit OTP below to verify your email address:</p>
                
                <!-- Large Green Verification OTP Box -->
                <div style="background-color: #ECFDF5; border: 2px solid #10B981; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <span style="display: block; color: #065F46; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">Your Verification Code</span>
                  <span style="color: #047857; font-size: 36px; font-weight: 900; letter-spacing: 6px; font-family: Courier, monospace; line-height: 1;">${otp}</span>
                </div>
                
                <!-- Expiry and Security Notice -->
                <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 4px; margin-bottom: 32px;">
                  <p style="color: #78350F; font-size: 13px; margin: 0; line-height: 1.5;">This code is valid for <strong>5 minutes</strong> (300 seconds). If you did not request this verification code, please ignore this email or contact support if you have concerns.</p>
                </div>
                
                <!-- Footer Sign-off -->
                <p style="color: #475569; font-size: 14px; margin: 0 0 4px 0;">Best regards,</p>
                <p style="color: #1E293B; font-weight: 700; font-size: 14px; margin: 0;">${senderName}</p>
              </td>
            </tr>
            <!-- Outer Footer -->
            <tr>
              <td style="background-color: #F1F5F9; padding: 24px; border-radius: 0 0 16px 16px; border-top: 1px solid #E2E8F0; text-align: center;">
                <p style="color: #64748B; font-size: 12px; margin: 0 0 6px 0;">This is an automated security transmission. Please do not reply directly to this email.</p>
                <p style="color: #94A3B8; font-size: 11px; margin: 0;">&copy; 2026 ${senderName}. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"${senderName}" <${senderEmail.trim()}>`,
      to: cleanEmail,
      subject: subject,
      html: html,
    };

    console.log(`Sending secure OTP email to: ${cleanEmail}`);
    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`OTP Sent successfully: ${info.messageId}`);
    
    return res.json({
      success: true,
      message: "OTP Sent Successfully",
      data: { messageId: info.messageId }
    });
  } catch (error: any) {
    console.error("Error sending OTP email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification code. Please check your email address and try again.",
      error: "Failed to send verification code. Please check your email address and try again.",
      details: error.message || error,
      data: {}
    });
  }
});

// Secure API endpoint to verify user OTP code
app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email address and verification code are required.",
      error: "Email address and verification code are required.",
      data: {}
    });
  }
  const cleanEmail = email.trim().toLowerCase();
  const stored = otpStore.get(cleanEmail);
  if (!stored) {
    return res.status(400).json({
      success: false,
      message: "No active verification request found. Please request a new code.",
      error: "No active verification request found. Please request a new code.",
      data: {}
    });
  }
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(cleanEmail);
    return res.status(400).json({
      success: false,
      message: "Verification code has expired. Please request a new code.",
      error: "Verification code has expired. Please request a new code.",
      data: {}
    });
  }
  if (stored.otp !== otp.trim()) {
    return res.status(400).json({
      success: false,
      message: "Invalid verification code. Please check your email and try again.",
      error: "Invalid verification code. Please check your email and try again.",
      data: {}
    });
  }
  
  // Clean verification cache on successful validation
  otpStore.delete(cleanEmail);
  return res.json({
    success: true,
    message: "OTP Verified Successfully",
    data: {}
  });
});

// Simple HTML email helper to generate beautiful, professional-looking layouts
function getEmailTemplate(type: string, data: any) {
  const brandColor = "#16A34A"; // Accent green from the app
  const secondaryColor = "#1E293B"; // Dark slate
  const footerText = "This is an automated notification. Please do not reply directly to this email.";

  const baseHeader = `
    <div style="background-color: ${secondaryColor}; padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">EduManager Portal</h1>
      <p style="color: #10B981; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; font-weight: 600; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Academy Hub</p>
    </div>
  `;

  const baseFooter = `
    <div style="background-color: #F8FAFC; padding: 24px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #E2E8F0;">
      <p style="color: #64748B; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; line-height: 1.5; margin: 0 0 8px 0;">${footerText}</p>
      <p style="color: #94A3B8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; margin: 0;">&copy; 2026 EduManager Inc. All rights reserved.</p>
    </div>
  `;

  let contentHtml = "";
  let subject = "";

  switch (type) {
    case "welcome_signup":
      subject = "Welcome to EduManager - Registration Successful! ✨";
      contentHtml = `
        <h2 style="color: #1E293B; font-family: 'Segoe UI', sans-serif; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">Welcome aboard!</h2>
        <p style="color: #475569; font-family: 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 12px 0;">Thank you for registering an account on <strong>EduManager</strong>. We are thrilled to help you manage your classrooms, attendance, fees, and more with our all-in-one platform.</p>
        <p style="color: #475569; font-family: 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">Your registered email is: <strong style="color: #1E293B;">${data.email}</strong></p>
        
        <div style="background-color: #F1F5F9; border-left: 4px solid ${brandColor}; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
          <h3 style="color: #0F172A; font-family: 'Segoe UI', sans-serif; font-size: 14px; font-weight: 700; margin: 0 0 6px 0;">What's Next?</h3>
          <p style="color: #475569; font-family: 'Segoe UI', sans-serif; font-size: 13px; line-height: 1.5; margin: 0;">Please log into the app, complete your academy profile, and wait for administration approval. Once approved, you can instantly start creating classes, adding students, and tracking attendance.</p>
        </div>
      `;
      break;

    case "profile_completed":
      subject = "Academy Profile Saved - Under Verification 📝";
      contentHtml = `
        <h2 style="color: #1E293B; font-family: 'Segoe UI', sans-serif; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">Profile Saved Successfully</h2>
        <p style="color: #475569; font-family: 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 12px 0;">Hello <strong>${data.name || "Valued Educator"}</strong>,</p>
        <p style="color: #475569; font-family: 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">We have received your academy profile information for <strong>${data.schoolName || "your academy"}</strong>. Your application is currently <strong>pending review</strong> by our administrator team.</p>
        
        <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
          <p style="color: #78350F; font-family: 'Segoe UI', sans-serif; font-size: 13px; line-height: 1.5; margin: 0;"><strong>Verification Status:</strong> Pending. You will receive an automated email notification as soon as your account is reviewed and activated by our team.</p>
        </div>
      `;
      break;

    case "account_approved":
      subject = "Account Approved - Welcome to EduManager! 🎉";
      contentHtml = `
        <h2 style="color: #16A34A; font-family: 'Segoe UI', sans-serif; font-size: 22px; font-weight: 800; margin: 0 0 16px 0;">Your Account is Approved!</h2>
        <p style="color: #475569; font-family: 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 12px 0;">Hello <strong>${data.name || "Educator"}</strong>,</p>
        <p style="color: #475569; font-family: 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">Great news! Your account and academy profile for <strong>${data.schoolName || "your academy"}</strong> have been successfully verified and approved by our system administrator.</p>
        
        <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; padding: 20px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
          <p style="color: #065F46; font-family: 'Segoe UI', sans-serif; font-size: 16px; font-weight: 700; margin: 0 0 12px 0;">You now have full access!</p>
          <p style="color: #047857; font-family: 'Segoe UI', sans-serif; font-size: 14px; margin: 0 0 16px 0;">Log into your dashboard to start creating classes, printing ID cards, and managing monthly fees.</p>
          <a href="${process.env.APP_URL || "https://ais-dev-f6s3xaznpyw3xxtf5kr4cs-104278218649.asia-east1.run.app"}" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; padding: 12px 28px; font-family: 'Segoe UI', sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.2);">Go to Dashboard</a>
        </div>
      `;
      break;

    case "account_rejected":
      subject = "EduManager Account Status Update";
      contentHtml = `
        <h2 style="color: #DC2626; font-family: 'Segoe UI', sans-serif; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">Account Profile Rejection</h2>
        <p style="color: #475569; font-family: 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 12px 0;">Hello <strong>${data.name || "Educator"}</strong>,</p>
        <p style="color: #475569; font-family: 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Your profile details for <strong>${data.schoolName || "your academy"}</strong> were reviewed by our system administrators and could not be approved at this time.</p>
        
        <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
          <h4 style="color: #991B1B; font-family: 'Segoe UI', sans-serif; font-size: 13px; font-weight: 700; margin: 0 0 6px 0;">Reason for Rejection:</h4>
          <p style="color: #7F1D1D; font-family: 'Segoe UI', sans-serif; font-size: 13px; line-height: 1.5; margin: 0;">${data.reason || "Missing or incomplete information in your profile form."}</p>
        </div>
        
        <p style="color: #475569; font-family: 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.5; margin: 0;">Please log back in to review, update, and resubmit your details for quick re-evaluation.</p>
      `;
      break;

    default:
      subject = data.subject || "Notification from EduManager";
      contentHtml = `
        <p style="color: #475569; font-family: 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hello,</p>
        <p style="color: #475569; font-family: 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">${data.message || "You have a new update regarding your EduManager account."}</p>
      `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="background-color: #F1F5F9; padding: 24px 12px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <tr>
            <td>
              ${baseHeader}
              <div style="padding: 32px 24px; background-color: #ffffff;">
                ${contentHtml}
              </div>
              ${baseFooter}
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { subject, html };
}

// API endpoint to send automated email notifications securely using Gmail credentials
app.post("/api/send-email", async (req, res) => {
  const { toEmail, type, data } = req.body;

  if (!toEmail) {
    return res.status(400).json({
      success: false,
      message: "Recipient email (toEmail) is required",
      error: "Recipient email (toEmail) is required",
      data: {}
    });
  }

  try {
    const mailTransporter = getTransporter();
    const { subject, html } = getEmailTemplate(type, data || {});

    const senderEmail = process.env.SMTP_USER || "wolfshop181@gmail.com";
    const mailOptions = {
      from: `"EduManager Team" <${senderEmail.trim()}>`,
      to: toEmail.trim(),
      subject: subject,
      html: html,
    };

    console.log(`Sending email of type "${type}" to: ${toEmail}`);
    const info = await mailTransporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);

    return res.json({
      success: true,
      message: "Email sent successfully",
      data: { messageId: info.messageId }
    });
  } catch (error: any) {
    console.error("Error sending email via SMTP:", error);
    return res.status(500).json({ 
      success: false,
      message: "Failed to dispatch email",
      error: error.message || String(error),
      details: error.message || error,
      data: {}
    });
  }
});

// Catch-all route for any unhandled /api/* endpoints. 
// This is critical: it intercepts API 404s so that they NEVER fall through to the SPA index.html handler,
// preventing the "Unexpected token '<' is not valid JSON" parsing failure on the client/APK side!
app.all("/api/*", (req, res) => {
  console.warn(`[Unhandled API Route] ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
    error: `API endpoint ${req.method} ${req.originalUrl} not found.`,
    data: {}
  });
});

// Vite middleware integration for full-stack build/serve handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
