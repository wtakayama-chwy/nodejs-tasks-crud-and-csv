import fs from "node:fs/promises";
import path from "node:path";

type DataId = {
  id: string;
};

export type Task = DataId & {
  title: string;
  description: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type DatabaseType = {
  tasks: Task[];
  users: any[];
};

const databasePath = `${path.dirname(__dirname)}/db.json`;

export class Database {
  #database: DatabaseType = {
    tasks: [],
    // workaround to make Typescript work with Generic
    users: [],
  };

  constructor() {
    fs.readFile(databasePath, {
      encoding: "utf8",
    })
      .then((data) => {
        this.#database = JSON.parse(data);
      })
      .catch(() => {
        this.#persist();
      });
  }

  #persist() {
    fs.writeFile(databasePath, JSON.stringify(this.#database));
  }

  selectAll<T extends keyof DatabaseType>(
    table: T,
    search?: Partial<Record<keyof DatabaseType[T][0], string>>
  ) {
    let data = this.#database[table] ?? [];

    if (search) {
      data = data.filter((row: DatabaseType[T]) =>
        Object.entries(search).some(
          ([key, value]) =>
            value &&
            (row[key as keyof DatabaseType[T]] as string)
              ?.toLowerCase()
              .includes(value.toLowerCase())
        )
      );
    }

    return data;
  }

  insert<T extends keyof DatabaseType>(table: T, data: DatabaseType[T][0]) {
    if (Array.isArray(this.#database[table])) {
      this.#database[table].push(data);
    } else {
      this.#database[table] = [data];
    }

    this.#persist();
  }

  update<T extends keyof DatabaseType>(
    table: T,
    id: string,
    data: Omit<DatabaseType[T][0], "id">
  ) {
    const rows = this.#database[table] ?? [];
    const index = rows.findIndex((row) => row.id === id);

    if (index > -1) {
      this.#database[table][index] = {
        id,
        ...this.#database[table][index],
        ...data,
      };
      this.#persist();
    } else {
      throw new Error("No data was found for passed id");
    }
  }

  partialUpdate<T extends keyof DatabaseType>(
    table: T,
    id: string,
    data: Partial<Omit<DatabaseType[T][0], "id">>
  ) {
    const rows = this.#database[table] ?? [];
    const index = rows.findIndex((row) => row.id === id);

    if (index > -1) {
      this.#database[table][index] = {
        id,
        ...this.#database[table][index],
        ...data,
      };
      this.#persist();
    } else {
      throw new Error("No data was found for passed id");
    }
  }

  delete<T extends keyof DatabaseType>(table: T, id: string) {
    const rows = this.#database[table] ?? [];
    const index = rows.findIndex((row) => row.id === id);

    if (index > -1) {
      this.#database[table].splice(index, 1);
      this.#persist();
    } else {
      throw new Error("No data was found for passed id");
    }
  }
}
