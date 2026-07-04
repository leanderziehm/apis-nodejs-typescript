import fastify from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import path from "path";
import { fileURLToPath } from "url";
import autoload from "@fastify/autoload";
import cors from "@fastify/cors";
const version = "0.0.1";
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
      title: "API-Texts",
      description:"",
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
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.register(autoload, {
  dir: path.join(__dirname, "routes"),
  forceESM: true,
});
app.get("/", async (request, reply) => {
  reply.redirect("/docs", 302);
});
app
  .listen({ port: 4000, host: "127.0.0.1" })
  .then(() => 1)
  .catch((err) => {
    app.log.error(`Error: ${err}`);
    process.exit(1);
  });
