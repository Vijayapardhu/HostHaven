import crypto from 'crypto';

/**
 * Mirrors the constant-time comparison used for Razorpay signatures in
 * payments.service.ts. Kept as a standalone unit so the security property can
 * be asserted without standing up the whole payments module.
 */
const signaturesMatch = (expected: string, received: unknown): boolean => {
  if (typeof received !== 'string') return false;

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

const sign = (payload: string, secret: string) =>
  crypto.createHmac('sha256', secret).update(payload).digest('hex');

describe('Razorpay signature comparison', () => {
  const secret = 'test-webhook-secret';
  const payload = '{"event":"payment.captured"}';

  it('accepts a signature produced with the shared secret', () => {
    expect(signaturesMatch(sign(payload, secret), sign(payload, secret))).toBe(
      true,
    );
  });

  it('rejects a signature produced with a different secret', () => {
    expect(
      signaturesMatch(sign(payload, secret), sign(payload, 'wrong-secret')),
    ).toBe(false);
  });

  it('rejects a signature for a tampered payload', () => {
    const tampered = '{"event":"payment.captured","amount":1}';
    expect(signaturesMatch(sign(payload, secret), sign(tampered, secret))).toBe(
      false,
    );
  });

  it('rejects a truncated signature without throwing', () => {
    const valid = sign(payload, secret);
    expect(() => signaturesMatch(valid, valid.slice(0, 10))).not.toThrow();
    expect(signaturesMatch(valid, valid.slice(0, 10))).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(signaturesMatch(sign(payload, secret), undefined)).toBe(false);
    expect(signaturesMatch(sign(payload, secret), null)).toBe(false);
    expect(signaturesMatch(sign(payload, secret), 12345)).toBe(false);
  });
});
