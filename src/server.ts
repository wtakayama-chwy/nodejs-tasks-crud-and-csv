import http, { ServerResponse } from "node:http";
import { json } from "./middlewares/json";
import { routes } from "./routes";
import { extractQueryParams } from "./utils/extract-query-params";
import { CoreRequest } from "./types/core";

const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME as string;

const server = http.createServer(
  async (req: CoreRequest, res: ServerResponse) => {
    const { method, url } = req;

    const route = routes.find(
      (route) => route.method === method && route.path.test(url ?? "")
    );

    if (route) {
      const routeParams = url?.match(route.path);

      const groups = routeParams?.groups as Record<string, string> & {
        query: string;
      };
      const { query, ...params } = groups;

      req.params = params;
      req.query = query ? extractQueryParams(query) : {};

      return route.handler(req, res);
    }

    return res.writeHead(404).end();
  }
);

server.listen(port, hostname, () => {
  console.log(`Server is running at: http://${hostname}:${port}/`);
});
