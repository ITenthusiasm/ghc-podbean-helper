/* eslint-disable camelcase */
import axios, { AxiosError } from "axios";
import path from "path";
import { promises as fs } from "fs";
import { URLSearchParams } from "url";
import { PodbeanError } from "../models/errors";
import type { SermonDetails } from "../types";

const podbeanApi = axios.create({ baseURL: process.env.BASE_PODBEAN_URL });

/** Tracks the current access token from Podbean */
const token = { current: "", createdAt: NaN, expiresIn: NaN };

class PodbeanService {
  /**
   * Publishes a new sermon using the provided info
   * @param sermonInfo
   * @returns The permalink URL of the sermon on Podbean
   */
  static async publish(sermonInfo: SermonDetails): Promise<string> {
    const { speaker, title, reference, time, sermonFileName, sermonPicName } = sermonInfo;
    const access_token = await this.#getToken();
    const media_key = await this.#getFileKey(sermonFileName);
    const logo_key = await this.#getFileKey(sermonPicName);

    // Prepare data for Podbean to display
    const podcastTitle = `${reference.book} ${reference.passage}: ${title} (${speaker})`;
    const podcastDescription = (() => {
      const quotedTitle = title && `"${title}"`;

      const eventAt = (() => {
        if (time === "Sunday Morning") return "Sunday morning gathering of";
        if (time === "Sunday Evening") return "Sunday evening gathering of";
        return "message at";
      })();

      const untrimmedDescription = `${speaker} preaches ${quotedTitle} from ${reference.book} ${reference.passage} in this ${eventAt} Grace Harbor Church.`;
      return untrimmedDescription.trim().replace(/\s{2,}/g, " ");
    })();

    try {
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
      };

      const data = {
        access_token,
        type: "public",
        title: podcastTitle,
        content: podcastDescription,
        status: "publish",
        media_key,
        logo_key,
      };

      // Try to publish episode
      const qs = new URLSearchParams({ ...data });
      const response = await podbeanApi.post("episodes", qs.toString(), { headers });

      // Look at results
      console.log("Permalink URL for new episode: ", response.data.episode.permalink_url);
      return response.data.episode.permalink_url as string;
    } catch (err) {
      throw new PodbeanError((err as AxiosError).response?.data);
    }
  }

  static #getToken = async (): Promise<string> => {
    const username = process.env.CLIENT_ID as string;
    const password = process.env.CLIENT_SECRET as string;
    const auth = { username, password };
    const body = { grant_type: "client_credentials" };

    if (token.current && Date.now() - token.createdAt < token.expiresIn) return token.current;

    try {
      token.createdAt = Date.now();
      const { data } = await podbeanApi.post("oauth/token", body, { auth });

      const { access_token, expires_in } = data as Record<string, string>;
      token.current = access_token;
      token.expiresIn = Number(expires_in);

      return token.current;
    } catch (err) {
      // Reset token
      token.current = "";
      token.createdAt = NaN;
      token.expiresIn = NaN;

      throw new PodbeanError((err as AxiosError).response?.data);
    }
  };

  static #getFileKey = async (filename: string): Promise<string> => {
    const access_token = await this.#getToken();

    const [, ext] = filename.split(".") as [never, "mp3" | "png"];
    const content_type = ext === "mp3" ? ("audio/mp3" as const) : ("image/png" as const);

    const filepath =
      ext === "mp3"
        ? path.resolve(process.env.SERMON_FILES_DIR as string, filename)
        : path.resolve(process.env.THUMBNAILS_DIR as string, filename);
    const { size: filesize } = await fs.stat(filepath);

    try {
      // Get pre-signed URL and file key
      const { data } = await podbeanApi.get("files/uploadAuthorize", {
        params: { access_token, filename, filesize, content_type },
      });

      // Upload file
      const file = await fs.readFile(filepath);
      await axios.put(data.presigned_url, file, { headers: { "Content-Type": content_type } });

      // Return file key
      return data.file_key as string;
    } catch (err) {
      // Check if Podbean Error
      if ((err as AxiosError).response?.data.error_description)
        throw new PodbeanError((err as AxiosError).response?.data);

      // Handle other kinds of errors
      throw new Error((err as AxiosError).response?.data);
    }
  };
}

export default PodbeanService;
