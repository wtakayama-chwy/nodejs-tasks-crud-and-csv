import { ServerResponse } from "node:http";
import { buildRoutePath } from "./utils/build-route-path";
import { CoreRequest } from "./types/core";
import { randomUUID } from "node:crypto";
import { Database, Task } from "./database";
import { json } from "./middlewares/json";
import { csvHelper } from "./middlewares/csvHelper";

type Route = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: RegExp;
  handler: (req: CoreRequest, res: ServerResponse) => void;
};

const CreateRequiredTaskAttributes: (keyof Pick<
  Task,
  "title" | "description"
>)[] = ["description", "title"];
const UpdateRequiredTaskAttributes: (keyof Pick<
  Task,
  "title" | "description" | "completed_at"
>)[] = ["description", "title", "completed_at"];

const database = new Database();

export const routes: Route[] = [
  {
    method: "GET",
    path: buildRoutePath("/tasks"),
    handler: async (req, res) => {
      await json(req, res);
      const { search } = req.query ?? {};

      const tasks = database.selectAll(
        "tasks",
        search ? { title: search, description: search } : undefined
      );

      res.end(JSON.stringify(tasks));
    },
  },
  {
    method: "POST",
    path: buildRoutePath("/tasks"),
    handler: async (req, res) => {
      await json(req, res);
      const { body } = req;

      const keys = Object.keys(body ?? {});

      if (!keys) {
        return res.writeHead(422).end("Missing body request");
      }

      const missingKeys = CreateRequiredTaskAttributes.filter(
        (requiredKey) => !keys?.includes(requiredKey)
      );
      if (missingKeys?.length > 0) {
        return res
          .writeHead(422)
          .end(`Missing the following required keys: ${missingKeys}`);
      }

      const task: Task = {
        id: randomUUID(),
        ...(body as Omit<Task, "id">),
        completed_at: body?.completed_at || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      database.insert("tasks", task);

      return res.writeHead(201).end();
    },
  },
  {
    method: "DELETE",
    path: buildRoutePath("/tasks/:id"),
    handler: async (req, res) => {
      await json(req, res);
      const { id } = req.params ?? {};

      if (!id) {
        return res.writeHead(422).end("Missing id");
      }
      try {
        database.delete("tasks", id);
        return res.writeHead(204).end();
      } catch (err) {
        return res.writeHead(422).end((err as any).message);
      }
    },
  },
  {
    method: "PUT",
    path: buildRoutePath("/tasks/:id"),
    handler: async (req, res) => {
      await json(req, res);
      const { id } = req.params ?? {};
      const { body } = req;

      if (!id) {
        return res.writeHead(422).end("Missing id");
      }

      const keys = Object.keys(body ?? {});

      if (!keys) {
        return res.writeHead(422).end("Missing body request");
      }

      const missingKeys = UpdateRequiredTaskAttributes.filter(
        (requiredKey) => !keys?.includes(requiredKey)
      );

      if (missingKeys?.length > 0) {
        return res
          .writeHead(422)
          .end(`Missing the following required keys: ${missingKeys}`);
      }

      try {
        const updatedTask = {
          ...(body as Omit<Task, "id">),
          updated_at: new Date().toISOString(),
        };
        database.update("tasks", id, updatedTask);
        return res.writeHead(204).end();
      } catch (err) {
        return res.writeHead(422).end((err as any).message);
      }
    },
  },
  {
    method: "PATCH",
    path: buildRoutePath("/tasks/:id"),
    handler: async (req, res) => {
      await json(req, res);
      const { id } = req.params ?? {};
      const { body } = req;

      if (!id) {
        return res.writeHead(422).end("Missing id");
      }

      const keys = Object.keys(body ?? {});

      if (!keys) {
        return res.writeHead(422).end("Missing body request");
      }

      const hasMissingKeys = keys.some(
        (key) => !UpdateRequiredTaskAttributes.includes(key as any)
      );

      if (hasMissingKeys) {
        return res.writeHead(422).end("Missing valid keys");
      }

      try {
        const updatedTask = {
          ...(body as Omit<Partial<Task>, "id">),
          updated_at: new Date().toISOString(),
        };
        database.partialUpdate("tasks", id, updatedTask);
        return res.writeHead(204).end();
      } catch (err) {
        return res.writeHead(422).end((err as any).message);
      }
    },
  },
  {
    method: "POST",
    path: buildRoutePath("/tasks/import"),
    handler: async (req, res) => {
      const onSave = async (records: any[]) => {
        for (const record of records) {
          await fetch(
            `http://${process.env.HOSTNAME}:${process.env.PORT}/tasks`,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ...record, id: randomUUID() }),
            }
          );
        }
      };
      try {
        await csvHelper(req, res, onSave);
        return res.writeHead(201).end("CSV file successfully uploaded");
      } catch (err) {
        return res.writeHead(422).end((err as any).message);
      }
    },
  },
];
