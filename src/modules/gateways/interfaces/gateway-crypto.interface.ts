export interface EncryptedGatewayRequest {
  readonly requestId: string;
  readonly encrypted: string;
}

export interface EncryptedGatewayResponse {
  readonly operation: string;
  readonly requestId: string;
  readonly encrypted: string;
}

export interface GatewayCryptoOptions {
  readonly requestId?: string;
  readonly idempotencyKey?: string;
}
