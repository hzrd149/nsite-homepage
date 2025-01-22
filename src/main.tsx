import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryStoreProvider } from "applesauce-react/providers/store-provider";

import App from "./App.tsx";
import { queryStore } from "./nostr";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryStoreProvider queryStore={queryStore}>
      <App />
    </QueryStoreProvider>
  </StrictMode>,
);
