const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const { initializeDatabase } = require("../src/data/repository");

test.before(async () => {
  await initializeDatabase();
});

async function loginAs(username, password) {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ username, password })
    .expect(200);

  return response.body.token;
}

test("health endpoint is public", async () => {
  const response = await request(app).get("/api/health").expect(200);
  assert.equal(response.body.status, "ok");
});

test("login returns bearer token", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ username: "admin", password: "admin@123" })
    .expect(200);

  assert.ok(response.body.token);
  assert.equal(response.body.user.role, "security_admin");
});

test("security admin can create another security admin", async () => {
  const token = await loginAs("admin", "admin@123");

  const response = await request(app)
    .post("/api/auth/security-admins")
    .set("Authorization", `Bearer ${token}`)
    .send({
      username: "admin2",
      password: "admin2@123",
      fullName: "Secondary Security Admin",
    })
    .expect(201);

  assert.equal(response.body.data.username, "admin2");
  assert.equal(response.body.data.role, "security_admin");

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({ username: "admin2", password: "admin2@123" })
    .expect(200);

  assert.equal(loginResponse.body.user.role, "security_admin");
});

test("protected route requires token", async () => {
  await request(app).get("/api/assets").expect(401);
});

test("scan flow creates scan and report", async () => {
  const token = await loginAs("checker", "checker123");

  const scanResponse = await request(app)
    .post("/api/scans/run")
    .set("Authorization", `Bearer ${token}`)
    .send({})
    .expect(201);

  assert.ok(scanResponse.body.data.id);
  assert.ok(scanResponse.body.data.assetCount > 0);

  const reportResponse = await request(app)
    .get("/api/reports/latest")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(reportResponse.body.data.id, scanResponse.body.data.id);
});

test("csv export works", async () => {
  const token = await loginAs("checker", "checker123");

  await request(app)
    .post("/api/scans/run")
    .set("Authorization", `Bearer ${token}`)
    .send({})
    .expect(201);

  const exportResponse = await request(app)
    .get("/api/reports/export?format=csv")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.match(exportResponse.headers["content-type"], /text\/csv/);
  assert.match(exportResponse.text, /assetId/);
});
