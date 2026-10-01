import { GatewayName } from '../enums/gateway-name.enum';
import type { GatewayRequest } from './gateway-request.interface';

import type {
  GatewayHealthResponse,
  GatewayResponse,
} from './gateway-response.interface';

/**
 * Common contract implemented by gateway transport/client
 * components.
 */
export interface GatewayClient {
  readonly gatewayName: GatewayName;

  /**
   * Sends one normalized gateway request.
   */
  sendGatewayRequest<TRequest = unknown, TResponse = unknown>(
    request: GatewayRequest<TRequest>,
  ): Promise<GatewayResponse<TResponse>>;

  /**
   * Checks gateway availability.
   */
  checkGatewayHealth(): Promise<GatewayHealthResponse>;
}
