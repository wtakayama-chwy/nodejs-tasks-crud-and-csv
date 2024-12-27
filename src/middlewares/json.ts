import { ServerResponse } from "node:http";
import { CoreRequest } from "../types/core";

export async function json(req: CoreRequest, res: ServerResponse) {
  const buffers = [];

  for await (const chunk of req) {
    buffers.push(chunk);
  }

  try {
    req.body = JSON.parse(Buffer.concat(buffers).toString());
  } catch (err) {
    req.body = null;
  }

  res.setHeader("Content-type", "application/json");
}
