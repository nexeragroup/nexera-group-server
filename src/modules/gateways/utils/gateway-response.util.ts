import {
  GATEWAY_CORRELATION_ID_MAX_LENGTH,
  GATEWAY_CORRELATION_ID_PATTERN,
  GATEWAY_OPERATION_MAX_LENGTH,
  GATEWAY_OPERATION_PATTERN,
  GATEWAY_PATH_MAX_LENGTH,
  GATEWAY_PATH_PATTERN,
} from '../constants/gateway.constants';
import { GatewayName } from '../enums/gateway-name.enum';
import type { GatewayResponse } from '../interfaces/gateway-response.interface';

/**
 * Normalizes and validates a gateway operation identifier.
 */
export function normalizeGatewayOperation(value: string): string {
  if (typeof value !== 'string') {
    throw new TypeError('Gateway operation must be a string');
  }

  const normalized = value.trim();

  if (
    !normalized ||
    normalized.length > GATEWAY_OPERATION_MAX_LENGTH ||
    !GATEWAY_OPERATION_PATTERN.test(normalized)
  ) {
    throw new TypeError('Invalid gateway operation');
  }

  return normalized;
}

/**
 * Ensures the gateway receives only relative application paths.
 *
 * Absolute URLs are intentionally rejected.
 */
export function normalizeGatewayPath(value: string): string {
  if (typeof value !== 'string') {
    throw new TypeError('Gateway path must be a string');
  }

  const normalized = value.trim();

  if (
    !normalized ||
    normalized.length > GATEWAY_PATH_MAX_LENGTH ||
    !GATEWAY_PATH_PATTERN.test(normalized)
  ) {
    throw new TypeError('Invalid gateway path');
  }

  return normalized;
}

/**
 * Validates request/trace identifiers before propagation.
 */
export function normalizeGatewayCorrelationId(
  value: string | undefined | null,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();

  if (
    !normalized ||
    normalized.length > GATEWAY_CORRELATION_ID_MAX_LENGTH ||
    !GATEWAY_CORRELATION_ID_PATTERN.test(normalized)
  ) {
    return null;
  }

  return normalized;
}

/**
 * Creates the common normalized gateway success response.
 */
export function createGatewayResponse<TData>(input: {
  gateway: GatewayName;
  operation: string;
  statusCode: number;
  data: TData;
  durationMs: number;
  requestId?: string | null;
  traceId?: string | null;
  receivedAt?: Date;
}): GatewayResponse<TData> {
  if (
    !Number.isInteger(input.statusCode) ||
    input.statusCode < 100 ||
    input.statusCode > 599
  ) {
    throw new TypeError('Invalid gateway HTTP status code');
  }

  if (!Number.isFinite(input.durationMs) || input.durationMs < 0) {
    throw new TypeError('Invalid gateway response duration');
  }

  return {
    success: true,
    data: input.data,
    metadata: {
      gateway: input.gateway,
      operation: normalizeGatewayOperation(input.operation),
      statusCode: input.statusCode,
      durationMs: Math.round(input.durationMs * 100) / 100,
      requestId: normalizeGatewayCorrelationId(input.requestId),
      traceId: normalizeGatewayCorrelationId(input.traceId),
      receivedAt: (input.receivedAt ?? new Date()).toISOString(),
    },
  };
}

/**
 * Useful for response-validation boundaries.
 */
export function isGatewaySuccessStatus(statusCode: number): boolean {
  return Number.isInteger(statusCode) && statusCode >= 200 && statusCode < 300;
}
