import { Router } from "express";
import multer from "multer";
import { Services } from "../services";
import { requireAuth, userId } from "./auth";
import { limit } from "./rate-limit";
import * as validate from "./validation";

/** Создаёт маршруты загрузки файлов и скачивания по временной ссылке с проверкой доступа. */
export function filesRoutes(services: Services) {
  const router = Router();
  const upload = multer({ limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
  router.post("/", limit(), requireAuth(services.auth), upload.single("file"), async function (req, res) {
    const meetingId = validate.upload(req.body);
    res.status(201).json(await services.files.upload(userId(req), req.file, meetingId));
  });
  router.get("/:id", limit(), async function (req, res) {
    const id = validate.uuid(req.params.id); // получает значение из адреса
    const token = validate.queryText(req.query.token); // получение токена из ссылки
    const file = await services.files.download(id, token); // получение файла с проверкой доступа:
    // подпись и срок действия токена;
    // что токен имеет назначение "file";
    // что он выдан именно для запрошенного файла;
    // что пользователь, указанный в токене, всё ещё имеет право получить файл
    res.setHeader("Content-Type", file.mime); // Content-Type сообщает клиенту, что именно сервер отправляет (jpeg, png, pdf...)
    res.setHeader("Cache-Control", "private, no-store"); // Сервер сообщает, что ответ содержит персональные данные и его не следует сохранять в кеше
    let disposition = "attachment"; // поведение файла по умолчанию - attachement
    if (file.mime.startsWith("image/")) disposition = "inline"; // если файл является изображением, поведение файла - inline
    res.setHeader("Content-Disposition", `${disposition}; filename*=UTF-8''${encodeURIComponent(file.name)}`); // передача способа обработки и имени файла
    res.send(Buffer.from(file.data)); // отправка данных файла клиенту
  });
  return router;
}
