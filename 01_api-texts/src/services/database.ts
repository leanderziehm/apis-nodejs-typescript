import pg from "pg";
import {Texts} from "../routes/texts.route.js"

let client = null;

export default async function getDatabaseClient(){
  try {
    client = new pg.Client({
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DATABASE,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    });
    await client.connect();
    try {
      const sql = Texts.get_ensure_table_texts_sql();
      await client.query(sql);
    } catch (error) {
      console.log("ERROR for get_ensure_table_texts_sql:",error)
      return client;
    }

    return client;
  } catch (error) {
    console.error(error);
    return null;
  }
}