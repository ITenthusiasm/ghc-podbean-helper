/* eslint-disable camelcase */
import axios from "axios";
import { PodbeanError } from "../models/errors";

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

export default { getToken };
