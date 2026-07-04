import pg from "pg";

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

    return client;
  } catch (error) {
    console.error(error);
    return null;
  }
}


// import pg from "pg";

// let pool;

// export default function getDatabaseClient() {
//   if (!pool) {
//     pool = new pg.Pool({
//       host: process.env.POSTGRES_HOST,
//       database: process.env.POSTGRES_DATABASE,
//       user: process.env.POSTGRES_USER,
//       password: process.env.POSTGRES_PASSWORD,
//       max: 10, // optional but recommended
//       idleTimeoutMillis: 30000,
//       connectionTimeoutMillis: 2000,
//     });
//   }

//   return pool;
// }