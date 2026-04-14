import { Router } from "express";
import express from "express";

const router = Router();

// Larger body limit for base64 images
router.use(express.json({ limit: "10mb" }));

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

    // Dynamically import tesseract.js (externalized from bundle)
    const { createWorker } = await import("tesseract.js");

    const worker = await createWorker("eng", 1, {
      logger: () => {},
      errorHandler: () => {},
    });

    await worker.setParameters({
      tessedit_pageseg_mode: "3" as any,
    });

    const buffer = Buffer.from(imageBase64, "base64");
    const { data } = await worker.recognize(buffer);
    await worker.terminate();

    res.json({ text: data.text, confidence: data.confidence });
  } catch (err: any) {
    console.error("OCR error:", err);
    res.status(500).json({ error: err?.message ?? "OCR failed" });
  }
});

export default router;
