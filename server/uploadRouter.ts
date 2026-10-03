import { Router } from "express";
import multer from "multer";
import { storagePut } from "./storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  },
});

export function registerUploadRoute(app: Router) {
  app.post("/api/upload", upload.single("file"), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }
      const ext = req.file.originalname.split(".").pop() || "png";
      const key = `logos/clinica-${Date.now()}.${ext}`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      return res.json({ url, key });
    } catch (err: any) {
      console.error("[Upload] Erro:", err);
      return res.status(500).json({ error: err.message || "Erro no upload" });
    }
  });
}
