import { GatewayName } from '../enums/gateway-name.enum';

export type GatewayHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type GatewayQueryPrimitive = string | number | boolean;
export type GatewayQueryValue =
  GatewayQueryPrimitive | readonly GatewayQueryPrimitive[];
export type GatewayQuery = Readonly<Record<string, GatewayQueryValue>>;

/**
 * Request context propagated across internal services.
 */
export interface GatewayRequestContext {
  readonly requestId?: string;
  readonly traceId?: string;
  readonly idempotencyKey?: string;
}

/**
 * Generic outbound request sent to one of the internal gateway
 * applications.
 *
 * TPayload is intentionally generic so provider-specific clients
 * can preserve strong request typing.
 */
export interface GatewayRequest<TPayload = unknown> {
  readonly gateway: GatewayName;

  /**
   * Stable logical operation.
   *
   * Examples:
   *
   * sale.create
   * invoice.submit
   * whatsapp.message.send
   */
  readonly operation: string;
  readonly method: GatewayHttpMethod;

  /**
   * Relative gateway path only.
   *
   * Example:
   *
   * /api/v1/sales
   *
   * Never:
   *
   * https://gateway.example.com/api/v1/sales
   */
  readonly path: string;
  readonly payload?: TPayload;
  readonly query?: GatewayQuery;
  readonly context?: GatewayRequestContext;

  /**
   * Optional per-operation timeout.
   *
   * GatewayHttpClient must enforce configured bounds.
   */
  readonly timeoutMs?: number;
}
