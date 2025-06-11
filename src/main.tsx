import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EventStoreProvider } from "applesauce-react/providers";

import App from "./App.tsx";
import { eventStore } from "./nostr";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EventStoreProvider eventStore={eventStore}>
      <App />
    </EventStoreProvider>
  </StrictMode>,
);
