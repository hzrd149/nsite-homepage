import { EventStore } from "applesauce-core/event-store";
import { persistEventsToCache } from "applesauce-core/helpers";
import { createAddressLoader } from "applesauce-loaders/loaders";
import { RelayPool } from "applesauce-relay";
import { Filter, verifyEvent } from "nostr-tools";

import { appRelays } from "./settings";

// Load events from cache
export async function cacheRequest(filters: Filter[]) {
  return window.nostrdb.filters(filters);
}

export const pool = new RelayPool();
export const eventStore = new EventStore();

eventStore.verifyEvent = verifyEvent;

// Create functional address loader - using rxNostr as pool since it implements the required interface
export const addressLoader = createAddressLoader(pool, {
  eventStore,
  cacheRequest,
  extraRelays: appRelays,
  bufferTime: 200,
});

// Attach loaders to event store for loading events
eventStore.replaceableLoader = addressLoader
eventStore.addressableLoader = addressLoader

// Save all new events to cache
persistEventsToCache(eventStore, async events => {
  await Promise.allSettled(events.map(event => window.nostrdb.add(event)))
});
