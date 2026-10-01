import type { GatewayErrorCode } from '../constants/gateway.constants';
import { GatewayName } from '../enums/gateway-name.enum';

/**
 * Safe normalized gateway error information.
 *
 * This interface must not contain:
 *
 * - Axios configuration
 * - API keys
 * - encryption material
 * - authorization headers
 * - raw request payloads
 * - raw provider error bodies
 */
export interface GatewayErrorDetails {
  readonly code: GatewayErrorCode;
  readonly message: string;
  readonly gateway: GatewayName;
  readonly operation: string | null;
  readonly statusCode: number | null;
  readonly retryable: boolean;
  readonly requestId: string | null;
  readonly traceId: string | null;

  /**
   * Optional sanitized code supplied by the gateway.
   *
   * Example:
   *
   * RRA_VALIDATION_FAILED
   * PMS_UNAVAILABLE
   */
  readonly upstreamCode?: string | null;
}
