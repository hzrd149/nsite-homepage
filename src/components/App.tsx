import { mapEventsToStore } from "applesauce-core";
import { getEventUID } from "applesauce-core/helpers/event";
import { ReplaceableModel, TimelineModel } from "applesauce-core/models";
import {
  useEventModel,
  useObservableMemo,
  useObservableState,
} from "applesauce-react/hooks";
import { onlyEvents } from "applesauce-relay";
import { useEffect, useState } from "react";

import { FEATURED_SITES_LIST, NSITE_KIND } from "../const";
import useDarkModeState from "../darkmode";
import { addressLoader, cacheRequest, eventStore, pool } from "../nostr";
import { appRelays } from "../settings";
import SiteCard from "./SiteCard";
import Settings from "./Settings";

function App() {
  const [showAll, setShowAll] = useState(location.hash === "#all");
  const [darkMode, setDarkMode] = useDarkModeState();
  const [showSettings, setShowSettings] = useState(false);
  const relays = useObservableState(appRelays);

  useEffect(() => {
    const listener = () => setShowAll(location.hash === "#all");
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);

  // Update theme on document element
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "sunset" : "winter",
    );
  }, [darkMode]);

  // Subscribe to relays
  useObservableMemo(
    () =>
      pool
        .subscription(relays, { kinds: [NSITE_KIND], "#d": ["/index.html"] })
        .pipe(onlyEvents(), mapEventsToStore(eventStore)),
    [relays],
  );

  // Load events from cache
  useEffect(() => {
    (async () => {
      const events = await cacheRequest([
        { kinds: [NSITE_KIND], "#d": ["/index.html"] },
      ]);
      for (let event of events) eventStore.add(event);
    })();
  }, []);

  useEffect(() => {
    addressLoader(FEATURED_SITES_LIST).subscribe();
  }, []);
  const featuredList = useEventModel(ReplaceableModel, [
    FEATURED_SITES_LIST.kind,
    FEATURED_SITES_LIST.pubkey,
    FEATURED_SITES_LIST.identifier,
  ]) as any;

  // get sites
  const sites = useEventModel(TimelineModel, [
    { kinds: [NSITE_KIND], "#d": ["/index.html"] },
  ]) as any;

  const featured =
    featuredList &&
    sites?.filter((site: any) =>
      featuredList.tags.some((t: any) => t[1] === site.pubkey),
    );

  return (
    <div className="min-h-screen bg-base-100">
      {/* Top Right Controls */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {/* Settings Button */}
        <button
          className="btn btn-circle btn-ghost btn-sm"
          onClick={() => setShowSettings(true)}
          aria-label="Open settings"
        >
          <span className="text-xl">⚙️</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          className="btn btn-circle btn-ghost btn-sm"
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle theme"
        >
          <span className="text-xl">{darkMode ? "💡" : "🕶"}</span>
        </button>
      </div>

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col items-center">
          {/* Logo */}
          <div className="mb-8">
            <img src="/nsite.svg" alt="nsite logo" className="w-40 h-auto" />
          </div>

          {/* Header */}
          <h1 className="text-4xl font-bold text-center mb-4 text-base-content">
            Welcome to nsite
          </h1>

          {/* About Section */}
          <div className="text-center text-lg mb-8 max-w-2xl">
            <p className="text-base-content/80">
              <a
                href="https://github.com/hzrd149/nsite-ts"
                target="_blank"
                className="link link-primary font-medium"
              >
                nsite
              </a>{" "}
              is a static website hosting solution built on top of{" "}
              <a
                href="https://github.com/nostr-protocol/nostr"
                target="_blank"
                className="link link-primary font-medium"
              >
                nostr
              </a>{" "}
              and{" "}
              <a
                href="https://github.com/hzrd149/blossom"
                target="_blank"
                className="link link-primary font-medium"
              >
                blossom
              </a>
            </p>
          </div>

          {/* Sites Header */}
          <h2 className="text-2xl font-semibold text-center mb-6 text-base-content">
            {showAll ? "All" : "Featured"} sites
          </h2>

          {/* Sites Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
            {(showAll ? sites : featured)?.map((site: any) => (
              <SiteCard key={getEventUID(site)} site={site} />
            )) ?? (
              <div className="col-span-full flex justify-center">
                <div className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-md"></span>
                  <span className="text-base-content/60">Loading...</span>
                </div>
              </div>
            )}
          </div>

          {/* Show All Button */}
          {sites && sites.length > 4 && !showAll && (
            <a href="#all" className="btn btn-primary btn-lg">
              Show All Sites
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
