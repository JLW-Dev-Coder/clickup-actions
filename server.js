const express = require("express");

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

const events = [];
const MAX_EVENTS = 100;

function addEvent(req) {
  const item = {
    body: req.body ?? null,
    headers: req.headers ?? null,
    method: req.method,
    query: req.query ?? null,
    ts: new Date().toISOString(),
    url: req.originalUrl
  };

  events.unshift(item);
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
}

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.get("/events", (req, res) => {
  res.json({ count: events.length, events });
});

app.post("/webhook", (req, res) => {
  addEvent(req);
  res.json({ ok: true });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => {
  console.log(`Listening on ${port}`);
});
