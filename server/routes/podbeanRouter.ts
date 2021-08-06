import express from "express";
import { SermonFormDataValidator } from "../validators";
import { podbeanService } from "../services";
import { applyID3Tags, updateSermonFileName } from "../helpers/files";
import { UserError } from "../models/errors";
import type { SermonFormData, SermonDetails } from "../types";

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

podbeanRouter.post("/upload", async function (req, res, next) {
  try {
    // Run validation
    await SermonFormDataValidator.validate(req.body as SermonFormData);

    // Map form data
    const { speaker: speakerFormData, series: seriesFormData } = req.body as SermonFormData;
    const { firstName, lastName } = speakerFormData;
    const speaker = speakerFormData.new ? `${firstName} ${lastName}` : speakerFormData.value;
    const series = seriesFormData.new ? seriesFormData.newValue : seriesFormData.value;
    const sermonInfo: SermonDetails = Object.assign(req.body, { speaker, series });

    // Update sermon file with proper info
    await applyID3Tags(sermonInfo);
    const newSermonFileName = await updateSermonFileName(sermonInfo);

    // Publish episode
    const url = await podbeanService.publish({ ...sermonInfo, sermonFileName: newSermonFileName });
    res.json(url);
  } catch (err) {
    if (err instanceof UserError) {
      res.status(400).json(err);
      return;
    }

    next(err);
  }
});

export default podbeanRouter;
