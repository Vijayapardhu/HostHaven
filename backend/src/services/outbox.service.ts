import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { logger } from '../utils/logger.util';

/**
 * Transactional outbox for side effects that must not be lost and must not
 * fail their originating request.
 *
 * The pattern: enqueue the event INSIDE the same transaction that commits the
 * business change (e.g. the payment), so the event exists if and only if the
 * change does. A worker then executes it with retry and exponential backoff.
 * The caller may also process the event inline immediately after commit for
 * snappy UX — the claim step guarantees inline and worker never both run it.
 *
 * Handlers are registered by the owning module (registry rather than imports,
 * so this service never depends on the modules it serves).
 */

type OutboxHandler = (payload: Prisma.JsonValue) => Promise<void>;

type PrismaClientLike = Pick<typeof prisma, 'outboxEvent'>;

const handlers = new Map<string, OutboxHandler>();

const POLL_INTERVAL_MS = 15_000;
/** PROCESSING rows older than this are presumed crashed and reclaimed. */
const STALE_PROCESSING_MS = 10 * 60 * 1000;
const BATCH_SIZE = 10;

let pollTimer: NodeJS.Timeout | null = null;

const backoffDelayMs = (attempts: number): number =>
  Math.min(2 ** attempts * 60_000, 60 * 60 * 1000); // 1m, 2m, 4m … capped at 1h

export const outboxService = {
  register(type: string, handler: OutboxHandler) {
    if (handlers.has(type)) {
      throw new Error(`Outbox handler already registered for "${type}"`);
    }
    handlers.set(type, handler);
  },

  /**
   * Enqueues an event. Pass the transaction client when calling from inside a
   * transaction so the event commits atomically with the business change.
   */
  async enqueue(
    client: PrismaClientLike,
    type: string,
    payload: Prisma.InputJsonValue,
  ) {
    return client.outboxEvent.create({
      data: { type, payload },
    });
  },

  /**
   * Claims and runs a single event. Safe to call concurrently from the inline
   * path and the worker: the guarded update lets exactly one runner through.
   */
  async processEvent(eventId: string): Promise<boolean> {
    const claimed = await prisma.outboxEvent.updateMany({
      where: { id: eventId, status: 'PENDING' },
      data: { status: 'PROCESSING', attempts: { increment: 1 } },
    });
    if (claimed.count === 0) return false;

    const event = await prisma.outboxEvent.findUnique({ where: { id: eventId } });
    if (!event) return false;

    const handler = handlers.get(event.type);
    if (!handler) {
      await prisma.outboxEvent.update({
        where: { id: eventId },
        data: { status: 'FAILED', lastError: `No handler for "${event.type}"` },
      });
      logger.error({ eventId, type: event.type }, 'Outbox event has no handler');
      return false;
    }

    try {
      await handler(event.payload);
      await prisma.outboxEvent.update({
        where: { id: eventId },
        data: { status: 'COMPLETED', lastError: null },
      });
      return true;
    } catch (error: any) {
      const exhausted = event.attempts >= event.maxAttempts;
      await prisma.outboxEvent.update({
        where: { id: eventId },
        data: {
          status: exhausted ? 'FAILED' : 'PENDING',
          lastError: String(error?.message ?? error).slice(0, 1000),
          availableAt: new Date(Date.now() + backoffDelayMs(event.attempts)),
        },
      });
      logger.error(
        { eventId, type: event.type, attempts: event.attempts, exhausted, error },
        'Outbox event failed',
      );
      return false;
    }
  },

  /** One worker pass: reclaim stale work, then run everything due. */
  async drainDueEvents() {
    // Reclaim events whose runner crashed mid-processing.
    await prisma.outboxEvent.updateMany({
      where: {
        status: 'PROCESSING',
        updatedAt: { lt: new Date(Date.now() - STALE_PROCESSING_MS) },
      },
      data: { status: 'PENDING' },
    });

    const due = await prisma.outboxEvent.findMany({
      where: { status: 'PENDING', availableAt: { lte: new Date() } },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
      select: { id: true },
    });

    for (const { id } of due) {
      await this.processEvent(id);
    }

    return due.length;
  },

  startWorker() {
    if (pollTimer) return;
    pollTimer = setInterval(() => {
      this.drainDueEvents().catch((error) => {
        logger.error({ error }, 'Outbox worker pass failed');
      });
    }, POLL_INTERVAL_MS);
    // Never keep the process alive just for polling.
    pollTimer.unref?.();
    logger.info({ intervalMs: POLL_INTERVAL_MS }, 'Outbox worker started');
  },

  stopWorker() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  },
};

export default outboxService;
