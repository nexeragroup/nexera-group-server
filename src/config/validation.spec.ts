import { validationSchema } from './validation';

describe('gateway crypto environment validation', () => {
  it('keeps encrypted gateway transport opt-in', () => {
    const result = validationSchema.validate({ CRYPTO_ENABLED: false });

    expect(result.error).toBeUndefined();
    expect(result.value.SERVER_KEY_ID).toBe('client-encryption-v1');
  });

  it('requires a complete peer configuration when encrypted transport is enabled', () => {
    const incomplete = validationSchema.validate({ CRYPTO_ENABLED: true });
    const configured = validationSchema.validate({
      CRYPTO_ENABLED: true,
      SERVER_PRIVATE_KEY_PATH: '/run/secrets/server-private.pem',
      GATEWAY_PUBLIC_KEY_PATH: '/run/secrets/gateway-public.pem',
      GATEWAY_ENABLED: true,
      GATEWAY_BASE_URL: 'https://gateway.example.test/api/v1',
      GATEWAY_API_KEY: 'a'.repeat(32),
    });

    expect(incomplete.error).toBeDefined();
    expect(configured.error).toBeUndefined();
  });
});
