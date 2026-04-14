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

    // PSM 11 = sparse text: find characters anywhere on the page without
    // assuming a reading order.  No character whitelist — the whitelist
    // causes the neural-net engine to forcibly map non-digit glyphs to
    // the nearest digit (e.g. "a"→"8", "%"→"3"), which creates false codes.
    // We extract only strict E-prefixed patterns in post-processing instead.
    await worker.setParameters({
      tessedit_pageseg_mode: "11" as any,
    });

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
