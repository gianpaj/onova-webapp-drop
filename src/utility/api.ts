import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { City, Department, Order, Product, User } from '../types';

axios.defaults.timeout = 20000;

// export const isProd = false;
export const isProd = true;
export const analyticsEnabled = isProd && window.location.hostname !== 'localhost';

let baseURL;
if (isProd) {
  baseURL = 'https://api.onova.co';
} else {
  baseURL = 'http://localhost:4000';
}

axios.defaults.baseURL = baseURL;
export const API_URL = baseURL;

interface IOptions extends AxiosRequestConfig {
  suppressRedBox?: boolean;
  token?: string;
}

type Method = 'put' | 'get' | 'post' | 'delete';

/**
 * GET a path relative to API root url.
 * @param path Relative path to the configured API endpoint
 * @param options Axios options (optional)
 * @returns Promise of response body
 */
export async function get(path: string, options?: IOptions): Promise<any> {
  const axiosOptions = getAxiosOptions(options);
  return bodyOf(request('get', path, null, axiosOptions));
}

/**
 * POST JSON to a path relative to API root url
 * @param path Relative path to the configured API endpoint
 * @param body Anything that you can pass to JSON.stringify
 * @param options Axios options (optional)
 * @returns Promise of response body
 */
export async function post(path: string, body?: any, options?: IOptions): Promise<any> {
  const axiosOptions = getAxiosOptions(options);
  return bodyOf(request('post', path, body, axiosOptions));
}

/**
 * PUT JSON to a path relative to API root url
 * @param path Relative path to the configured API endpoint
 * @param body Anything that you can pass to JSON.stringify
 * @param options Axios options (optional)
 * @returns Promise of response body
 */
export async function put(path: string, body: any, options?: IOptions): Promise<any> {
  const axiosOptions = getAxiosOptions(options);
  return bodyOf(request('put', path, body, axiosOptions));
}

/**
 * DELETE a path relative to API root url
 * @param path Relative path to the configured API endpoint
 * @param options Axios options (optional)
 * @returns Promise of response body
 */
export async function del(path: string, options?: IOptions): Promise<any> {
  const axiosOptions = getAxiosOptions(options);
  return bodyOf(request('delete', path, null, axiosOptions));
}

function getAxiosOptions(options: IOptions | undefined): any {
  let axiosOptions = { suppressRedBox: true };
  if (options && options.suppressRedBox === undefined) {
    axiosOptions = { ...options, suppressRedBox: true };
  }
  if (options && options.suppressRedBox !== undefined) {
    // @ts-ignore:disable-line
    axiosOptions = options;
  }
  return axiosOptions;
}

/**
 * Make arbitrary axios request to a path relative to API root url
 *
 * @param method One of: get|post|put|delete
 * @param path Relative path to the configured API endpoint
 * @param body Anything that you can pass to JSON.stringify
 * @param options: Axios options
 */
async function request(method: Method, path: string, body: any, options: IOptions) {
  try {
    const response = await sendRequest(method, path, body, options);
    return handleResponse(path, response);
  } catch (error) {
    if (!options.suppressRedBox) {
      logError(error, path, method);
    }
    throw error;
  }
}

/**
 * Constructs and fires a HTTP request
 */
async function sendRequest(method: Method, path: string, body: any, options: IOptions) {
  try {
    let headers = getRequestHeaders(body);
    if (options.token !== undefined) {
      headers = { ...headers, Authorization: options.token };
    }
    const allOptions: AxiosRequestConfig = {
      headers,
      method,
      url: path,
      ...(options.timeout ? { timeout: options.timeout } : {}),
      validateStatus(status) {
        return status >= 200 && status <= 500;
      },
    };
    if (options.onUploadProgress) allOptions.onUploadProgress = options.onUploadProgress;
    if (options.cancelToken) allOptions.cancelToken = options.cancelToken;
    if (body) allOptions.data = body;

    return axios(allOptions);
  } catch (e) {
    throw new Error(e);
  }
}

/**
 * Receives and reads a HTTP response
 */
async function handleResponse(path: string, response: AxiosResponse) {
  try {
    const { status, data, headers } = response;

    // `axios` is configured to resolve even if HTTP status indicates failure.
    // Re-route promise flow control to interpret error responses as failures
    if (status >= 400) {
      // const error = new Error({status: status, message: message});

      let error = { status, message: data.message };
      if (Object.keys(data).length > 1) {
        // @ts-ignore:disable-line
        error = { ...error, data };
      }
      throw error;
    }

    return {
      body: data,
      headers,
      status,
    };
  } catch (e) {
    throw e;
  }
}

function getRequestHeaders(body: any): any {
  const headers = body
    ? { Accept: 'application/json', 'Content-Type': 'application/json' }
    : { Accept: 'application/json' };

  return headers;
}

async function bodyOf(requestPromise: Promise<any>): Promise<any> {
  try {
    const response = await requestPromise;
    return response.body;
  } catch (e) {
    throw e;
  }
}

/**
 * Make best effort to turn a HTTP error or a runtime exception to meaningful error log message
 */
function logError(error: any, endpoint: string, method: string) {
  if (error.status) {
    const summary = `(${error.status} ${error.statusText}): ${error._bodyInit}`;
    console.error(`API request ${method.toUpperCase()} ${endpoint} responded with ${summary}`);
  } else {
    console.error(`API request ${method.toUpperCase()} ${endpoint} failed with message "${error.message}"`);
  }
}

export function getUser(userId: string): Promise<User> {
  return new Promise((resolve, reject) => {
    get(`/api/users/${userId}`)
      .then((res: User) => resolve(res))
      .catch(err => reject(err));
  });
}

export function getWebUser(token: string): Promise<User> {
  return new Promise((resolve, reject) => {
    get('/api/users-web/me', { token })
      .then(({ data }: { data: User }) => resolve(data))
      .catch((err: Error) => reject(err));
  });
}

export function createUserWeb(): Promise<User> {
  return post('/api/users-web');
}

export function getCities(token: string): Promise<City[]> {
  return new Promise((resolve, reject) => {
    get('/api/shipping/cities', { token })
      .then(({ data }: { data: City[] }) => resolve(data))
      .catch((err: Error) => reject(err));
  });
}

export function getDepartments(cityID: string): Promise<Department[]> {
  return new Promise((resolve, reject) => {
    get(`/api/shipping/departments/${cityID}`)
      .then(({ data }) => resolve(data))
      .catch(err => reject(err));
  });
}
export function getShippingCosts(
  price: string,
  orderId: string,
  recipientOfficeID: string,
  token: string,
  weight?: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    let weightQuery = '';
    if (weight) weightQuery = `&weight=${weight}`;
    get(`/api/shipping/costs/?price=${price}${weightQuery}&orderId=${orderId}&recipientOfficeID=${recipientOfficeID}`, {
      token,
    })
      .then(({ data }: { data: string }) => resolve(data))
      .catch((err: any) => reject(err));
  });
}

export function getProduct(uuid: string, options?: IOptions): Promise<Product> {
  return new Promise((resolve, reject) => {
    get(`/api/products/${uuid}`, options)
      .then(({ data }) => resolve(data))
      .catch(e => reject(e));
  });
}

export function getProducts(extra: string, options?: IOptions): Promise<Product[]> {
  return new Promise((resolve, reject) => {
    get(`/api/products/${extra}`, options)
      .then(({ data }) => resolve(data))
      .catch(e => reject(e));
  });
}

export function createOrder(uuid: string, token: string): Promise<Order | Error> {
  return new Promise((resolve, reject) => {
    post('/api/orders', { product: uuid }, { token })
      .then(({ data }: { data: Order }) => resolve(data))
      .catch((err: Error) => reject(err));
  });
}
