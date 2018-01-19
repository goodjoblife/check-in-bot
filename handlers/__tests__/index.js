const { ContextSimulator } = require("bottender-context-simulator");
const { createEventHandler } = require("../");

function setup() {
  const db = {
    collection: jest.fn(() => ({ insertOne: jest.fn() })),
  };

  const handler = createEventHandler(db);

  return handler;
}

const simulator = new ContextSimulator({
  platform: "messenger",
});

describe("上班", () => {
  it("user send quick reply", async () => {
    const handler = setup();

    const context = simulator.createQuickReplyContext("做功德", "CHECK_IN", {
      state: { seenTutorial: true, isWorking: false },
    });

    await handler(context);

    // handled
    expect(context.sendText).toBeCalled();

    // state changed
    expect(context.state).toEqual(
      expect.objectContaining({
        isWorking: true,
        startTime: expect.any(Date),
      })
    );
  });

  it("user send text", async () => {
    const handler = setup();

    const context = simulator.createTextContext("做功德", {
      state: { seenTutorial: true, isWorking: false },
    });

    await handler(context);

    // handled
    expect(context.sendText).toBeCalled();

    // state changed
    expect(context.state).toEqual(
      expect.objectContaining({
        isWorking: true,
        startTime: expect.any(Date),
      })
    );
  });
});
