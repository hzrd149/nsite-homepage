import { type Nip07Interface } from "applesauce-signers";

declare global {
  interface Window {
    nostr?: Nip07Interface;
  }
}
