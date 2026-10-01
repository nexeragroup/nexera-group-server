import { Injectable } from '@nestjs/common';
import { GatewayName } from './enums/gateway-name.enum';
import { GatewayStatus } from './enums/gateway-status.enum';
import type { GatewayClient } from './interfaces/gateway-client.interface';
import type { GatewayRequest } from './interfaces/gateway-request.interface';
import type {
  GatewayHealthResponse,
  GatewayResponse,
} from './interfaces/gateway-response.interface';

/**
 * Central registry and orchestration service for internal gateways.
 *
 * Responsibilities:
 *
 * - resolve gateway clients
 * - dispatch generic gateway requests
 * - expose gateway health information
 * - aggregate health across all gateways
 *
 * This service MUST NOT implement:
 *
 * - HTTP transport
 * - encryption/decryption
 * - internal authentication
 * - retry logic
 * - provider-specific business operations
 *
 * Those responsibilities belong to GatewayHttpClient and the
 * provider-specific gateway clients.
 */
@Injectable()
export class GatewaysService {
  private readonly clients = new Map<GatewayName, GatewayClient>();

  /**
   * Returns a registered gateway client.
   *
   * Provider-specific business modules should normally inject
   * MetaGatewayClient, PmsGatewayClient, or RraGatewayClient
   * directly.
   *
   * This method is primarily intended for generic infrastructure
   * such as health checks and gateway orchestration.
   */
  getGatewayClient(gateway: GatewayName): GatewayClient {
    const client = this.clients.get(gateway);
    if (!client) {
      throw new Error(`Gateway client "${gateway}" is not registered.`);
    }
    return client;
  }

  /**
   * Sends a normalized request to the requested gateway.
   *
   * This method delegates all transport concerns to the
   * provider-specific client and ultimately GatewayHttpClient.
   */
  async sendGatewayRequest<TRequest = unknown, TResponse = unknown>(
    request: GatewayRequest<TRequest>,
  ): Promise<GatewayResponse<TResponse>> {
    const client = this.getGatewayClient(request.gateway);
    return client.sendGatewayRequest<TRequest, TResponse>(request);
  }

  /**
   * Checks the health of one gateway.
   */
  async checkGatewayHealth(
    gateway: GatewayName,
  ): Promise<GatewayHealthResponse> {
    const client = this.clients.get(gateway);

    if (!client) {
      return {
        gateway,
        status: GatewayStatus.DISABLED,
        latencyMs: null,
        checkedAt: new Date().toISOString(),
        upstream: {
          status: GatewayStatus.DISABLED,
          latencyMs: null,
          reason: 'GATEWAY_NOT_CONFIGURED',
        },
      };
    }

    try {
      return await client.checkGatewayHealth();
    } catch {
      return {
        gateway,

        status: GatewayStatus.UNHEALTHY,

        latencyMs: null,

        checkedAt: new Date().toISOString(),

        upstream: {
          status: GatewayStatus.UNKNOWN,

          latencyMs: null,

          reason: 'GATEWAY_HEALTH_CHECK_FAILED',
        },
      };
    }
  }

  /**
   * Checks all registered gateways concurrently.
   *
   * A failure in one gateway does not prevent health information
   * from being returned for other gateways.
   */
  async checkAllGatewaysHealth(): Promise<readonly GatewayHealthResponse[]> {
    const gateways = [...this.clients.keys()];

    return Promise.all(
      gateways.map((gateway) => this.checkGatewayHealth(gateway)),
    );
  }

  /**
   * Returns one summarized health status representing the entire
   * gateway layer.
   *
   * Rules:
   *
   * - UNHEALTHY when at least one gateway is unhealthy
   * - DEGRADED when at least one gateway is degraded
   * - UNKNOWN when no stronger status exists but a gateway is unknown
   * - HEALTHY when all enabled gateways are healthy
   * - DISABLED when no gateways are registered
   */
  async getGatewaysHealthStatus(): Promise<{
    readonly status: GatewayStatus;

    readonly gateways: readonly GatewayHealthResponse[];

    readonly checkedAt: string;
  }> {
    const gateways = await this.checkAllGatewaysHealth();

    const status = this.resolveAggregateStatus(gateways);

    return {
      status,

      gateways,

      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Returns true when a client exists for the supplied gateway.
   */
  hasGateway(gateway: GatewayName): boolean {
    return this.clients.has(gateway);
  }

  /**
   * Returns all gateway identifiers currently known by the
   * application.
   */
  findAllGatewayNames(): readonly GatewayName[] {
    return [...this.clients.keys()];
  }

  /**
   * Determines the aggregate gateway status.
   */
  private resolveAggregateStatus(
    gateways: readonly GatewayHealthResponse[],
  ): GatewayStatus {
    if (gateways.length === 0) {
      return GatewayStatus.DISABLED;
    }

    if (
      gateways.some((gateway) => gateway.status === GatewayStatus.UNHEALTHY)
    ) {
      return GatewayStatus.UNHEALTHY;
    }

    if (gateways.some((gateway) => gateway.status === GatewayStatus.DEGRADED)) {
      return GatewayStatus.DEGRADED;
    }

    if (gateways.some((gateway) => gateway.status === GatewayStatus.UNKNOWN)) {
      return GatewayStatus.UNKNOWN;
    }

    if (
      gateways.every((gateway) => gateway.status === GatewayStatus.DISABLED)
    ) {
      return GatewayStatus.DISABLED;
    }

    return GatewayStatus.HEALTHY;
  }
}
