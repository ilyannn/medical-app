import type { Database } from "bun:sqlite";
import { sql } from "@/server/db/sql";
import type { SearchHit } from "@/shared/types";

interface SearchRecord {
  record_type: string;
  record_id: string;
  person_id: string;
  title: string;
  body: string;
}

export async function rebuildSearchIndex(
  sqlite: Database,
  records: SearchRecord[],
) {
  sqlite.run(sql`DELETE FROM search_index;`);
  const statement = sqlite.prepare(
    sql`
      INSERT INTO search_index (
        record_type,
        record_id,
        person_id,
        title,
        body
      )
      VALUES (?, ?, ?, ?, ?);
    `,
  );
  const insertMany = sqlite.transaction((items: SearchRecord[]) => {
    for (const item of items) {
      statement.run(
        item.record_type,
        item.record_id,
        item.person_id,
        item.title,
        item.body,
      );
    }
  });
  insertMany(records);
}

export function querySearchIndex(
  sqlite: Database,
  query: string,
  personScope: string,
): SearchHit[] {
  const statement =
    personScope === "all"
      ? sqlite.prepare(
          sql`
            SELECT record_type, record_id, person_id, title, body
            FROM search_index
            WHERE search_index MATCH ?
            LIMIT 20;
          `,
        )
      : sqlite.prepare(
          sql`
            SELECT record_type, record_id, person_id, title, body
            FROM search_index
            WHERE search_index MATCH ? AND person_id = ?
            LIMIT 20;
          `,
        );
  const rows = (
    personScope === "all"
      ? statement.all(query)
      : statement.all(query, personScope)
  ) as SearchRecord[];
  return rows.map((row) => ({
    kind: "app",
    recordType: row.record_type,
    id: row.record_id,
    personId: row.person_id,
    title: row.title,
    excerpt: row.body.slice(0, 140),
  }));
}
