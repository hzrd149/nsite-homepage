export const NSITE_ROOT_KIND = 15128; // Root site manifest (replaceable event, no d tag)
export const NSITE_NAMED_KIND = 35128; // Named site manifest (addressable event, has d tag)
export const NSITE_KINDS = [NSITE_ROOT_KIND, NSITE_NAMED_KIND]; // All site manifest kinds

export const DEFUALT_PROFILE_RELAYS = [
  "wss://purplepag.es",
  "wss://index.hzrd149.com",
];

export const DEFAULT_RELAYS = [
  "wss://nostrue.com",
  "wss://relay.damus.io",
  "wss://relay.nsite.lol",
  "wss://relay.snort.social",
  "wss://nostr.wine",
  "wss://relay.primal.net",
];

export const FEATURED_SITES_LIST = {
  kind: 30000,
  pubkey: "1805301ca7c1ad2f9349076cf282f905b3c1e540e88675e14b95856c40b75e33",
  identifier: "E1HkNAWzVQSQBVYfzNTDD",
  relays: ["wss://nostrue.com", "wss://relay.damus.io"],
};
