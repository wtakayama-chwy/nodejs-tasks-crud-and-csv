import { IncomingMessage } from "node:http";

export type CoreRequest = IncomingMessage & {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: Record<string, string> | null;
};
