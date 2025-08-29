import { EventStore } from "applesauce-core/event-store";
import { presistEventsToCache } from "applesauce-core/helpers/event-cache";
import { createAddressLoader } from "applesauce-loaders/loaders";
import { RelayPool } from "applesauce-relay";
import { addEvents, getEventsForFilters, openDB } from "nostr-idb";
import { Filter, verifyEvent } from "nostr-tools";
import { appRelays } from "./settings";

let nostrIdb:
  | Promise<ReturnType<typeof openDB>>
  | ReturnType<typeof openDB>
  | undefined = undefined;

async function getNostrIdb() {
  if (!nostrIdb) nostrIdb = openDB();
  return await nostrIdb;
}

export async function cacheRequest(filters: Filter[]) {
  const db = await getNostrIdb();
  return getEventsForFilters(db, filters);
}

export const pool = new RelayPool();
export const eventStore = new EventStore();

eventStore.verifyEvent = verifyEvent;

// Persist new events to cache
presistEventsToCache(eventStore, async (events) =>
  addEvents(await getNostrIdb(), events),
);

// Create functional address loader - using rxNostr as pool since it implements the required interface
export const addressLoader = createAddressLoader(pool, {
  eventStore,
  cacheRequest,
  extraRelays: appRelays,
  bufferTime: 200,
});

// Attach loader to event store for fallbacks
eventStore.replaceableLoader = addressLoader;
eventStore.addressableLoader = addressLoader;
