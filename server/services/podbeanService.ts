/* eslint-disable camelcase */
import axios, { AxiosRequestConfig } from "axios";
import path from "path";
import { promises as fs } from "fs";
import { PodbeanError } from "../models/errors";
import type { SermonDetails } from "../types";

const podbeanApi = axios.create({ baseURL: process.env.BASE_PODBEAN_URL });

/** Tracks the current access token from Podbean */
const token = { current: "", createdAt: NaN, expiresIn: NaN };

async function getToken(): Promise<string> {
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

    throw new PodbeanError(err.response.data);
  }
}

// Private
async function getFileKey(filename: string): Promise<string> {
  const access_token = await getToken();

  const [, ext] = filename.split(".");
  const content_type = ext === "mp3" ? ("audio/mp3" as const) : ("image/png" as const);

  const filepath = path.resolve(process.env.SERMON_FILES_DIR as string, filename);
  const { size: filesize } = await fs.stat(filepath);

  try {
    const { data } = await podbeanApi.get("files/uploadAuthorize", {
      params: { access_token, filename, filesize, content_type },
    });

    return data.file_key as string;
  } catch (err) {
    throw new PodbeanError(err.response.data);
  }
}

/**
 * Publishes a new sermon using the provided info
 * @param sermonInfo
 * @returns The permalink URL of the sermon on Podbean
 */
async function publish(sermonInfo: SermonDetails): Promise<string> {
  const { speaker, title, reference, time, sermonFileName, sermonPicName } = sermonInfo;
  const access_token = await getToken();
  const media_key = await getFileKey(sermonFileName);
  const logo_key = await getFileKey(sermonPicName);
  console.log("Media Key: ", media_key);
  console.log("Logo Key: ", logo_key);

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

    const axiosConfig: AxiosRequestConfig = {
      headers,
      params: data,
    };

    // Try to verify that we're getting the right episode type
    const { data: getPodcast } = await podbeanApi.post("podcasts", null, {
      headers,
      params: { access_token },
    });
    console.dir(getPodcast, { depth: 5 });
    const episodeType = getPodcast.podcasts[0].allow_episode_type[0];
    console.log("Episode Type: ", episodeType);

    // Try to publish episode
    axiosConfig.params.type = episodeType;
    const { data: episode } = await podbeanApi.post("episodes", null, axiosConfig);

    // Look at results
    console.log(episode.permalink_url);
    return episode.permalink_url as string;
  } catch (err) {
    console.error(err);
    throw new PodbeanError(err.response.data);
  }
}

// TODO: Stop exposing `getToken` after testing is complete and it is no longer needed
const podbeanService = { getToken, publish };
export default podbeanService;
