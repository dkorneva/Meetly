import { Router } from "express";
import multer from "multer";
import { Services } from "../services";
import { requireAuth, userId } from "./auth";
import { limit } from "./rate-limit";
import * as validate from "./validation";

export function filesRoutes(services: Services) {
  const router = Router();
  const upload = multer({ limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
  router.post("/", limit(), requireAuth(services.auth), upload.single("file"), async function (req, res) {
    const meetingId = validate.upload(req.body);
    res.status(201).json(await services.files.upload(userId(req), req.file, meetingId));
  });
  router.get("/:id", limit(), async function (req, res) {
    const id = validate.uuid(req.params.id);
    const token = validate.queryText(req.query.token);
    const file = await services.files.download(id, token);
    res.setHeader("Content-Type", file.mime);
    res.setHeader("Cache-Control", "private, no-store");
    let disposition = "attachment";
    if (file.mime.startsWith("image/")) disposition = "inline";
    res.setHeader("Content-Disposition", `${disposition}; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.send(Buffer.from(file.data));
  });
  return router;
}
