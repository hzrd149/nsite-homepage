import { EventStore } from "applesauce-core/event-store";
import { isFromCache } from "applesauce-core/helpers/event";
import { createAddressLoader } from "applesauce-loaders/loaders";
import { RelayPool } from "applesauce-relay";
import { addEvents, getEventsForFilters, openDB } from "nostr-idb";
import { Filter, NostrEvent, verifyEvent } from "nostr-tools";
import { bufferTime, filter } from "rxjs";
import { appRelays } from "./settings";

let nostrIdb:
  | Promise<ReturnType<typeof openDB>>
  | ReturnType<typeof openDB>
  | undefined = undefined;

async function getNostrIdb() {
  if (!nostrIdb) {
    nostrIdb = openDB();
  }
  return await nostrIdb;
}

export async function cacheRequest(filters: Filter[]) {
  const db = await getNostrIdb();
  return getEventsForFilters(db, filters);
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

let queue: NostrEvent[] = [];
eventStore.insert$.subscribe((event: NostrEvent) => {
  if (!isFromCache(event)) queue.push(event);
});

getNostrIdb().then((cache) => {
  eventStore.insert$
    .pipe(
      bufferTime(1000),
      filter((b) => b.length > 0),
    )
    .subscribe((events) => {
      addEvents(cache, events);
    });
});
