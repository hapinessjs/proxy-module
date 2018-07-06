import * as Hapi from 'hapi';

/**
 * OnHandler hook
 *
 * @param  {Request} req
 * @returns string | Observable
 */
export interface OnMapUri {
    onMapUri(req: Hapi.Request): { uri: string, headers?: any[] };
}

/**
 * OnResponse hook
 *
 * @returns any | Observable
 */
export interface OnResponse {
    onResponse(payload, res, req, reply): any | Promise<any>;
}

/**
 * OnResponse hook
 *
 * @returns any | Observable
 */
export interface OnAuthenticate {
    onAuthenticate(request, reply): any | Promise<any>;
}
