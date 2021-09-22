import { promises as fs } from "fs";
import path from "path";
import { UserError } from "../models/errors";
import { speakers as speakersDb, series as seriesDb } from "../json-data";
import type { SermonFormData } from "../types";
import { BibleReferenceValidator } from ".";

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
    if (speaker.new) {
      if (!speaker.firstName || !speaker.lastName)
        throw new UserError("A first name and last name are required for new speakers.");

      return;
    }

    if (!speakersDb.includes(speaker.value))
      throw new UserError(`No existing speaker was found with the name "${speaker.value}".`);
  }

  static #validateTitle(title: SermonFormData["title"], timeOfDay: SermonFormData["time"]): void {
    if (!title && timeOfDay !== "Sunday Evening")
      throw new UserError("An empty title is only allowed for evening services.");
  }

  static #validateSeries(series: SermonFormData["series"]): void {
    if (series.new) {
      if (!series.newValue) throw new UserError("A valid series name is required for new series.");
      return;
    }

    if (!series.new && !seriesDb.includes(series.value))
      throw new UserError(`No existing series called "${series.value}" was found.`);
  }

  static #validateReference(reference: SermonFormData["reference"]): void {
    if (!reference.book && !reference.passage) return;

    if (!reference.book || !reference.passage) {
      const error = new UserError("An incomplete Bible reference was provided.");
      error.suggestion = "Please use a complete Bible reference or exclude it entirely.";
      throw error;
    }

    BibleReferenceValidator.validate(`${reference.book} ${reference.passage}`);
  }

  static #validateDate(date: SermonFormData["date"]): void {
    // Validate general format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const error = new UserError("An invalid date was provided.");
      error.info = "The expected date format is 'YYYY-MM-DD'.";
      throw error;
    }

    const [year, month, day] = date.split("-").map((datePart) => Number(datePart));

    // Validate year
    if (year < 1900 || year > new Date().getFullYear()) {
      const error = new UserError("An invalid year was provided.");
      error.info = "Year must be no earlier than 1900 and no later than this year.";
      throw error;
    }

    // Validate month
    if (month < 1 || month > 12) throw new UserError("An invalid month was provided.");

    // Validate day
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)) monthDays[1] = 29;

    if (day < 1 || day > monthDays[month - 1]) {
      const error = new UserError("An invalid day was provided for the given month and year.");
      error.suggestion = "Remember to account for leap years.";
      throw error;
    }
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
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;

      // A file doesn't exist
      const userError = new UserError(`Could not find ${type} with the name "${filename}".`);
      userError.info = `${capitalType}s are only allowed to come from ${directoryPath}.`;
      throw userError;
    }
  }
}

export default SermonFormDataValidator;
