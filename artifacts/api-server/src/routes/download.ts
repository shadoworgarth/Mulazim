import { Router, type IRouter } from "express";
import { resolveApkUrl } from "../lib/eas";

const router: IRouter = Router();

router.get("/download", async (req, res): Promise<void> => {
  const resolved = await resolveApkUrl();
  const apkUrl = resolved.url;

  const appName = process.env.APP_NAME || "مُلازِم";
  const appVersion = process.env.APP_VERSION || resolved.appVersion || "";

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>تحميل تطبيق ${appName}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
    integrity="sha512-CNgIRecGo7nphbeZ04Sc13ka07paqdeTu0WR1IM4kNcpmBAUSHSQX0FslNhTDadL4O5SAGapGt4FodqL8My0mA=="
    crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: #f4f6f0;
      color: #1a1a1a;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }

    .card {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 4px 24px rgba(26, 92, 58, 0.12);
      padding: 40px 32px 36px;
      max-width: 420px;
      width: 100%;
      text-align: center;
    }

    .logo-ring {
      width: 72px;
      height: 72px;
      border-radius: 18px;
      background: #1a5c3a;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
    }

    .logo-ring svg { width: 40px; height: 40px; }

    h1 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #1a5c3a;
      margin-bottom: 4px;
    }

    .version {
      font-size: 0.85rem;
      color: #777;
      margin-bottom: 28px;
    }

    .qr-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      border: 3px solid #1a5c3a;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 24px;
    }

    #qr-placeholder {
      width: 180px;
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #aaa;
      font-size: 0.8rem;
    }

    .download-btn {
      display: inline-block;
      background: #1a5c3a;
      color: #fff;
      text-decoration: none;
      font-size: 1rem;
      font-weight: 600;
      padding: 14px 32px;
      border-radius: 50px;
      margin-bottom: 28px;
      transition: background 0.2s;
    }
    .download-btn:hover { background: #154d30; }

    .instructions {
      background: #f0f7f3;
      border-radius: 12px;
      padding: 20px 18px;
      text-align: right;
    }

    .instructions h2 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1a5c3a;
      margin-bottom: 12px;
    }

    .instructions ol {
      padding-right: 20px;
      list-style: decimal;
    }

    .instructions li {
      font-size: 0.9rem;
      line-height: 1.7;
      color: #333;
      margin-bottom: 4px;
    }

    .instructions li strong { color: #1a5c3a; }

    .note {
      margin-top: 12px;
      font-size: 0.8rem;
      color: #888;
      line-height: 1.6;
    }

    .footer {
      margin-top: 28px;
      font-size: 0.75rem;
      color: #aaa;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-ring">
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 12h24M8 20h16M8 28h20" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="28" r="7" fill="#fff" opacity="0.25"/>
        <path d="M29 28l2 2 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <h1>${appName}</h1>
    ${appVersion ? `<p class="version">الإصدار ${appVersion}</p>` : '<p class="version">مكتبة المُفتِّش</p>'}

    <div class="qr-wrap">
      <div id="qr-placeholder">جارٍ التحميل...</div>
    </div>

    <br />

    <a class="download-btn" href="${apkUrl}" download>
      ⬇ تحميل التطبيق (APK)
    </a>

    <div class="instructions">
      <h2>📱 خطوات التثبيت</h2>
      <ol>
        <li>امسح رمز الاستجابة السريعة أو اضغط على زر التحميل</li>
        <li>افتح <strong>الإعدادات</strong> على هاتفك</li>
        <li>ابحث عن <strong>تثبيت تطبيقات غير معروفة</strong> أو <strong>مصادر غير معروفة</strong></li>
        <li>فعِّل الخيار للسماح بالتثبيت من هذا المصدر</li>
        <li>افتح ملف APK الذي تم تحميله وثبِّت التطبيق</li>
        <li>بعد التثبيت يمكنك إعادة إيقاف تشغيل هذا الخيار</li>
      </ol>
      <p class="note">
        ملاحظة: قد تختلف مسميات الإعدادات حسب نوع الهاتف وإصدار Android.
      </p>
    </div>
  </div>

  <p class="footer">تطبيق مُلازِم — أداة مفتشي هيئة الغذاء والدواء</p>

  <script>
    (function () {
      var url = ${JSON.stringify(apkUrl)};
      var placeholder = document.getElementById("qr-placeholder");
      placeholder.innerHTML = "";
      placeholder.style.width = "180px";
      placeholder.style.height = "180px";
      try {
        new QRCode(placeholder, {
          text: url,
          width: 180,
          height: 180,
          colorDark: "#1a5c3a",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M,
        });
      } catch (e) {
        placeholder.textContent = "تعذّر إنشاء رمز QR";
      }
    })();
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

export default router;
