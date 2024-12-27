import csv from "csv-parse";
import busboy from "busboy";
import path from "node:path";
import { createWriteStream, readFile } from "node:fs";
import { IncomingMessage, ServerResponse } from "node:http";

export async function csvHelper(
  req: IncomingMessage,
  res: ServerResponse,
  onSave: (records: any) => Promise<void>
) {
  const bb = busboy({ headers: req.headers });

  bb.on("file", (name, file, info) => {
    const { filename, encoding, mimeType } = info;

    console.log(
      `File [${name}]: filename: ${filename}, encoding: ${encoding}, mimeType: ${mimeType}`
    );

    if (mimeType !== "text/csv") {
      res.writeHead(400, { "content-type": "text/plain" });
      res.end("Invalid file type. Only CSV files are allowed");
      return;
    }

    const filePath = `${path.dirname(__dirname)}/tmp/${filename}`;

    const fstream = createWriteStream(filePath);
    file.pipe(fstream);

    fstream.on("close", () => {
      readFile(filePath, "utf-8", (err, data) => {
        if (err) {
          res.writeHead(500, { "content-type": "text/plain" });
          res.end("Error reading file");
          return;
        }

        csv.parse(data, { columns: true }, async (err, records) => {
          if (err) {
            res.writeHead(500, { "content-type": "text/plain" });
            res.end("Error parsing file");
            return;
          }

          await onSave(records);
          console.log("CSV file uploaded and parsed successfully");
        });
      });
    });
  });

  bb.on("close", () => {
    console.log("Done parsing form");
  });

  req.pipe(bb);
}
