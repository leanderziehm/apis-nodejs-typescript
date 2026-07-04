import fastify from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import path from "path";
import { fileURLToPath } from "url";
import autoload from "@fastify/autoload";
import cors from "@fastify/cors";
import { createRequire } from "module";


const port = Number(process.env.PORT) || 4001;

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = require(path.join(__dirname, "../package.json"));

const version = pkg.version;
const title = pkg.name;
const description = pkg.description;


const app = fastify.fastify({ logger: true });
await app.register(cors, {
  origin: true,
});
process.on("uncaughtException", (err: Error) => {
  app.log.error(`Uncaught Exception: ${err}`);
});
process.on("unhandledRejection", (reason, promise) => {
  app.log.error(`Unhandled Rejection at: ${promise}  reason: ${reason}`);
});
// Global error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error(`Global error handler: ${error}`);
  reply.status(500).send({ error: "Internal Server Error" });
});
const swaggerOptions = {
  swagger: {
    info: {
      title: title,
      description:description,
      version: version,
    },
  },
};
const swaggerUiOptions = {
  routePrefix: "/docs",
  exposeRoute: true,
};
app.register(fastifySwagger, swaggerOptions);
app.register(fastifySwaggerUi, swaggerUiOptions);

app.register(autoload, {
  dir: path.join(__dirname, "routes"),
  forceESM: true,
});
app.get("/", async (request, reply) => {
  reply.redirect("/docs", 302);
});
app
  .listen({ port: port, host: "0.0.0.0" }) // host: "127.0.0.1"
  .then(() => 1)
  .catch((err) => {
    app.log.error(`Error: ${err}`);
    process.exit(1);
  });
