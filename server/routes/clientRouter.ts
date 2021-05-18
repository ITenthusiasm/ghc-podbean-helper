import express from "express";
import path from "path";

/** Router managing the files the clients can request */
const clientRouter = express.Router();

clientRouter.get("/favicon.ico", function (_req, res) {
  res.sendFile(path.join(__dirname, "../../public/favicon.ico"));
});

clientRouter.route("/*").get(function (_req, res) {
  res.sendFile(path.join(__dirname, "../../public/index.html"));
});

export default clientRouter;
