import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { SECURE_MESSAGE_MAX_TTL_SECONDS } from '../../../common/crypto/secure-message';
import { RedisService } from '../../../common/services/redis.service';

const REPLAY_RETENTION_GRACE_SECONDS = 30;
const CONSUME_RESPONSE_SCRIPT = `
  if redis.call('GET', KEYS[1]) then
    return redis.call('DEL', KEYS[1])
  end

  return 0
`;

/**
 * Protects server -> gateway request/response exchanges against
 * replay.
 *
 * When the server creates an encrypted gateway request, the
 * request ID is reserved in Redis.
 *
 * The matching encrypted response may consume that reservation
 * exactly once.
 */
@Injectable()
export class GatewayReplayProtectionService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Reserves an outbound gateway request ID.
   *
   * NX guarantees that the same request ID cannot accidentally
   * be reserved more than once across multiple application
   * instances.
   */
  async reserveGatewayRequest(
    serverId: string,
    gatewayId: string,
    requestId: string,
    expiresAt: number,
  ): Promise<void> {
    const ttlSeconds = this.getReplayTtlSeconds(expiresAt);

    const key = this.createReplayKey(serverId, gatewayId, requestId);

    let result: 'OK' | null;

    try {
      result = await this.redisService
        .getClient('cache')
        .set(key, '1', 'EX', ttlSeconds, 'NX');
    } catch (error) {
      throw new Error('Gateway replay protection is unavailable.', {
        cause: error,
      });
    }

    if (result !== 'OK') {
      throw new Error('The gateway request ID is already pending.');
    }
  }

  /**
   * Consumes a previously reserved request ID.
   *
   * The operation is atomic in Redis so two application
   * instances cannot both accept the same gateway response.
   */
  async consumeGatewayResponse(
    serverId: string,
    gatewayId: string,
    requestId: string,
  ): Promise<void> {
    const key = this.createReplayKey(serverId, gatewayId, requestId);

    let result: unknown;

    try {
      result = await this.redisService
        .getClient('cache')
        .eval(CONSUME_RESPONSE_SCRIPT, 1, key);
    } catch (error) {
      throw new Error('Gateway replay protection is unavailable.', {
        cause: error,
      });
    }

    if (Number(result) !== 1) {
      throw new Error(
        'The gateway response is expired, unknown, or already consumed.',
      );
    }
  }

  /**
   * Calculates how long the pending request reservation must
   * remain in Redis.
   *
   * A small grace period protects against timing differences
   * between the gateway and server.
   */
  private getReplayTtlSeconds(expiresAt: number): number {
    if (!Number.isSafeInteger(expiresAt)) {
      throw new TypeError('Gateway request expiry is invalid.');
    }

    const now = Math.floor(Date.now() / 1_000);

    const remainingSeconds = expiresAt - now;

    if (remainingSeconds <= 0) {
      throw new RangeError('Gateway request expiry must be in the future.');
    }

    if (remainingSeconds > SECURE_MESSAGE_MAX_TTL_SECONDS) {
      throw new RangeError(
        'Gateway request expiry exceeds the supported secure-message lifetime.',
      );
    }

    return remainingSeconds + REPLAY_RETENTION_GRACE_SECONDS;
  }

  /**
   * Hashes the identifying values before storing them in Redis.
   *
   * This prevents raw server IDs, gateway IDs, and request IDs
   * from becoming part of Redis key names.
   */
  private createReplayKey(
    serverId: string,
    gatewayId: string,
    requestId: string,
  ): string {
    const digest = createHash('sha256')
      .update([serverId, gatewayId, requestId].join('\u0000'), 'utf8')
      .digest('base64url');

    return `gateway-crypto:pending:${digest}`;
  }
}
