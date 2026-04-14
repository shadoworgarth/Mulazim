import { Router } from "express";

const router = Router();

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const PROMPT =
  "This is an ingredient label from a food product. " +
  "Find every food additive code visible in the image — these appear as E-numbers like E211, E202, E150a, E330, etc. " +
  "Return ONLY a valid JSON array of the numeric parts as integers, for example: [211, 202, 150, 330]. " +
  "If no additive codes are found, return []. " +
  "Output nothing else — no explanation, no markdown, just the JSON array.";

router.post("/ocr", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body as {
      imageBase64?: string;
      mimeType?: string;
    };

    if (!imageBase64) {
      res.status(400).json({ error: "imageBase64 is required" });
      return;
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "GOOGLE_VISION_API_KEY is not configured" });
      return;
    }

    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 256,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      res.status(502).json({ error: "Gemini API request failed", detail: errText });
      return;
    }

    const geminiJson = await geminiRes.json() as any;
    const rawText: string =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

    // Parse the returned JSON array
    let codes: number[] = [];
    try {
      // Strip any accidental markdown code fences
      const cleaned = rawText.replace(/```[a-z]*\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        codes = parsed.filter((x) => typeof x === "number" && x >= 100 && x <= 1599);
      }
    } catch {
      // Fallback: pull any 3-4 digit numbers out of whatever text was returned
      const re = /\b(\d{3,4})\b/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(rawText)) !== null) {
        const n = parseInt(m[1], 10);
        if (n >= 100 && n <= 1599 && !codes.includes(n)) codes.push(n);
      }
    }

    res.json({ codes, rawText });
  } catch (err: any) {
    console.error("OCR route error:", err);
    res.status(500).json({ error: err?.message ?? "Internal error" });
  }
});

export default router;
