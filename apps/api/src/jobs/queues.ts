/**
 * BullMQ job processors — run in the separate worker process, never in-process with HTTP API.
 * Phase 2: image-processing, search-index, notification, outbox-relay.
 */

export const QUEUE_NAMES = {
  IMAGE_PROCESSING: 'image-processing',
  SEARCH_INDEX: 'search-index',
  NOTIFICATION: 'notification',
  KVKK: 'kvkk',
  OUTBOX_RELAY: 'outbox-relay',
} as const;
