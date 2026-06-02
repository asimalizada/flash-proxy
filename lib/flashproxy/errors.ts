export type FlashProxyErrorInput = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  durationMs: number;
};

export class FlashProxyError extends Error {
  status: number;
  code: string;
  details?: unknown;
  durationMs: number;

  constructor(input: FlashProxyErrorInput) {
    super(input.message);
    this.name = "FlashProxyError";
    this.status = input.status;
    this.code = input.code;
    this.details = input.details;
    this.durationMs = input.durationMs;
  }

  toJSON() {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      details: this.details,
      durationMs: this.durationMs,
    };
  }
}

export function isFlashProxyError(error: unknown): error is FlashProxyError {
  return error instanceof FlashProxyError;
}
