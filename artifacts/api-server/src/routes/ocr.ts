import { Router } from "express";

const router = Router();

router.post("/ocr", async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = "image/jpeg",
      mode = "numbers",   // "numbers" | "full"
    } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      mode?: string;
    };

    if (!imageBase64) {
      res.status(400).json({ error: "imageBase64 is required" });
      return;
    }

    const { createWorker } = await import("tesseract.js");

    const worker = await createWorker("eng", 1, {
      logger: () => {},
      errorHandler: () => {},
    });

    if (mode === "numbers") {
      // Restrict Tesseract to only recognise digits + "E" so it focuses
      // entirely on INS / E-numbers and ignores prose text.
      // PSM 11 = sparse text: pick up characters anywhere on the page.
      await worker.setParameters({
        tessedit_pageseg_mode: "11" as any,
        tessedit_char_whitelist: "Ee0123456789 ,()-/.",
      } as any);
    } else {
      await worker.setParameters({
        tessedit_pageseg_mode: "3" as any,
      });
    }

    const buffer = Buffer.from(imageBase64, "base64");
    const { data } = await worker.recognize(buffer);
    await worker.terminate();

    res.json({ text: data.text, confidence: data.confidence, mode });
  } catch (err: any) {
    console.error("OCR error:", err);
    res.status(500).json({ error: err?.message ?? "OCR failed" });
  }
});

export default router;
