const request = require("supertest");
var cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");
let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Todo test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => { });
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });
  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Updates a todo with the given ID as complete / incomplete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    await agent.post("/todos").send({
      title: "Buy ps3",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.duetodaytodolist.length;
    const latestTodo = parsedGroupedResponse.duetodaytodolist[dueTodayCount - 1];
    let completedstatus=true;
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);
    var response=await agent.put(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
      completed: completedstatus,
    });
    console.log(response.text);
    var newparsedUpdateResponse=JSON.parse(response.text);
    expect(newparsedUpdateResponse.completed).toBe(true);
    completedstatus=false;
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);
    var response1=await agent.put(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
      completed: completedstatus,
    });
    console.log(response.text);
    var newparsedUpdateResponse1=JSON.parse(response1.text);
    expect(newparsedUpdateResponse1.completed).toBe(false);
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    // FILL IN YOUR CODE HERE
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy xbox",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    await agent.post("/todos").send({
      title: "Buy grocery",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    await agent.post("/todos").send({
      title: "Do shopping",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.duetodaytodolist.length;
    const latestTodo = parsedGroupedResponse.duetodaytodolist[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);
    const deletedResponse = await agent.delete(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });

    const deletestatus = JSON.parse(deletedResponse.text);

    deletestatus
      ? expect(deletestatus).toBe(true)
      : expect(deletestatus).toBe(false);
  });
});

