import prismaMock from '../test/prismaMock';
import outboxService from './outbox.service';

jest.mock('../utils/logger.util', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mock = prismaMock as any;

describe('outboxService.processEvent', () => {
  beforeEach(() => {
    mock.outboxEvent = {
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    };
    // A throwaway handler per test run; register is once-only per type.
  });

  it('runs the handler exactly once when claimed', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    outboxService.register('test.run', handler);

    mock.outboxEvent.updateMany.mockResolvedValue({ count: 1 });
    mock.outboxEvent.findUnique.mockResolvedValue({
      id: 'evt-1',
      type: 'test.run',
      payload: { paymentId: 'p1' },
      attempts: 1,
      maxAttempts: 5,
    });
    mock.outboxEvent.update.mockResolvedValue({});

    const ran = await outboxService.processEvent('evt-1');

    expect(ran).toBe(true);
    expect(handler).toHaveBeenCalledWith({ paymentId: 'p1' });
    expect(mock.outboxEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
    );
  });

  it('does nothing when the event was already claimed', async () => {
    mock.outboxEvent.updateMany.mockResolvedValue({ count: 0 });

    const ran = await outboxService.processEvent('evt-2');

    expect(ran).toBe(false);
    expect(mock.outboxEvent.findUnique).not.toHaveBeenCalled();
  });

  it('reschedules a failed event with backoff, then fails permanently', async () => {
    const boom = jest.fn().mockRejectedValue(new Error('smtp down'));
    outboxService.register('test.fail', boom);

    mock.outboxEvent.updateMany.mockResolvedValue({ count: 1 });
    mock.outboxEvent.findUnique.mockResolvedValue({
      id: 'evt-3',
      type: 'test.fail',
      payload: {},
      attempts: 1,
      maxAttempts: 5,
    });
    mock.outboxEvent.update.mockResolvedValue({});

    await outboxService.processEvent('evt-3');

    // Attempt 1 of 5 → back to PENDING with a future availableAt.
    const retryCall = mock.outboxEvent.update.mock.calls[0][0];
    expect(retryCall.data.status).toBe('PENDING');
    expect(retryCall.data.lastError).toContain('smtp down');
    expect(retryCall.data.availableAt.getTime()).toBeGreaterThan(Date.now());

    // Final attempt → FAILED.
    mock.outboxEvent.findUnique.mockResolvedValue({
      id: 'evt-3',
      type: 'test.fail',
      payload: {},
      attempts: 5,
      maxAttempts: 5,
    });
    await outboxService.processEvent('evt-3');
    const finalCall = mock.outboxEvent.update.mock.calls[1][0];
    expect(finalCall.data.status).toBe('FAILED');
  });

  it('marks events with no handler as FAILED instead of retrying forever', async () => {
    mock.outboxEvent.updateMany.mockResolvedValue({ count: 1 });
    mock.outboxEvent.findUnique.mockResolvedValue({
      id: 'evt-4',
      type: 'test.unknown-type',
      payload: {},
      attempts: 1,
      maxAttempts: 5,
    });
    mock.outboxEvent.update.mockResolvedValue({});

    const ran = await outboxService.processEvent('evt-4');

    expect(ran).toBe(false);
    expect(mock.outboxEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
    );
  });
});
