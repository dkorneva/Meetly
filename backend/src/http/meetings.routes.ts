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

  router.get("/", limit(), authenticate, async function (req, res) {
    res.json(await meetings.list(userId(req)));
  });
  router.post("/", limit(), authenticate, async function (req, res) {
    const input = validate.meeting(req.body);
    res.status(201).json(await meetings.create(userId(req), input));
  });
  router.get("/:id/recommendations", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const filters = validate.filters(req.query);
    res.json(await services.discovery.list(userId(req), id, filters));
  });
  router.post("/:id/recommendations/apply", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await services.discovery.apply(userId(req), id, validate.filters(req.query));
    if (result.changed) await realtime.changed(id);
    res.status(201).json(result);
  });
  router.patch("/:id", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.edit(userId(req), id, validate.meeting(req.body));
    await realtime.changed(id);
    res.json(result);
  });
  router.put("/:id/preferences", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.preferences(userId(req), id, validate.preferences(req.body));
    await realtime.changed(id);
    res.json(result);
  });
  router.post("/:id/candidates", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.propose(userId(req), id, validate.restaurantId(req.body));
    await realtime.changed(id);
    res.status(201).json(result);
  });
  router.put("/:id/vote", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.vote(userId(req), id, validate.restaurantId(req.body));
    await realtime.changed(id);
    res.json(result);
  });
  router.delete("/:id/candidates/:restaurantId", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const restaurant = validate.uuid(req.params.restaurantId, "restaurantId");
    const result = await meetings.removeCandidate(userId(req), id, restaurant);
    await realtime.changed(id);
    res.json(result);
  });
  router.post("/:id/select", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.select(userId(req), id);
    await realtime.changed(id);
    res.status(201).json(result);
  });
  router.post("/:id/booking", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.booking(userId(req), id, validate.restaurantId(req.body));
    await realtime.changed(id);
    res.status(201).json(result);
  });
  router.delete("/:id/booking", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.booking(userId(req), id, "", true);
    await realtime.changed(id);
    res.json(result);
  });
  router.post("/:id/members", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const result = await meetings.addMember(userId(req), id, validate.memberEmail(req.body));
    await realtime.changed(id);
    res.status(201).json(result);
  });
  router.delete("/:id/members/:target", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const target = validate.uuid(req.params.target, "target");
    const result = await meetings.removeMember(userId(req), id, target);
    await realtime.changed(id, target);
    res.json(result);
  });
  router.post("/:id/invitations", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    res.status(201).json(await meetings.invite(userId(req), id));
  });
  router.post("/invitations/accept", limit(), authenticate, async function (req, res) {
    const result = await meetings.accept(userId(req), validate.invitation(req.body));
    await realtime.changed(result.meetingId);
    res.status(201).json(result);
  });
  router.get("/:id/calendar.ics", limit(), authenticate, async function (req, res) {
    const id = validate.uuid(req.params.id);
    const text = await services.calendar.export(userId(req), id);
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="meetly-${id}.ics"`);
    res.send(text);
  });
  return router;
}
