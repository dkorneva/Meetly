import { Router } from "express";
import { Services } from "../services";
import { requireAuth, userId } from "./auth";
import { limit } from "./rate-limit";
import * as validate from "./validation";

export function chatRoutes(services: Services) {
  const router = Router({ mergeParams: true });
  const authenticate = requireAuth(services.auth);
  router.get("/", limit(), authenticate, async function (req, res) {
    const meetingId = validate.uuid(req.params.meetingId, "meetingId");
    let before: string | undefined;
    if (req.query.before !== undefined) before = validate.queryText(req.query.before);
    res.json(await services.chat.list(userId(req), meetingId, before));
  });
  router.post("/", limit(), authenticate, async function (req, res) {
    const meetingId = validate.uuid(req.params.meetingId, "meetingId");
    const result = await services.chat.send(userId(req), meetingId, validate.message(req.body));
    await services.realtime.changed(meetingId);
    res.status(201).json(result);
  });
  router.put("/:id/reaction", limit(), authenticate, async function (req, res) {
    const meetingId = validate.uuid(req.params.meetingId, "meetingId");
    const id = validate.uuid(req.params.id);
    const result = await services.chat.react(userId(req), meetingId, id, validate.reaction(req.body));
    await services.realtime.changed(meetingId);
    res.json(result);
  });
  return router;
}
