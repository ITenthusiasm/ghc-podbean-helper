import { promises as fs } from "fs";
import path from "path";
import { UserError } from "../models/errors";
import { speakers as speakersDb, series as seriesDb } from "../test-data"; // NOTE: Should be replaced in the future
import type { SermonFormData } from "../types";

// TODO: Should we enforce that all inputs are strings?
class SermonFormDataValidator {
  static async validate(sermonInfo: SermonFormData): Promise<void> {
    this.#validateSpeaker(sermonInfo.speaker);
    this.#validateTitle(sermonInfo.title, sermonInfo.time);
    this.#validateSeries(sermonInfo.series);
    this.#validateReference(sermonInfo.reference);
    this.#validateDate(sermonInfo.date);
    this.#validateTime(sermonInfo.time);
    await this.#validateFile("sermon file", sermonInfo.sermonFileName);
    await this.#validateFile("thumbnail", sermonInfo.sermonPicName);
  }

  static #validateSpeaker(speaker: SermonFormData["speaker"]): void {
    if (speaker.new && (!speaker.firstName || !speaker.lastName))
      throw new UserError("A first name and last name are required for new speakers.");

    // TODO: Use a more robust lookup for speakers
    if (!speakersDb.includes(speaker.value))
      throw new UserError(`No existing speaker was found with the name "${speaker.value}".`);
  }

  static #validateTitle(title: SermonFormData["title"], timeOfDay: SermonFormData["time"]): void {
    if (!title && timeOfDay !== "Sunday Evening")
      throw new UserError("An empty title is only allowed for evening services.");
  }

  static #validateSeries(series: SermonFormData["series"]): void {
    if (!series.new && !seriesDb.includes(series.value)) {
      // TODO: Use a more robust lookup for series
      throw new UserError(`No existing series called "${series.value}" was found.`);
    }
  }

  static #validateReference(reference: SermonFormData["reference"]): void {
    if (!reference.book && !reference.passage) return;

    if (!reference.book || !reference.passage) {
      const error = new UserError("An invalid Bible reference was provided.");
      error.suggestion = "Please use a valid Bible reference or exclude it entirely.";
      throw error;
    }

    // TODO: Should we more strictly validate Bible references?
  }

  static #validateDate(date: SermonFormData["date"]): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const error = new UserError("An invalid date was provided.");
      error.info = "The expected date format is 'YYYY-MM-DD'.";
      throw error;
    }

    // TODO: Should we validate the individual components of the date?
  }

  static #validateTime(time: SermonFormData["time"]): void {
    if (time !== "Sunday Morning" && time !== "Sunday Evening" && time !== "Other") {
      throw new UserError("An invalid time of day was provided.");
    }
  }

  static async #validateFile(type: "sermon file" | "thumbnail", filename: string): Promise<void> {
    // Validate file extension
    const properExt = type === "sermon file" ? "mp3" : "png";
    if (!new RegExp(`[.]${properExt}$`).test(filename))
      throw new UserError(`Only .${properExt} files are allowed for ${type}s.`);

    // Validate file destination
    const sermonDirPath = process.env.SERMON_FILES_DIR as string;
    const picDirPath = process.env.THUMBNAILS_DIR as string;
    const directoryPath = type === "sermon file" ? sermonDirPath : picDirPath;

    const capitalType = (type.charAt(0).toUpperCase() + type.slice(1)) as Capitalize<typeof type>;

    try {
      await fs.access(path.resolve(directoryPath, filename));
    } catch (err) {
      // An unexpected error occurred
      if (err.code !== "ENOENT") throw err;

      // A file doesn't exist
      const userError = new UserError(`Could not find ${type} with the name ${filename}.`);
      userError.info = `${capitalType}s are only allowed to come from ${directoryPath}.`;
      throw userError;
    }
  }
}

export default SermonFormDataValidator;
