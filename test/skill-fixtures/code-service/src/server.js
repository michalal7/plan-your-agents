import { createServer } from "node:http";
import { planRoute } from "./planner.js";

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/plan") {
    res.writeHead(404).end();
    return;
  }
  const body = JSON.parse(await new Response(req).text());
  const route = planRoute(body.stops, body.startAt);
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(route));
});

server.listen(process.env.PORT ?? 8080);
