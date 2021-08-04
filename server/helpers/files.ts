import { Promise as NodeID3, Tags } from "node-id3";
import path from "path";
import { promises as fs } from "fs";
import { UserError } from "../models/errors";
import type { SermonDetails } from "../types";

function getPathFor(type: "sermon" | "thumbnail", filename: string): string {
  const basePath = type === "sermon" ? process.env.SERMON_FILES_DIR : process.env.THUMBNAILS_DIR;
  return path.resolve(basePath as string, filename);
}

type NodeID3Promise = ReturnType<typeof NodeID3.update>;

/** Applies ID3 tags to an existing sermon file based on the provided sermon data */
export async function applyID3Tags(data: SermonDetails): NodeID3Promise {
  const { speaker, title, reference, series, date, sermonFileName, sermonPicName } = data;
  const [year, month, day] = date.split("-"); // ISO 8601 Date String

  const tags: Tags = {
    artist: speaker,
    title,
    subtitle: `${reference.book} ${reference.passage}`,
    date: `${day}${month}`,
    year,
    genre: "Speech",
    language: "eng",
    publisher: "Grace Harbor Church, Providence, RI",
    publisherUrl: "https://www.graceharbor.net",
    album: "GHC Sermons",
    copyright: `${year}, Grace Harbor Church`,
    image: {
      mime: "image/png",
      type: { id: 3, name: "front cover" },
      description: "Grace Harbor Church",
      imageBuffer: await fs.readFile(getPathFor("thumbnail", sermonPicName)),
    },
  };

  if (series !== "(None)") tags.contentGroup = series;

  const success = await NodeID3.update(tags, getPathFor("sermon", sermonFileName));
  return success;
}

/**
 * Updates an existing sermon file's name based on the provided sermon data
 * @param sermonInfo
 * @returns The sermon's new file name
 */
export async function updateSermonFileName(sermonInfo: SermonDetails): Promise<string> {
  const { date, time, speaker, sermonFileName } = sermonInfo;

  const timeOfDay = (() => {
    if (time === "Sunday Morning") return "am";
    if (time === "Sunday Evening") return "pm";
    return "";
  })();

  const newFilename = `GHC_${date}${timeOfDay}_${speaker.replace(/\s/g, "")}.mp3` as const;
  if (newFilename === sermonFileName) return sermonFileName;

  try {
    // Ideally, should throw
    await fs.access(getPathFor("sermon", newFilename));

    const error = new UserError(
      `File ${sermonFileName} could not be renamed to ${newFilename} because ${newFilename} already exists.`
    );

    error.info =
      "All sermon files are renamed to a standard format during the uploading process to make it easier to track sermon history.";
    error.suggestion = `Consider moving or renaming the existing file (${newFilename}) so that the upload process may continue.`;

    throw error;
  } catch (err) {
    // File already exists or an unexpected error happened
    if (err.code !== "ENOENT") throw err;

    // File rename is safe
    await fs.rename(getPathFor("sermon", sermonFileName), getPathFor("sermon", newFilename));
    return newFilename;
  }
}
