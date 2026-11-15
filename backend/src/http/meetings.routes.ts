import { Router } from "express";
import { Services } from "../services";
import { requireAuth, userId } from "./auth";
import { limit } from "./rate-limit";
import * as validate from "./validation";

export function meetingsRoutes(services: Services) {
  const router = Router();
  const meetings = services.meetings;
  const realtime = services.realtime;
  const authenticate = requireAuth(services.auth);

  // получение списка встреч текущего пользователя
  router.get("/", limit(), authenticate, async function (req, res) {
    res.json(await meetings.list(userId(req)));
  });
  // создание новой встречи
  router.post("/", limit(), authenticate, async function (req, res) {
    const input = validate.meeting(req.body);
    res.status(201).json(await meetings.create(userId(req), input));
  });
  // получение рекомендаций для встречи (просто возвращает подборку)
  router.get("/:id/recommendations", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id); // валидация идентификатора встречи
    const filters = validate.filters(req.query); // проверка фильтров из адреса
    res.json(await services.discovery.list(userId(req), id, filters)); // отображение ресторанов с учётом параметров встречи, фильтров, предпочтений участников
  });
  // применение рекомендаций для встречи (добавляет рестораны в встречу)
  router.post("/:id/recommendations/apply", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await services.discovery.apply(userId(req), id, validate.filters(req.query)); // обновление рекомендаций встречи для текущего пользователя с учётом фильтров из запроса
    if (result.changed) await realtime.changed(id); // если варианты изменились, уведомить всех участников встречи
    res.status(201).json(result);
  });
  // редактирование встречи (частичное обновление)
  router.patch("/:id", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.edit(userId(req), id, validate.meeting(req.body));
    await realtime.changed(id); // обновление данных встречи для всех участников
    res.json(result);
  });
  // обновление предпочтений встречи
  router.put("/:id/preferences", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.preferences(userId(req), id, validate.preferences(req.body));
    await realtime.changed(id);
    res.json(result);
  });
  // добавление заведения в встречу
  router.post("/:id/candidates", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.propose(userId(req), id, validate.restaurantId(req.body));
    await realtime.changed(id);
    res.status(201).json(result);
  });
  // голосование за заведение
  router.put("/:id/vote", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.vote(userId(req), id, validate.restaurantId(req.body));
    await realtime.changed(id);
    res.json(result);
  });
  // удаление заведения из встречи
  router.delete("/:id/candidates/:restaurantId", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const restaurant = validate.uuid(req.params.restaurantId, "restaurantId");
    const result = await meetings.removeCandidate(userId(req), id, restaurant);
    await realtime.changed(id);
    res.json(result);
  });
  // выбор заведения для встречи (фиксирование результатов голосования)
  router.post("/:id/select", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.select(userId(req), id);
    await realtime.changed(id);
    res.status(201).json(result);
  });
  // бронирование ресторана для встречи (фиксирование брони)
  router.post("/:id/booking", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.booking(userId(req), id, validate.restaurantId(req.body));
    await realtime.changed(id);
    res.status(201).json(result);
  });
  // отмена бронирования ресторана для встречи
  router.delete("/:id/booking", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.booking(userId(req), id, "", true);
    await realtime.changed(id);
    res.json(result);
  });
  // добавление участника в встречу
  router.post("/:id/members", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.addMember(userId(req), id, validate.memberEmail(req.body));
    await realtime.changed(id);
    res.status(201).json(result);
  });
  // удаление участника из встречи
  router.delete("/:id/members/:target", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const target = validate.uuid(req.params.target, "target"); // пользователь, которого удаляют
    const result = await meetings.removeMember(userId(req), id, target); // userId - пользователь, который выполняет удаление
    await realtime.changed(id, target);
    res.json(result);
  });
  // создание приглашения участника во встречу (через ссылку)
  // подготовка приглашения - маршрут не отправляет письмо или сообщение другому человеку
  router.post("/:id/invitations", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    res.status(201).json(await meetings.invite(userId(req), id));
  });
  // принятие приглашения в встречу
  router.post("/invitations/accept", limit(), authenticate, async function (req, res) {
    // validate.invitation проверяет формат переданного токена
    // meetings.accept проверяет само приглашение и добавляет пользователя во встречу
    const result = await meetings.accept(userId(req), validate.invitation(req.body));
    // обновление данных встречи для всех участников
    await realtime.changed(result.meetingId);
    res.status(201).json(result);
  });
  // экспорт встречи в календарь
  router.get("/:id/calendar.ics", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const text = await services.calendar.export(userId(req), id); // проверяет доступ и настройку экспорта, создаёт текст календарного файла
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="meetly-${id}.ics"`); // получение ответа в виде скачиваемого файла с указанным именем
    res.send(text); // отправка содержимого файла
  });
  return router;
}
