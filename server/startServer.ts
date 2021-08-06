import express from "express";
import http from "http";
import { clientRouter, podbeanRouter } from "./routes";

async function startServer(): Promise<http.Server> {
  // Initialize Server
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Manage configurations
  const port = Number(process.env.PORT);

  // Dev-only configurations
  if (process.env.NODE_ENV === "development") {
    const { default: webpack } = await import("webpack");
    const { default: config } = await import("../webpack.config.js");
    const compiler = webpack(config);

    // Setup express with webpack dev middleware and webpack hot middleware
    const { default: webpackDevMiddleware } = await import("webpack-dev-middleware");
    const { default: webpackHotMiddleware } = await import("webpack-hot-middleware");

    const webpackRoutes = ["/"];
    app.use(webpackRoutes, webpackDevMiddleware(compiler));
    app.use(webpackRoutes, webpackHotMiddleware(compiler));
  }

  // Setup routes
  app.use("/api", podbeanRouter);
  app.use("/", clientRouter);

  // Create and start the server
  const server = http.createServer(app);

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`App listening on port ${port}...`);
      resolve(server);
    });
  });
}

export default startServer;
