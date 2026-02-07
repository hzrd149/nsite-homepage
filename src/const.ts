import { normalizeToProfilePointer } from "applesauce-core/helpers";

export const NSITE_ROOT_KIND = 15128; // Root site manifest (replaceable event, no d tag)
export const NSITE_NAMED_KIND = 35128; // Named site manifest (addressable event, has d tag)
export const NSITE_KINDS = [NSITE_ROOT_KIND, NSITE_NAMED_KIND]; // All site manifest kinds

/** Default relays to load profile events from */
export const DEFUALT_LOOKUP_RELAYS = [
  "wss://purplepag.es",
  "wss://index.hzrd149.com",
  "wss://indexer.coracle.social",
];

/** Default relays to load site events */
export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nsite.lol",
  "wss://relay.snort.social",
  "wss://nostr.wine",
  "wss://relay.primal.net",
];

/** The root pubkey to use for recommend sites */
export const RECOMEND_ROOT_PUBKEY = import.meta.env.VITE_RECOMEND_ROOT_PUBKEY
  ? normalizeToProfilePointer(import.meta.env.VITE_RECOMEND_ROOT_PUBKEY)
  : null;
