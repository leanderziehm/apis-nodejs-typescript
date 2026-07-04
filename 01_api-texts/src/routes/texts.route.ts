import {
  type FastifyInstance,
  type FastifyRequest,
  type FastifyReply,
  type FastifySchema,
} from "fastify";

import getDatabaseClient  from "../services/database.js";

export default async function (app: FastifyInstance) {
  const schema: FastifySchema = {
    querystring: {
      type: "object",
      properties: {
        per_page: { type: "integer" },
        page: { type: "integer" },
      },
      required: [],
      additionalProperties: false,
    },
  };
  app.get(
    "/texts",
    { schema },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { per_page, page } = request.query as {
        per_page?: number;
        page?: number;
      };
      const results = await get_texts(true, per_page, page);
      return results; // No need for JSON.stringify; Fastify handles it
    }
  );

  interface TextBody {
    text: string;
  }

  const bodyJsonSchemaForText = {
    type: "object",
    required: ["text"],
    properties: {
      text: { type: "string" },
    },
  };

  const postSchema: FastifySchema = {
    body: bodyJsonSchemaForText,
  };

  app.post<{ Body: TextBody }>(
    "/texts",
    { schema: postSchema },
    async (request, reply) => {
      const { text } = request.body;
      const results = await insert_into_texts(text);
      return results; // Fastify automatically serializes to JSON
    }
  );
}

export class Texts {
  static get_select_all_texts_sql() {
    return `SELECT * FROM texts;`;
  }
    static get_select_texts_sql(descending = true) {
    const sortBy = descending ? "DESC" : "ASC";
    return `SELECT * FROM texts ORDER BY timestamp ${sortBy} LIMIT $1;`;
  }

  static get_insert_texts_sql() {
    return `INSERT INTO texts 
                        (text)
                 VALUES ($1)
                RETURNING *;
                `;
  }

  static get_ensure_table_texts_sql() {
    return `CREATE TABLE IF NOT EXISTS texts
          (
            id SERIAL PRIMARY KEY,
            timestamp timestamp default current_timestamp,
            text TEXT
          );`;
  }
}


export async function get_texts(descending = true, limit = 5, page = 0) {
  let client = await getDatabaseClient();
  if (client !== null) {
    try {
      console.log("page:", page);
      const sql = Texts.get_select_texts_sql(descending);
   
      console.log(sql,[limit]);
      const result = await client.query(sql,[limit]);
      console.log(result);
      return result.rows;
    } catch (err) {
      console.error(err);
      return err;
    } finally {
      await client.end();
    }
  } else {
    return "Client is null";
  }
}

export async function insert_into_texts(text:string) {
  let client = await getDatabaseClient();
  if (client !== null) {
    try {
      const sql = Texts.get_insert_texts_sql();
      console.log(sql);
      const result = await client.query(sql,[text]);
      console.log(result);
      return result.rows;
    } catch (err) {
      console.error(err);
      return err;
    } finally {
      await client.end();
    }
  } else {
    return "Client is null";
  }
}
