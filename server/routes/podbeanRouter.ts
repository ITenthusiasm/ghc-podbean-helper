import express from "express";
import { podbeanService } from "../services";

/** Router handling any Podbean API requests */
const podbeanRouter = express.Router();

// TODO: Remove after testing is complete and this is no longer needed.
podbeanRouter.get("/token", async function (_, res, next) {
  try {
    const token = await podbeanService.getToken();
    res.json(token);
  } catch (err) {
    next(err);
  }
});

export default podbeanRouter;
