/**
 * Maximum supported gateway operation identifier length.
 *
 * Examples:
 *
 * sales.create
 * invoice.submit
 * whatsapp.message.send
 */
export const GATEWAY_OPERATION_MAX_LENGTH = 100;

/**
 * Same operation format used by the gateway's SecureOperation
 * boundary.
 */
export const GATEWAY_OPERATION_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/;

/**
 * Request and trace IDs are intentionally bounded before they
 * reach logs, metrics, downstream services, or HTTP headers.
 */
export const GATEWAY_CORRELATION_ID_MAX_LENGTH = 128;
export const GATEWAY_CORRELATION_ID_PATTERN = /^[a-zA-Z0-9._:-]{1,128}$/;

/**
 * Idempotency keys may be supplied by business modules for
 * operations that must not execute twice.
 */
export const GATEWAY_IDEMPOTENCY_KEY_MAX_LENGTH = 128;
export const GATEWAY_IDEMPOTENCY_KEY_PATTERN = /^[a-zA-Z0-9._:/-]{1,128}$/;

/**
 * Relative gateway route maximum.
 */
export const GATEWAY_PATH_MAX_LENGTH = 512;

/**
 * Prevent accidentally passing absolute URLs through provider
 * clients.
 *
 * Gateway base URLs come exclusively from trusted application
 * configuration.
 */
export const GATEWAY_PATH_PATTERN = /^\/(?!\/)[a-zA-Z0-9._~!$&'()*+,;=:@%/-]*$/;

/**
 * Default timeout for ordinary gateway operations.
 */
export const GATEWAY_DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Health checks should fail much faster than normal business
 * operations.
 */
export const GATEWAY_HEALTH_TIMEOUT_MS = 3_000;

/**
 * Lower and upper bounds for custom operation timeouts.
 */
export const GATEWAY_MIN_TIMEOUT_MS = 100;

export const GATEWAY_MAX_TIMEOUT_MS = 30_000;

/**
 * Protect the server from unexpectedly large downstream
 * responses.
 *
 * The low-level HTTP client should enforce this limit.
 */
export const GATEWAY_MAX_RESPONSE_BYTES = 1_048_576; // 1 MiB

/**
 * Standard correlation headers shared between the server and
 * internal gateways.
 */
export const GATEWAY_HEADERS = {
  REQUEST_ID: 'x-request-id',
  TRACE_ID: 'x-trace-id',
  IDEMPOTENCY_KEY: 'x-idempotency-key',
  CONTENT_TYPE: 'content-type',
  ACCEPT: 'accept',
} as const;

/**
 * Stable normalized error codes.
 *
 * Raw Axios/network/provider errors should never cross the
 * gateway module boundary.
 */
export const GATEWAY_ERROR_CODES = {
  UNAVAILABLE: 'GATEWAY_UNAVAILABLE',
  TIMEOUT: 'GATEWAY_TIMEOUT',
  AUTHENTICATION_FAILED: 'GATEWAY_AUTHENTICATION_FAILED',
  INVALID_REQUEST: 'GATEWAY_INVALID_REQUEST',
  INVALID_RESPONSE: 'GATEWAY_INVALID_RESPONSE',
  REQUEST_FAILED: 'GATEWAY_REQUEST_FAILED',
  UPSTREAM_FAILED: 'GATEWAY_UPSTREAM_FAILED',
  RATE_LIMITED: 'GATEWAY_RATE_LIMITED',
  DISABLED: 'GATEWAY_DISABLED',
} as const;

export type GatewayErrorCode =
  (typeof GATEWAY_ERROR_CODES)[keyof typeof GATEWAY_ERROR_CODES];

/**
 * Status codes that may later participate in retry decisions.
 *
 * This does NOT mean every request should automatically retry.
 * POST requests, for example, require idempotency guarantees.
 */
export const GATEWAY_TRANSIENT_STATUS_CODES = [
  408, 425, 429, 500, 502, 503, 504,
] as const;
