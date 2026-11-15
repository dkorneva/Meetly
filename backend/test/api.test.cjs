require("dotenv/config");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../dist/main");
test("Настоящий HTTP API и SQL Server: аккаунты, права, встреча, голоса, чат, файлы, ICS, бронь", async () => {
  const app = await createApp();
  await app.listen(0, "127.0.0.1");
  const db = app.services.db;
  const http = request(app.server);
  const sockets = [];
  const suffix = Date.now();
  const emails = [
    `owner-${suffix}@example.test`,
    `member-${suffix}@example.test`,
    `outsider-${suffix}@example.test`,
  ];
  let meetingId;
  let restaurantId;
  const userIds = [];
  try {
    const users = [];
    for (const email of emails) {
      const res = await http
        .post("/api/auth/register")
        .send({
          name: "Тестовый Пользователь",
          email,
          password: "StrongPass123!",
        })
        .expect(201);
      users.push(res.body);
      const me = await http
        .get("/api/users/me")
        .auth(res.body.accessToken, { type: "bearer" })
        .expect(200);
      userIds.push(me.body.id);
      assert.equal(me.body.passwordHash, undefined);
    }
    const [owner, member, outsider] = users;
    const auth = (r, u = owner) => r.auth(u.accessToken, { type: "bearer" });
    const { io } = require("socket.io-client");
    const { once } = require("node:events");
    const endpoint = `http://127.0.0.1:${app.server.address().port}`;
    for (const user of [owner, outsider]) {
      const s = io(endpoint, {
        auth: { token: user.accessToken },
        transports: ["websocket"],
        reconnection: false,
      });
      sockets.push(s);
      await once(s, "connect", { signal: AbortSignal.timeout(5000) });
    }
    let outsiderEvents = 0;
    sockets[1].on("meeting.changed", () => outsiderEvents++);
    await http
      .post("/api/auth/login")
      .send({ email: emails[0], password: "wrong" })
      .expect(401);
    await http.get("/api/meetings").expect(401);
    await auth(http.post("/api/meetings")).send({ title: "wrong" }).expect(400);
    const input = {
      title: "Проверка API",
      date: new Date(Date.now()+7*86400000).toISOString().slice(0,10),
      time: "19:00",
      budget: 1500,
      cuisines: ["Русская"],
      city: "Москва",
      format: "В помещении",
    };
    const m = await auth(http.post("/api/meetings")).send(input).expect(201);
    meetingId = m.body.id;
    await auth(
      http.get(`/api/meetings/${meetingId}/messages`),
      outsider,
    ).expect(403);
    await auth(http.post(`/api/meetings/${meetingId}/members`))
      .send({ email: emails[1] })
      .expect(201);
    await auth(http.patch(`/api/meetings/${meetingId}`), member)
      .send(input)
      .expect(403);
    const restaurant = await db.restaurant.create({
      data: {
        name: "Изолированный тестовый ресторан",
        address: "Тестовый адрес",
        city: "Москва",
        district: "Центр",
        latitude: 55.75,
        longitude: 37.61,
        cuisine: "Русская",
        price: 1200,
        createdBy: userIds[0],
      },
    });
    restaurantId = restaurant.id;
    await auth(http.delete(`/api/meetings/${meetingId}/candidates/${restaurantId}`), member).expect(403);
    await auth(http.delete(`/api/meetings/${meetingId}/candidates/${restaurantId}`), outsider).expect(403);
    await db.restaurant.update({where:{id:restaurantId},data:{catalogArea:"garden-ring"}});
    await auth(http.post(`/api/meetings/${meetingId}/candidates`))
      .send({ restaurantId })
      .expect(201);
    await auth(http.put(`/api/meetings/${meetingId}/vote`))
      .send({ restaurantId })
      .expect(200);
    await auth(http.put(`/api/meetings/${meetingId}/vote`))
      .send({ restaurantId })
      .expect(200);
    assert.equal(
      await db.vote.count({ where: { meetingId, userId: userIds[0] } }),
      1,
    );
    await auth(http.put(`/api/meetings/${meetingId}/vote`), outsider)
      .send({ restaurantId })
      .expect(403);
    const event = once(sockets[0], "meeting.changed", {
      signal: AbortSignal.timeout(5000),
    });
    const msg = await auth(
      http.post(`/api/meetings/${meetingId}/messages`),
      member,
    )
      .send({ text: "Привет" })
      .expect(201);
    assert.equal((await event)[0].meetingId, meetingId);
    assert.equal(outsiderEvents, 0);
    await auth(
      http.put(`/api/meetings/${meetingId}/messages/${msg.body.id}/reaction`),
    )
      .send({ liked: true })
      .expect(200);
    await auth(
      http.put(`/api/meetings/${meetingId}/messages/${msg.body.id}/reaction`),
    )
      .send({ liked: true })
      .expect(200);
    assert.equal(
      await db.reaction.count({ where: { messageId: msg.body.id } }),
      1,
    );
    const file = await auth(http.post("/api/files"))
      .field("meetingId", meetingId)
      .attach("file", Buffer.from("Файл"), "note.txt")
      .expect(201);
    await auth(http.post(`/api/meetings/${meetingId}/messages`))
      .send({ text: "Вложение", fileId: file.body.id })
      .expect(201);
    const fileUrl = new URL(file.body.url);
    await http.get(fileUrl.pathname + fileUrl.search).expect(200);
    const invite = await auth(
      http.post(`/api/meetings/${meetingId}/invitations`),
    )
      .send({})
      .expect(201);
    await auth(http.post("/api/meetings/invitations/accept"), outsider)
      .send({ token: invite.body.token })
      .expect(201);
    await auth(
      http.delete(`/api/meetings/${meetingId}/members/${userIds[2]}`),
    ).expect(200);
    await auth(
      http.get(`/api/meetings/${meetingId}/messages`),
      outsider,
    ).expect(403);
    const ics = await auth(
      http.get(`/api/meetings/${meetingId}/calendar.ics`),
    ).expect(200);
    assert.ok(ics.text.includes("BEGIN:VEVENT"));
    const expectedStart = new Date(`${input.date}T${input.time}:00+03:00`).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    assert.ok(ics.text.includes(`DTSTART:${expectedStart}`));
    await auth(http.post(`/api/meetings/${meetingId}/select`), member)
      .send({})
      .expect(403);
    await auth(http.post(`/api/meetings/${meetingId}/select`))
      .send({})
      .expect(201);
    const selectedMessages=(await auth(http.get(`/api/meetings/${meetingId}/messages`)).expect(200)).body.items.filter(m=>m.kind==='selected');
    assert.equal(selectedMessages.length,1);
    assert.ok(selectedMessages[0].text.includes('Изолированный тестовый ресторан'));
    const chatSummaries=(await auth(http.get('/api/meetings')).expect(200)).body;
    assert.equal(chatSummaries.find(m=>m.id===meetingId).lastMessage.kind,'selected');
    await auth(http.delete(`/api/meetings/${meetingId}/candidates/${restaurantId}`)).expect(409);
    await auth(http.put(`/api/meetings/${meetingId}/vote`), member)
      .send({ restaurantId })
      .expect(409);
    await auth(http.post(`/api/meetings/${meetingId}/booking`))
      .send({ restaurantId })
      .expect(201);
    assert.equal(
      (await db.meeting.findUnique({ where: { id: meetingId } })).status,
      "completed",
    );
    await auth(http.delete(`/api/meetings/${meetingId}/booking`)).expect(200);
    const refreshed = await http
      .post("/api/auth/refresh")
      .send({ refreshToken: owner.refreshToken })
      .expect(201);
    await http
      .post("/api/auth/refresh")
      .send({ refreshToken: owner.refreshToken })
      .expect(401);
    await http
      .post("/api/auth/logout")
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(201);
    await http
      .post("/api/auth/refresh")
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(401);
  } finally {
    for (const socket of sockets) socket.disconnect();
    if (meetingId) {
      await db.reaction.deleteMany({ where: { message: { meetingId } } });
      await db.message.deleteMany({ where: { meetingId } });
      await db.file.deleteMany({ where: { meetingId } });
      await db.vote.deleteMany({ where: { meetingId } });
      await db.candidate.deleteMany({ where: { meetingId } });
      await db.invitation.deleteMany({ where: { meetingId } });
      await db.member.deleteMany({ where: { meetingId } });
      await db.meeting.deleteMany({ where: { id: meetingId } });
    }
    if (restaurantId)
      await db.restaurant.deleteMany({ where: { id: restaurantId } });
    await db.session.deleteMany({ where: { userId: { in: userIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  }
});
