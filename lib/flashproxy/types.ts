export type FlashProxyMethod = "GET" | "POST" | "PUT" | "DELETE";

export type FlashProxyQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type FlashProxyQuery = Record<string, FlashProxyQueryValue>;

export type FlashProxyRequestOptions<TBody = unknown> = {
  apiKey: string;
  method: FlashProxyMethod;
  path: `/${string}`;
  query?: FlashProxyQuery;
  body?: TBody;
  idempotencyKey?: string;
  signal?: AbortSignal;
};

export type FlashProxySuccessResponse<TData> = {
  success: true;
  data: TData;
};

export type FlashProxyErrorPayload = {
  code?: string;
  message?: string;
  details?: unknown;
};

export type FlashProxyFailureResponse = {
  success: false;
  error?: FlashProxyErrorPayload;
};

export type FlashProxyResponse<TData> =
  | FlashProxySuccessResponse<TData>
  | FlashProxyFailureResponse
  | TData;

export type FlashProxyResult<TData> = {
  data: TData;
  status: number;
  durationMs: number;
};
