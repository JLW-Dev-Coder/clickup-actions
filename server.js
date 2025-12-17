const express = require("express");

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

/* ===============================
   CLICKUP CONFIG (HARDCODED)
   =============================== */

const CLICKUP_LIST_ID = "901707697028";
const CLICKUP_API_TOKEN = "pk_10505295_ZC75CTDUUIOTP9EL8G1AW5YM5QURDSZM";

/* ===============================
   IN-MEMORY EVENT LOG
   =============================== */

const events = [];
const MAX_EVENTS = 100;

function logEvent(req) {
  const entry = {
    ts: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    body: req.body
  };
  events.unshift(entry);
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
}

/* ===============================
   JOURNEY DEFINITION
   =============================== */

function journeySteps() {
  return [
    {
      name: "SuiteDash form submitted ➡ User account created",
      description:
        "Pro Tip\nTreat this as the anchor record. Everything downstream should reference this moment.",
      tag: "🌱 Lead Development"
    },
    {
      name: "Portal access provisioned ➡ User invited to engage",
      description:
        "Pro Tip\nAccess without guidance creates friction. Pair every invite with a clear orientation trigger.",
      tag: "🤝 Prospect Engagement"
    },
    {
      name: "Engagement prompted ➡ Next action presented",
      description:
        "Pro Tip\nPresent one clear next step. Multiple options reduce movement and stall the journey.",
      tag: "🤝 Prospect Engagement"
    },
    {
      name: "Qualification completed ➡ User intent confirmed",
      description:
        "Pro Tip\nQualification is about fit, not pressure. Confirm intent before committing resources.",
      tag: "🔄 Client Experience & Review Loop"
    },
    {
      name: "Experience checkpoint ➡ Progress reviewed",
      description:
        "Pro Tip\nUse checkpoints to validate alignment early. Silence here usually signals confusion, not disinterest.",
      tag: "🔄 Client Experience & Review Loop"
    },
    {
      name: "Request submitted ➡ Work formally initiated",
      description:
        "Pro Tip\nDo not start work without a structured request. Scope clarity protects delivery timelines.",
      tag: "🛠️ Service Delivery & Plan Management"
    },
    {
      name: "Service routed ➡ Work assigned and tracked",
      description:
        "Pro Tip\nRouting should be rule-based. Manual assignment is where bottlenecks begin.",
      tag: "🛠️ Service Delivery & Plan Management"
    },
    {
      name: "Work delivered ➡ Service completed",
      description:
        "Pro Tip\nCompletion is a signal, not the end. Always trigger the next lifecycle action immediately.",
      tag: "🛠️ Service Delivery & Plan Management"
    },
    {
      name: "Outcome recorded ➡ Next path determined",
      description:
        "Pro Tip\nLog outcomes immediately. This is where renewals, upsells, or support paths are decided—don’t delay it.",
      tag: "🧭 Lifecycle Outcomes"
    },
    {
      name: "Journey closed ➡ Exit or archive applied",
      description:
        "Pro Tip\nAlways close the loop. An intentional exit keeps your system clean and your reporting accurate.",
      tag: "🧭 Lifecycle Outcomes"
    }
  ];
}

/* ===============================
   DATE SEQUENCING (REALISTIC)
   =============================== */

function buildSchedule() {
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  const start = Math.ceil(Date.now() / (15 * 60 * 1000)) * (15 * 60 * 1000);

  return [
    { start, due: start + 2 * hour },
    { start: start + 1 * hour, due: start + 6 * hour },
    { start: start + 2 * hour, due: start + 8 * hour },
    { start: start + 1 * day, due: start + 1 * day + 6 * hour },
    { start: start + 1 * day + 2 * hour, due: start + 1 * day + 8 * hour },
    { start: start + 3 * day, due: start + 3 * day + 6 * hour },
    { start: start + 3 * day + 1 * hour, due: start + 3 * day + 8 * hour },
    { start: start + 5 * day, due: start + 5 * day + 8 * hour },
    { start: start + 7 * day, due: start + 7 * day + 6 * hour },
    { start: start + 10 * day, due: start + 10 * day + 6 * hour }
  ];
}

/* ===============================
   CLICKUP TASK CREATION
   =============================== */

async function createTask(step, schedule) {
  const res = await fetch(
    `https://api.clickup.com/api/v2/list/${CLICKUP_LIST_ID}/task`,
    {
      method: "POST",
      headers: {
        Authorization: CLICKUP_API_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: step.name,
        description: step.description,
        start_date: schedule.start,
        due_date: schedule.due,
        tags: [step.tag]
      })
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}

/* ===============================
   ROUTES
   =============================== */

app.get("/", (_, res) => {
  res.send("OK");
});

app.get("/events", (_, res) => {
  res.json({ count: events.length, events });
});

app.post("/journey", async (req, res) => {
  try {
    const steps = journeySteps();
    const schedule = buildSchedule();

    const created = [];

    for (let i = 0; i < steps.length; i++) {
      const task = await createTask(steps[i], schedule[i]);
      created.push({ id: task.id, name: task.name });
    }

    res.json({ ok: true, created_count: created.length, created });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/webhook", (req, res) => {
  logEvent(req);
  res.json({ ok: true });
});

/* ===============================
   START SERVER
   =============================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Listening on ${PORT}`);
});
