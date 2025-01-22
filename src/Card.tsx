import styled from "@emotion/styled";
import { ProfileQuery } from "applesauce-core/queries/profile";
import { useStoreQuery } from "applesauce-react/hooks/use-store-query";
import { type NostrEvent } from "nostr-tools";
import { npubEncode } from "nostr-tools/nip19";
import { useEffect } from "react";
import { replaceableLoader } from "./nostr";

const Card = styled.a`
  /* layout styles */
  display: flex;
  flex-direction: column;
  gap: 0.3em;

  /* box styles */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0.5em;
  background: white;
  transition: transform 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
  }

  /* remove default styles */
  color: initial;
  text-decoration: none;
`;

const Avatar = styled.img`
  width: 3rem;
  height: 3rem;
  border: none;
  outline: none;
  border-radius: 50%;
`;

const Profile = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.8em;
  align-items: center;
  padding: 0.2em;
`;

const Title = styled.h3`
  margin: 12px 0 8px;
  color: #333;
  margin: 0;
`;

const Description = styled.p`
  color: #666;
  font-size: 14px;
  line-height: 1.4;
  margin: 0;
`;

const Updated = styled.div`
  margin-top: auto;
  font-size: 0.6em;
  font-style: italic;
  color: gray;
`;

export default function SiteCard({ site }: { site: NostrEvent }) {
  const npub = npubEncode(site.pubkey);
  const url = new URL("/", `${location.protocol}//${npub}.${location.host}`);

  const profile = useStoreQuery(ProfileQuery, [site.pubkey]);
  const picture = profile?.picture || profile?.image;

  // load profile
  useEffect(() => {
    replaceableLoader.next({ pubkey: site.pubkey, kind: 0 });
  }, [site]);

  return (
    <Card href={url.toString()}>
      <Profile>
        {picture && <Avatar src={picture} className="avatar" />}
        <div>
          <Title>
            {profile?.display_name || profile?.name || npub.slice(0, 8)}
          </Title>
          <Description>{profile?.nip05}</Description>
        </div>
      </Profile>
      <Updated>
        Updated <time>{new Date(site.created_at * 1000).toLocaleString()}</time>
      </Updated>
    </Card>
  );
}
