import { Injectable } from '@nestjs/common';
import { GatewayName } from '../enums/gateway-name.enum';
import { GatewayClient } from '../interfaces/gateway-client.interface';
import { GatewayRequest } from '../interfaces/gateway-request.interface';
import {
  GatewayResponse,
  GatewayHealthResponse,
} from '../interfaces/gateway-response.interface';

@Injectable()
export class RraGatewayClient implements GatewayClient {
  readonly gatewayName = GatewayName.RRA;

  async sendGatewayRequest<TRequest, TResponse>(
    request: GatewayRequest<TRequest>,
  ): Promise<GatewayResponse<TResponse>> {
    // We will implement this next.
    throw new Error('Not implemented');
  }

  async checkGatewayHealth(): Promise<GatewayHealthResponse> {
    // We will implement this next.
    throw new Error('Not implemented');
  }
}
