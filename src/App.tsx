import { useEffect, useState } from "react";
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
`;

const Header = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 1em;
`;

const About = styled.p`
  text-align: center;
  font-size: 1.1em;
  margin-bottom: 2em;

  a {
    color: #007bff;
  }
`;

const SitesHeader = styled.h2`
  text-align: center;
  color: #333;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
  width: 100%;
`;

const ShowAllButton = styled.button`
  display: block;
  margin: 0 auto;
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056b3;
  }
`;

function App() {
  const [showAll, setShowAll] = useState(false);

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
    <Container>
      <Logo src="/nsite.jpg" />
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
        <ShowAllButton onClick={() => setShowAll(true)}>
          Show All Sites
        </ShowAllButton>
      )}
    </Container>
  );
}

export default App;
