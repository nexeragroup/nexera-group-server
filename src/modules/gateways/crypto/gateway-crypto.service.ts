import { Injectable, OnModuleInit } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { randomUUID } from 'node:crypto';

import { readFile } from 'node:fs/promises';

import {
  decryptJson,
  encryptJson,
  importPrivateKey,
  importPublicKey,
  type ImportedPrivateKey,
  type ImportedPublicKey,
} from '../../../common/crypto/jwe';

import {
  SECURE_MESSAGE_MAX_TTL_SECONDS,
  SECURE_MESSAGE_VERSION,
  assertSecureIdentifier,
  validateSecureMessage,
  type SecureMessage,
} from '../../../common/crypto/secure-message';

import { GatewayName } from '../enums/gateway-name.enum';

import type {
  EncryptedGatewayRequest,
  EncryptedGatewayResponse,
  GatewayCryptoOptions,
} from '../interfaces/gateway-crypto.interface';

import { GatewayReplayProtectionService } from './gateway-replay-protection.service';

/**
 * Configuration belonging to this application/server.
 */
interface ServerCryptoRuntimeConfig {
  readonly serverId: string;

  readonly serverKeyId: string;

  readonly serverPrivateKeyPath: string;

  readonly messageTtlSeconds: number;
}

/**
 * Public-key configuration for one gateway.
 */
interface GatewayCryptoRuntimeConfig {
  readonly gateway: GatewayName;

  readonly gatewayId: string;

  readonly gatewayKeyId: string;

  readonly gatewayPublicKeyPath: string;
}

/**
 * Public key plus its validated runtime configuration.
 */
interface ReadyGatewayCryptoState {
  readonly settings: GatewayCryptoRuntimeConfig;

  readonly publicKey: ImportedPublicKey;
}

@Injectable()
export class GatewayCryptoService implements OnModuleInit {
  readonly enabled: boolean;

  private readonly serverSettings: ServerCryptoRuntimeConfig | null;

  /**
   * Configurations for gateways that are enabled.
   */
  private readonly gatewaySettings = new Map<
    GatewayName,
    GatewayCryptoRuntimeConfig
  >();

  /**
   * Server private key used to decrypt responses sent to this
   * application.
   */
  private serverPrivateKey: ImportedPrivateKey | null = null;

  /**
   * Each gateway owns its own public key.
   *
   * Requests destined for a gateway are encrypted using the
   * corresponding public key.
   */
  private readonly gatewayPublicKeys = new Map<
    GatewayName,
    ImportedPublicKey
  >();

  constructor(
    private readonly config: ConfigService,

    private readonly replayProtection: GatewayReplayProtectionService,
  ) {
    this.enabled = this.config.get<boolean>('crypto.enabled', false);

    this.serverSettings = this.enabled ? this.loadServerRuntimeConfig() : null;

    if (this.enabled) {
      this.loadGatewayRuntimeConfigs();
    }
  }

  /**
   * Loads all cryptographic key material once during application
   * startup.
   *
   * Missing or invalid key material fails startup instead of
   * allowing the application to discover the problem during the
   * first production request.
   */
  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const serverSettings = this.getServerSettings();

    try {
      const serverPrivateKeyPem = await readFile(
        serverSettings.serverPrivateKeyPath,
        'utf8',
      );

      this.serverPrivateKey = await importPrivateKey(serverPrivateKeyPem);

      await Promise.all(
        [...this.gatewaySettings.values()].map(async (gatewaySettings) => {
          const publicKeyPem = await readFile(
            gatewaySettings.gatewayPublicKeyPath,
            'utf8',
          );

          const publicKey = await importPublicKey(publicKeyPem);

          this.gatewayPublicKeys.set(gatewaySettings.gateway, publicKey);
        }),
      );
    } catch (error) {
      throw new Error(
        'Gateway encryption key initialization failed. Verify the configured RSA key material.',
        {
          cause: error,
        },
      );
    }
  }

  /**
   * Encrypts one outbound request for a particular gateway.
   */
  async encryptGatewayRequest(
    gateway: GatewayName,

    operation: string,

    data: Record<string, unknown>,

    options: GatewayCryptoOptions = {},
  ): Promise<EncryptedGatewayRequest> {
    const { serverSettings, gatewaySettings, gatewayPublicKey } =
      this.getReadyGatewayState(gateway);

    assertSecureIdentifier(operation, 'Gateway operation');

    const requestId = options.requestId ?? randomUUID();

    assertSecureIdentifier(requestId, 'Gateway request ID');

    const now = Math.floor(Date.now() / 1_000);

    const expiresAt = now + serverSettings.messageTtlSeconds;

    const message: SecureMessage = validateSecureMessage(
      {
        version: SECURE_MESSAGE_VERSION,

        kind: 'request',

        requestId,

        sender: serverSettings.serverId,

        recipient: gatewaySettings.gatewayId,

        operation,

        issuedAt: now,

        expiresAt,

        ...(options.idempotencyKey !== undefined
          ? {
              idempotencyKey: options.idempotencyKey,
            }
          : {}),

        data,
      },

      {
        kind: 'request',

        sender: serverSettings.serverId,

        recipient: gatewaySettings.gatewayId,

        operation,

        requestId,
      },

      now,
    );

    const encrypted = await encryptJson(
      message,

      gatewayPublicKey,

      gatewaySettings.gatewayKeyId,
    );

    /**
     * Reserve only after the message has successfully been
     * constructed and encrypted.
     *
     * If reservation fails the request must not be sent.
     */
    await this.replayProtection.reserveGatewayRequest(
      serverSettings.serverId,

      gatewaySettings.gatewayId,

      requestId,

      expiresAt,
    );

    return {
      requestId,

      encrypted,
    };
  }

  /**
   * Decrypts and validates a response returned by a specific
   * gateway.
   */
  async decryptGatewayResponse(
    gateway: GatewayName,

    input: EncryptedGatewayResponse,
  ): Promise<Record<string, unknown>> {
    const { serverSettings, gatewaySettings, serverPrivateKey } =
      this.getReadyGatewayState(gateway);

    assertSecureIdentifier(input.operation, 'Gateway operation');

    assertSecureIdentifier(input.requestId, 'Gateway request ID');

    const decrypted = await decryptJson(
      input.encrypted,

      serverPrivateKey,

      serverSettings.serverKeyId,
    );

    /**
     * The decrypted envelope must match the exact request that
     * was originally sent.
     *
     * This binds:
     *
     * - response kind
     * - gateway identity
     * - server identity
     * - operation
     * - request ID
     */
    const message = validateSecureMessage(
      decrypted,

      {
        kind: 'response',

        sender: gatewaySettings.gatewayId,

        recipient: serverSettings.serverId,

        operation: input.operation,

        requestId: input.requestId,
      },
    );

    /**
     * Consume the reservation only after successful decryption
     * and validation.
     *
     * An invalid response therefore cannot consume a legitimate
     * pending request.
     */
    await this.replayProtection.consumeGatewayResponse(
      serverSettings.serverId,

      gatewaySettings.gatewayId,

      input.requestId,
    );

    return message.data;
  }

  /**
   * Allows health infrastructure to determine whether crypto is
   * initialized for a gateway without exposing key material.
   */
  isGatewayCryptoReady(gateway: GatewayName): boolean {
    if (!this.enabled || !this.serverPrivateKey) {
      return false;
    }

    return (
      this.gatewaySettings.has(gateway) && this.gatewayPublicKeys.has(gateway)
    );
  }

  /**
   * Returns the initialized cryptographic state needed for one
   * gateway request.
   */
  private getReadyGatewayState(gateway: GatewayName): {
    readonly serverSettings: ServerCryptoRuntimeConfig;

    readonly gatewaySettings: GatewayCryptoRuntimeConfig;

    readonly serverPrivateKey: ImportedPrivateKey;

    readonly gatewayPublicKey: ImportedPublicKey;
  } {
    if (!this.enabled) {
      throw new Error('Gateway encryption is disabled.');
    }

    const serverSettings = this.getServerSettings();

    if (!this.serverPrivateKey) {
      throw new Error('Server gateway encryption key is not initialized.');
    }

    const gatewaySettings = this.gatewaySettings.get(gateway);

    if (!gatewaySettings) {
      throw new Error(
        `Gateway crypto configuration is unavailable for "${gateway}".`,
      );
    }

    const gatewayPublicKey = this.gatewayPublicKeys.get(gateway);

    if (!gatewayPublicKey) {
      throw new Error(
        `Gateway public key is not initialized for "${gateway}".`,
      );
    }

    return {
      serverSettings,

      gatewaySettings,

      serverPrivateKey: this.serverPrivateKey,

      gatewayPublicKey,
    };
  }

  private getServerSettings(): ServerCryptoRuntimeConfig {
    if (!this.serverSettings) {
      throw new Error('Gateway encryption configuration is unavailable.');
    }

    return this.serverSettings;
  }

  /**
   * Loads settings owned by the main server.
   */
  private loadServerRuntimeConfig(): ServerCryptoRuntimeConfig {
    const messageTtlSeconds = this.config.getOrThrow<number>(
      'crypto.messageTtlSeconds',
    );

    if (
      !Number.isSafeInteger(messageTtlSeconds) ||
      messageTtlSeconds < 1 ||
      messageTtlSeconds > SECURE_MESSAGE_MAX_TTL_SECONDS
    ) {
      throw new Error('crypto.messageTtlSeconds is invalid.');
    }

    const settings: ServerCryptoRuntimeConfig = {
      serverId: this.getRequiredString('crypto.serverId'),

      serverKeyId: this.getRequiredString('crypto.serverKeyId'),

      serverPrivateKeyPath: this.getRequiredString(
        'crypto.serverPrivateKeyPath',
      ),

      messageTtlSeconds,
    };

    assertSecureIdentifier(settings.serverId, 'crypto.serverId');

    assertSecureIdentifier(settings.serverKeyId, 'crypto.serverKeyId');

    return settings;
  }

  /**
   * Loads crypto settings for every enabled gateway.
   *
   * Disabled gateways do not require key material.
   */
  private loadGatewayRuntimeConfigs(): void {
    const gatewayIds = new Set<string>();

    for (const gateway of Object.values(GatewayName)) {
      const enabled = this.config.get<boolean>(
        `gateways.${gateway}.enabled`,
        false,
      );

      if (!enabled) {
        continue;
      }

      const gatewayId = this.getRequiredString(
        `gateways.${gateway}.crypto.gatewayId`,
      );

      const gatewayKeyId = this.getRequiredString(
        `gateways.${gateway}.crypto.gatewayKeyId`,
      );

      const gatewayPublicKeyPath = this.getRequiredString(
        `gateways.${gateway}.crypto.gatewayPublicKeyPath`,
      );

      assertSecureIdentifier(gatewayId, `${gateway} gateway ID`);

      assertSecureIdentifier(gatewayKeyId, `${gateway} gateway key ID`);

      if (gatewayId === this.serverSettings?.serverId) {
        throw new Error(
          `Gateway "${gateway}" cannot use the same identity as the server.`,
        );
      }

      if (gatewayIds.has(gatewayId)) {
        throw new Error(
          `Duplicate gateway identity "${gatewayId}" is configured.`,
        );
      }

      gatewayIds.add(gatewayId);

      this.gatewaySettings.set(gateway, {
        gateway,

        gatewayId,

        gatewayKeyId,

        gatewayPublicKeyPath,
      });
    }
  }

  private getRequiredString(key: string): string {
    const value = this.config.getOrThrow<string>(key).trim();

    if (!value) {
      throw new Error(`${key} must not be empty.`);
    }

    return value;
  }
}
