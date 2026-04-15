import { Router, type IRouter } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { otpRequests, deviceTokens } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { Resend } from "resend";

const router: IRouter = Router();

const ALLOWED_DOMAIN = "sfda.gov.sa";
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken(): string {
  return crypto.randomUUID();
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");
  return new Resend(apiKey);
}

// POST /api/auth/request-otp
router.post("/auth/request-otp", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const domain = normalizedEmail.split("@")[1];

    if (domain !== ALLOWED_DOMAIN) {
      return res.status(403).json({ error: "البريد الإلكتروني يجب أن يكون من نطاق @sfda.gov.sa" });
    }

    // Rate limit: check recent requests
    const recentRequests = await db
      .select()
      .from(otpRequests)
      .where(
        and(
          eq(otpRequests.email, normalizedEmail),
          gt(otpRequests.expiresAt, new Date()),
          eq(otpRequests.used, false)
        )
      );

    if (recentRequests.length >= 3) {
      return res.status(429).json({ error: "تم إرسال عدد كبير من الرموز. انتظر قليلاً وحاول مجدداً" });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await db.insert(otpRequests).values({
      email: normalizedEmail,
      otpHash,
      expiresAt,
    });

    const resend = getResend();
    await resend.emails.send({
      from: "SFDA Food Additives <onboarding@resend.dev>",
      to: normalizedEmail,
      subject: "رمز التحقق - دليل المضافات الغذائية",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f2f6f8; border-radius: 12px;">
          <h2 style="color: #0e7c7c; text-align: right; margin-bottom: 8px;">دليل المضافات الغذائية - SFDA</h2>
          <p style="color: #444; text-align: right; margin-bottom: 24px;">رمز التحقق الخاص بك لتفعيل التطبيق:</p>
          <div style="background: #fff; border-radius: 10px; padding: 24px; text-align: center; border: 2px solid #0e7c7c22;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #0e7c7c;">${otp}</span>
          </div>
          <p style="color: #888; text-align: right; margin-top: 20px; font-size: 13px;">
            هذا الرمز صالح لمدة ${OTP_EXPIRY_MINUTES} دقائق.<br/>
            لا تشاركه مع أي شخص.
          </p>
        </div>
      `,
    });

    return res.json({ success: true, message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني" });
  } catch (err) {
    console.error("request-otp error:", err);
    return res.status(500).json({ error: "حدث خطأ أثناء إرسال الرمز. حاول مجدداً" });
  }
});

// POST /api/auth/verify-otp
router.post("/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp, deviceId } = req.body as { email?: string; otp?: string; deviceId?: string };

    if (!email || !otp) {
      return res.status(400).json({ error: "البريد الإلكتروني والرمز مطلوبان" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpHash = hashOtp(otp.trim());

    const [request] = await db
      .select()
      .from(otpRequests)
      .where(
        and(
          eq(otpRequests.email, normalizedEmail),
          eq(otpRequests.used, false),
          gt(otpRequests.expiresAt, new Date())
        )
      )
      .orderBy(otpRequests.createdAt)
      .limit(1);

    if (!request) {
      return res.status(400).json({ error: "لم يتم العثور على رمز صالح. اطلب رمزاً جديداً" });
    }

    if (request.attempts >= MAX_ATTEMPTS) {
      return res.status(400).json({ error: "تم تجاوز الحد الأقصى للمحاولات. اطلب رمزاً جديداً" });
    }

    if (request.otpHash !== otpHash) {
      await db
        .update(otpRequests)
        .set({ attempts: request.attempts + 1 })
        .where(eq(otpRequests.id, request.id));
      const remaining = MAX_ATTEMPTS - request.attempts - 1;
      return res.status(400).json({ error: `رمز التحقق غير صحيح. تبقى ${remaining} محاولات` });
    }

    // Mark OTP as used
    await db
      .update(otpRequests)
      .set({ used: true })
      .where(eq(otpRequests.id, request.id));

    // Generate permanent device token
    const token = generateToken();
    await db.insert(deviceTokens).values({
      token,
      email: normalizedEmail,
      deviceId: deviceId ?? null,
    });

    return res.json({ success: true, token });
  } catch (err) {
    console.error("verify-otp error:", err);
    return res.status(500).json({ error: "حدث خطأ أثناء التحقق. حاول مجدداً" });
  }
});

// POST /api/auth/check-device
router.post("/auth/check-device", async (req, res) => {
  try {
    const { token } = req.body as { token?: string };

    if (!token) {
      return res.json({ valid: false });
    }

    const [device] = await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, token))
      .limit(1);

    return res.json({ valid: !!device, email: device?.email ?? null });
  } catch (err) {
    console.error("check-device error:", err);
    return res.json({ valid: false });
  }
});

export default router;
