import { GatewayName } from '../enums/gateway-name.enum';
import { GatewayStatus } from '../enums/gateway-status.enum';

/**
 * Metadata added by the server-side gateway transport layer.
 */
export interface GatewayResponseMetadata {
  readonly gateway: GatewayName;
  readonly operation: string;
  readonly statusCode: number;
  readonly durationMs: number;
  readonly requestId: string | null;
  readonly traceId: string | null;
  readonly receivedAt: string;
}

/**
 * Normalized successful gateway response.
 *
 * Failures should normally be represented using gateway-specific
 * exceptions rather than success:false responses.
 */
export interface GatewayResponse<TData = unknown> {
  readonly success: true;
  readonly data: TData;
  readonly metadata: GatewayResponseMetadata;
}

/**
 * Health representation used by the gateway and health modules.
 */
export interface GatewayHealthResponse {
  readonly gateway: GatewayName;
  readonly status: GatewayStatus;
  readonly latencyMs: number | null;
  readonly checkedAt: string;
  readonly upstream?: GatewayUpstreamHealth;
}

export interface GatewayUpstreamHealth {
  readonly status: GatewayStatus;
  readonly latencyMs?: number | null;

  /**
   * Stable reason code only.
   *
   * Do not expose raw provider/network errors here.
   */
  readonly reason?: string | null;
}
