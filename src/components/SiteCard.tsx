import { getDisplayName, getProfilePicture } from "applesauce-core/helpers";
import { ProfileModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";
import { type NostrEvent } from "nostr-tools";
import { npubEncode } from "nostr-tools/nip19";
import { useEffect, useMemo, useState } from "react";

import { DEFUALT_PROFILE_RELAYS } from "../const";
import { getOpenGraphData, OpenGraphData } from "../helpers/open-graph";
import { addressLoader } from "../nostr";

export default function SiteCard({ site }: { site: NostrEvent }) {
  const npub = npubEncode(site.pubkey);
  const host = location.host.replace(
    /^npub1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,}\./,
    "",
  );

  // Memoize the URL to prevent unnecessary re-renders
  const url = useMemo(() => {
    if (import.meta.env.DEV) return new URL(`https://${npub}.nsite.lol`);

    return new URL("/", `${location.protocol}//${npub}.${host}`);
  }, [npub, host]);

  const profile = useEventModel(ProfileModel, [site.pubkey]);
  const picture = getProfilePicture(profile);

  const [ogData, setOgData] = useState<OpenGraphData | null>();
  const [isLoading, setIsLoading] = useState(false);

  // load profile
  useEffect(() => {
    addressLoader({
      pubkey: site.pubkey,
      kind: 0,
      relays: DEFUALT_PROFILE_RELAYS,
    }).subscribe();
  }, [site.pubkey]);

  // fetch Open Graph data
  useEffect(() => {
    setIsLoading(true);
    getOpenGraphData(url.toString())
      .then(setOgData)
      .finally(() => {
        setIsLoading(false);
      });
  }, [url]);

  return (
    <a
      href={url.toString()}
      className="w-full card bg-base-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer block overflow-hidden"
    >
      <div className="card-body p-0 flex flex-row h-full overflow-hidden">
        {/* Content Section - Left Side */}
        <div className="flex-1 p-4 flex flex-col min-w-0 overflow-hidden">
          {/* Open Graph Title and Description */}
          <div className="flex-1 mb-4 overflow-hidden">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-base-300 rounded mb-2"></div>
                <div className="h-4 bg-base-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-base-300 rounded w-1/2"></div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-base-content mb-2 overflow-hidden text-ellipsis line-clamp-2">
                  {ogData?.title || getDisplayName(profile, npub.slice(0, 12))}
                </h2>
                {ogData?.description && (
                  <p className="text-sm text-base-content/70 leading-relaxed overflow-hidden text-ellipsis line-clamp-2">
                    {ogData.description}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Published By Footer */}
          <div className="mt-auto pt-3 border-t border-base-300 flex-shrink-0">
            <div className="flex items-center justify-between text-xs text-base-content/60">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="flex-shrink-0">Published by</span>
                {picture && (
                  <div className="avatar flex-shrink-0">
                    <div className="w-6 h-6 rounded-full">
                      <img
                        src={picture}
                        alt="Profile avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                <span className="font-medium truncate">
                  {getDisplayName(profile, npub.slice(0, 12))}
                </span>
                {profile?.nip05 && (
                  <span className="text-base-content/40 truncate">
                    ({profile.nip05})
                  </span>
                )}
              </div>
              <time className="italic flex-shrink-0 ml-2">
                {new Date(site.created_at * 1000).toLocaleDateString()}
              </time>
            </div>
          </div>
        </div>

        {/* Open Graph Image - Right Side */}
        {/* {ogData?.image && (
          <div className="flex-shrink-0 w-48 h-full">
            <img
              src={ogData.image}
              alt={ogData.title || "Site preview"}
              className="w-full h-full object-cover rounded-r-2xl"
            />
          </div>
        )} */}
      </div>
    </a>
  );
}
