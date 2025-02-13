import { useEffect, useState } from "react";
import { Global, css } from "@emotion/react";
import { useStoreQuery } from "applesauce-react/hooks/use-store-query";
import {
  ReplaceableQuery,
  TimelineQuery,
} from "applesauce-core/queries/simple";
import { getEventUID } from "applesauce-core/helpers/event";
import { createRxForwardReq } from "rx-nostr";
import styled from "@emotion/styled";

import { FEATURED_SITES_LIST, NSITE_KIND } from "./const";
import { eventStore, replaceableLoader, rxNostr } from "./nostr";
import SiteCard from "./Card";
import useDarkModeState from "./darkmode";

// Define global CSS variables based on the dark mode flag
const globalStyles = (darkMode: boolean) => css`
  :root {
    --background: ${darkMode ? "#121212" : "#fff"};
    --text: ${darkMode ? "#eee" : "#333"};
    --primary: ${darkMode ? "#007bff" : "#007bff"};
    --secondary: ${darkMode ? "#aaa" : "#666"};
    --card-background: ${darkMode ? "#1e1e1e" : "white"};
    --card-shadow: ${darkMode
      ? "0 2px 8px rgba(255, 255, 255, 0.1)"
      : "0 2px 8px rgba(0, 0, 0, 0.1)"};
    --hover-button: "${darkMode ? "#64b5f6" : "#0056b3"};";
  }
  body {
    font-family: sans-serif;
    background: var(--background);
    color: var(--text);
    margin: 0;
    padding: 0;
    transition: background 0.2s, color 0.2s;
  }
`;

const Logo = styled.img`
  width: 10em;
  margin: 0 auto;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text);
`;

const Header = styled.h1`
  text-align: center;
  color: var(--text);
  margin-bottom: 1em;
`;

const About = styled.p`
  text-align: center;
  font-size: 1.1em;
  margin-bottom: 2em;

  a {
    color: var(--primary);
  }
`;

const SitesHeader = styled.h2`
  text-align: center;
  color: var(--text);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
  width: 100%;
`;

const ShowAllButton = styled.a`
  display: block;
  margin: 0 auto;
  padding: 12px 24px;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;

  &:hover {
    background-color: var(--hover-button);
  }
`;

const ThemeToggleButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(128, 128, 128, 0.2);
  padding: 4px 6px;
  font-size: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

function App() {
  const [showAll, setShowAll] = useState(location.hash === "#all");
  const [darkMode, setDarkMode] = useDarkModeState();

  useEffect(() => {
    const listener = () => setShowAll(location.hash === "#all");
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);

  // subscribe to relays
  useEffect(() => {
    const req = createRxForwardReq("sites");

    // subscribe to request
    const sub = rxNostr
      .use(req)
      .subscribe((p) => eventStore.add(p.event, p.from));

    // set filter
    req.emit({ kinds: [NSITE_KIND], "#d": ["/index.html"] });

    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    replaceableLoader.next({ ...FEATURED_SITES_LIST, force: true });
  }, []);
  const featuredList = useStoreQuery(ReplaceableQuery, [
    FEATURED_SITES_LIST.kind,
    FEATURED_SITES_LIST.pubkey,
    FEATURED_SITES_LIST.identifier,
  ]);

  // get sites
  const sites = useStoreQuery(TimelineQuery, [
    { kinds: [NSITE_KIND], "#d": ["/index.html"] },
  ]);

  const featured =
    featuredList &&
    sites?.filter((site) =>
      featuredList.tags.some((t) => t[1] === site.pubkey),
    );

  return (
    <>
      <Global styles={globalStyles(darkMode)} />
      <Container>
        <ThemeToggleButton onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "💡" : "🕶"}
        </ThemeToggleButton>
        <Logo src="/nsite.svg" />
        <Header>Welcome to nsite</Header>
        <About>
          <a href="https://github.com/hzrd149/nsite-ts" target="_blank">
            nsite
          </a>{" "}
          is a static website hosting solution built on top of{" "}
          <a href="https://github.com/nostr-protocol/nostr" target="_blank">
            nostr
          </a>{" "}
          and{" "}
          <a href="https://github.com/hzrd149/blossom" target="_blank">
            blossom
          </a>
        </About>
        <SitesHeader>{showAll ? "All" : "Featured"} sites</SitesHeader>
        <Grid>
          {(showAll ? sites : featured)?.map((site) => (
            <SiteCard key={getEventUID(site)} site={site} />
          )) ?? <p>Loading...</p>}
        </Grid>
        {sites && sites.length > 4 && !showAll && (
          <ShowAllButton href="#all">Show All Sites</ShowAllButton>
        )}
      </Container>
    </>
  );
}

export default App;
