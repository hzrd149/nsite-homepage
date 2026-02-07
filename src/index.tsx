import "./index.css";
import "window.nostrdb.js";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EventStoreProvider } from "applesauce-react/providers";

import App from "./components/App.tsx";
import { eventStore } from "./nostr.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EventStoreProvider eventStore={eventStore}>
      <App />
    </EventStoreProvider>
  </StrictMode>,
);
