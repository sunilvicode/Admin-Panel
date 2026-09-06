import nodemailer from "nodemailer";

// ── Create Gmail transporter ──────────────────────────────────────
// Setup:
// 1. Go to myaccount.google.com → Security → 2-Step Verification → Enable
// 2. Search "App Passwords" → Generate for "Mail" on "Other device"
// 3. Copy the 16-character password to EMAIL_PASS in .env
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ── Send OTP Password Reset Email ─────────────────────────────────
export const sendOtpEmail = async (toEmail, otp, userName) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"AdminPanel Security" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "🔐 Your Password Reset OTP — AdminPanel",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Password Reset OTP</title>
      </head>
      <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;max-width:560px;">

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:32px;text-align:center;">
                    <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px;font-size:28px;">
                      🔐
                    </div>
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Password Reset</h1>
                    <p style="color:rgba(255,255,255,0.65);margin:8px 0 0;font-size:13px;">AdminPanel · Security Notification</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 32px;">
                    <p style="color:#94a3b8;font-size:15px;margin:0 0 6px;">Hello <strong style="color:#e2e8f0;">${userName}</strong>,</p>
                    <p style="color:#64748b;font-size:14px;margin:0 0 28px;line-height:1.7;">
                      We received a request to reset the password for your AdminPanel account. 
                      Use the OTP code below to complete the process. This code is valid for 
                      <strong style="color:#a78bfa;">15 minutes</strong>.
                    </p>

                    <!-- OTP Box -->
                    <div style="background:linear-gradient(135deg,rgba(139,92,246,0.12),rgba(59,130,246,0.12));border:1px solid rgba(139,92,246,0.35);border-radius:18px;padding:32px;text-align:center;margin-bottom:28px;">
                      <p style="color:#a78bfa;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;margin:0 0 16px;">Your One-Time Password</p>
                      <div style="font-size:48px;font-weight:900;letter-spacing:16px;color:#ffffff;font-family:'Courier New',monospace;margin:0 0 16px;text-shadow:0 0 30px rgba(139,92,246,0.5);">
                        ${otp}
                      </div>
                      <div style="display:inline-block;background:rgba(0,0,0,0.3);border:1px solid rgba(139,92,246,0.2);border-radius:8px;padding:6px 16px;">
                        <p style="color:#64748b;font-size:12px;margin:0;">⏱ Expires in 15 minutes</p>
                      </div>
                    </div>

                    <!-- Steps -->
                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;">
                      <p style="color:#475569;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">How to use:</p>
                      <p style="color:#64748b;font-size:13px;margin:0 0 6px;line-height:1.5;">1. Go back to the AdminPanel reset page</p>
                      <p style="color:#64748b;font-size:13px;margin:0 0 6px;line-height:1.5;">2. Enter the 6-digit code above</p>
                      <p style="color:#64748b;font-size:13px;margin:0;line-height:1.5;">3. Create your new secure password</p>
                    </div>

                    <!-- Warning -->
                    <div style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.18);border-radius:10px;padding:16px 20px;margin-bottom:28px;">
                      <p style="color:#f87171;font-size:12px;margin:0;line-height:1.6;">
                        ⚠️ <strong>Didn't request this?</strong> You can safely ignore this email. 
                        Your password will remain unchanged unless you use this OTP.
                        If you're concerned, please contact support immediately.
                      </p>
                    </div>

                    <p style="color:#334155;font-size:12px;margin:0;text-align:center;line-height:1.7;">
                      This email was sent to <strong style="color:#475569;">${toEmail}</strong><br/>
                      as part of AdminPanel's security system.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:rgba(0,0,0,0.4);padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
                    <p style="color:#1e293b;font-size:11px;margin:0;">
                      © 2026 AdminPanel · Secured with end-to-end encryption · Do not share this code
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ OTP email sent to ${toEmail}`);
};

// ── Verify transporter connection (optional health check) ─────────
export const verifyEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Email service connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Email service error:", error.message);
    return false;
  }
};
