import { Observable } from "rxjs";
import { EventStore } from "applesauce-core/event-store";
import { QueryStore } from "applesauce-core/query-store";
import { ReplaceableLoader } from "applesauce-loaders/loaders/replaceable-loader";
import { isFromCache } from "applesauce-core/helpers/event";
import { openDB, getEventsForFilters, addEvents } from "nostr-idb";
import { createRxNostr } from "rx-nostr";
import { verifier } from "rx-nostr-crypto";
import { NostrEvent } from "nostr-tools";

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

export const rxNostr = createRxNostr({ verifier: verifier });
rxNostr.setDefaultRelays([
  "wss://nostrue.com",
  "wss://relay.damus.io",
  "wss://purplerelay.com",
  "wss://nostr.wine",
]);

export const eventStore = new EventStore();
export const queryStore = new QueryStore(eventStore);

export const replaceableLoader = new ReplaceableLoader(rxNostr, {
  cacheRequest: (filters) => {
    return new Observable((observer) => {
      getNostrIdb().then(
        (db) => {
          getEventsForFilters(db, filters)
            .then(
              (events) => {
                for (const event of events) observer.next(event);
              },
              (err) => observer.error(err),
            )
            .finally(() => observer.complete());
        },
        (err) => observer.error(err),
      );
    });
  },
});

replaceableLoader.subscribe((packet) =>
  eventStore.add(packet.event, packet.from),
);

let queue: NostrEvent[] = [];
eventStore.database.inserted.subscribe((event) => {
  if (!isFromCache(event)) queue.push(event);
});

// add events to cache every second
setInterval(() => {
  if (queue.length === 0) return;

  const events = Array.from(queue);
  queue = [];
  getNostrIdb().then((db) => addEvents(db, events));
}, 1000);

// get relays from extension
if (window.nostr) {
  async () => {
    const relays = await window.nostr?.getRelays?.();

    const urls = relays && Object.keys(relays);
    if (urls && urls.length > 0)
      rxNostr.setDefaultRelays([
        ...Object.keys(rxNostr.getDefaultRelays()),
        ...urls,
      ]);
  };
}
