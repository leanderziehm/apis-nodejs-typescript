import {
  type FastifyInstance,
  type FastifyRequest,
  type FastifyReply,
  type FastifySchema,
} from "fastify";

import getDatabaseClient from "../services/database.js";

/**
 * KV Store API
 * Acts like a minimal Redis using Postgres
 */

export default async function (app: FastifyInstance) {
  /**
   * Ensure table exists on boot (optional but useful)
   */
  const client = await getDatabaseClient();
  if (client) {
    await client.query(KVStore.get_ensure_table_sql());
    await client.end();
  }

  /**
   * GET /kv/:key
   */
  app.get<{ Params: { key: string } }>(
    "/kv/:key",
    async (request, reply) => {
      const { key } = request.params;
      const result = await get_value(key);

      if (!result) {
        return reply.code(404).send({ error: "Key not found" });
      }

      return result;
    }
  );

  /**
   * GET /kv (list keys)
   */
  const listSchema: FastifySchema = {
    querystring: {
      type: "object",
      properties: {
        limit: { type: "integer", default: 20 },
        offset: { type: "integer", default: 0 },
      },
      additionalProperties: false,
    },
  };

  app.get(
    "/kv",
    { schema: listSchema },
    async (
      request: FastifyRequest<{
        Querystring: { limit?: number; offset?: number };
      }>
    ) => {
      const { limit = 20, offset = 0 } = request.query;
      return await list_values(limit, offset);
    }
  );

  /**
   * SET /kv
   * Redis-like SET behavior (insert or update)
   */
  const setSchema: FastifySchema = {
    body: {
      type: "object",
      required: ["key", "value"],
      properties: {
        key: { type: "string" },
        value: {},
      },
      additionalProperties: false,
    },
  };

  app.post<{ Body: { key: string; value: any } }>(
    "/kv",
    { schema: setSchema },
    async (request) => {
      const { key, value } = request.body;
      return await set_value(key, value);
    }
  );

  /**
   * DELETE /kv/:key
   */
  app.delete<{ Params: { key: string } }>(
    "/kv/:key",
    async (request) => {
      return await delete_value(request.params.key);
    }
  );
}

/**
 * -------------------------
 * SQL definition helper
 * -------------------------
 */
export class KVStore {
  static get_ensure_table_sql() {
    return `
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  static get_set_sql() {
    return `
      INSERT INTO kv_store (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key)
      DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
  }

  static get_get_sql() {
    return `
      SELECT key, value, updated_at
      FROM kv_store
      WHERE key = $1;
    `;
  }

  static get_list_sql() {
    return `
      SELECT key, value, updated_at
      FROM kv_store
      ORDER BY updated_at DESC
      LIMIT $1 OFFSET $2;
    `;
  }

  static get_delete_sql() {
    return `
      DELETE FROM kv_store
      WHERE key = $1
      RETURNING key;
    `;
  }
}

/**
 * -------------------------
 * DB functions
 * -------------------------
 */

export async function get_value(key: string) {
  const client = await getDatabaseClient();
  if (!client) return null;

  try {
    const sql = KVStore.get_get_sql();
    const result = await client.query(sql, [key]);
    return result.rows[0] ?? null;
  } catch (err) {
    console.error(err);
    return null;
  } finally {
    await client.end();
  }
}

export async function set_value(key: string, value: any) {
  const client = await getDatabaseClient();
  if (!client) return null;

  try {
    const sql = KVStore.get_set_sql();
    const result = await client.query(sql, [key, value]);
    return result.rows[0];
  } catch (err) {
    console.error(err);
    return err;
  } finally {
    await client.end();
  }
}

export async function list_values(limit = 20, offset = 0) {
  const client = await getDatabaseClient();
  if (!client) return null;

  try {
    const sql = KVStore.get_list_sql();
    const result = await client.query(sql, [limit, offset]);
    return result.rows;
  } catch (err) {
    console.error(err);
    return [];
  } finally {
    await client.end();
  }
}

export async function delete_value(key: string) {
  const client = await getDatabaseClient();
  if (!client) return null;

  try {
    const sql = KVStore.get_delete_sql();
    const result = await client.query(sql, [key]);
    return result.rows[0] ?? null;
  } catch (err) {
    console.error(err);
    return err;
  } finally {
    await client.end();
  }
}