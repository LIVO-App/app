/**
 * Shared Axios instance.
 *
 * - Sets `baseURL` based on `NODE_ENV` (dev vs production).
 * - Adds the token to the `x-access-token` header reading it from `sessionStorage`.
 *
 * Note: expired-token handling/refresh and redirects are implemented in `utils.ts`.
 */

import axios from "axios";
/*import type {App} from 'vue'

interface AxiosOptions {
    baseUrl?: string
    token?: string
}

export default {
    install: (app: App, options: AxiosOptions) => {
        app.config.globalProperties.$axios = axios.create({ //inject not working
            baseURL: options.baseUrl,
            headers: {
                Authorization: options.token ? `Bearer ${options.token}` : '',
            }
        })
    }
}*/

/**
 * Axios runtime configuration.
 * The token is read from the session at bootstrap time and can be updated by the login flow.
 */
const options: {
  baseUrl?: string;
  token?: string;
} = {
  baseUrl:
    process.env.NODE_ENV === "production"
      ? "https://backend.livopath.istitutodecarneri.it/api"
      : "http://localhost:5000/api",
  token: sessionStorage.getItem("token") ?? undefined,
};

/**
 * Preconfigured Axios client, used by `executeLink()`.
 */
const $axios = axios.create({
  baseURL: options.baseUrl,
  headers: {
    //Authorization: options.token ? `Bearer ${options.token}` : '',
    "x-access-token": options.token ?? undefined,
  },
});

export { $axios };
