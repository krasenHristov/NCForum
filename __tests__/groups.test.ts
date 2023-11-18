import supertest from "supertest";
import app from "../app";
import * as db from "../db/index";
import { Server } from "http";

let server: Server;
let token: string;
beforeAll(async () => {
  server = app.listen(0);
  await db.query("BEGIN", []);

  const register = await supertest(app).post("/signup").send({
    username: "tester",
    email: "test@test2.test",
    password: "password1@",
  });

  const auth = await supertest(app).post("/signin").send({
    email: "test@test2.test",
    password: "password1@",
  });

  token = auth.body.token;
});

afterAll(async () => {
  await db.query("ROLLBACK", []);
  server.close();
  db.pool.end();
});

describe('create group', () => {
  it('POST 201: Should create a new group', async () => {
    const res = await supertest(app)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({
        group_name: "new test group",
        description: "new test group description",
        user_id: 1
      })

    expect(res.statusCode).toBe(201)
    expect(res.body.group.group_name).toBe("new test group")
    expect(res.body.group.description).toBe("new test group description")
  })

  it('POST 409: Should return an error when user is not authorized', async() => {
     const res = await supertest(app)
      .post("/groups")
      .send({
        group_name: "new test group",
        description: "new test group description",
        user_id: 1
      })

    expect(res.statusCode).toBe(401)
    expect(res.body.msg).toBe("You need to be logged in")
  })

  it('POST 400: Should return an error when group name is missing', async () => {
    const res = await supertest(app)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "new test group description",
        user_id: 1
      })

    expect(res.statusCode).toBe(400)
    expect(res.body.msg).toBe("Group name can not be empty")
  })

  it('POST 400: Should return an error when group name is empty', async () => {
    const res = await supertest(app)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({
        group_name: "",
        description: "new test group description",
        user_id: 1
      })

    expect(res.statusCode).toBe(400)
    expect(res.body.msg).toBe("Group name can not be empty")
  })

  it('POST 400: Should return an error when description is missing', async () => {
    const res = await supertest(app)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({
        group_name: "test group name",
        user_id: 1
      })

    expect(res.statusCode).toBe(400)
    expect(res.body.msg).toBe("Group description can not be empty")
  })

  it('POST 400: Should return an error when description is empty', async () => {
    const res = await supertest(app)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({
        group_name: "test group name",
        description: "",
        user_id: 1
      })

    expect(res.statusCode).toBe(400)
    expect(res.body.msg).toBe("Group description can not be empty")
  })

  it('POST 400: Should return an error when description is too short', async () => {
    const res = await supertest(app)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({
        group_name: "test group name",
        description: "test",
        user_id: 1
      })

    expect(res.statusCode).toBe(400)
    expect(res.body.msg).toBe("Group description needs to be at least 10 characters long")
  })

  it('POST 400: Should return an error when user ID is not found', async () => {
    const res = await supertest(app)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({
        group_name: "test group name",
        description: "test group description",
        user_id: 142
      })

    expect(res.statusCode).toBe(400)
    expect(res.body.msg).toBe("ID not found")
  })
})
