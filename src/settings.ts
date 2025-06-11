import { BehaviorSubject } from "rxjs";
import { DEFAULT_RELAYS } from "./const";

export const appRelays = new BehaviorSubject<string[]>(DEFAULT_RELAYS);

try {
  const cached = localStorage.getItem("appRelays");
  if (cached) appRelays.next(JSON.parse(cached));
} catch (error) {
  appRelays.next(DEFAULT_RELAYS);
}

// Subscribe to changes and save to localStorage
appRelays.subscribe((relays) => {
  try {
    localStorage.setItem("appRelays", JSON.stringify(relays));
  } catch (error) {
    console.warn("Failed to save app relays to localStorage:", error);
  }
});
