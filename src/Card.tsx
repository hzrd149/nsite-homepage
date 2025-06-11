import { useEffect } from "react";
import { ProfileModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";
import { type NostrEvent } from "nostr-tools";
import { npubEncode } from "nostr-tools/nip19";
import { addressLoader } from "./nostr";

export default function SiteCard({ site }: { site: NostrEvent }) {
  const npub = npubEncode(site.pubkey);
  const url = new URL("/", `${location.protocol}//${npub}.${location.host}`);

  const profile = useEventModel(ProfileModel, [site.pubkey]) as any;
  const picture = profile?.picture || profile?.image;

  // load profile
  useEffect(() => {
    addressLoader({ pubkey: site.pubkey, kind: 0 }).subscribe();
  }, [site]);

  return (
    <a
      href={url.toString()}
      className="card bg-base-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
    >
      <div className="card-body p-4">
        {/* Profile Section */}
        <div className="flex items-center gap-3 mb-3">
          {picture && (
            <div className="avatar">
              <div className="w-12 h-12 rounded-full">
                <img
                  src={picture}
                  alt="Profile avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="card-title text-base font-semibold text-base-content truncate">
              {profile?.display_name || profile?.name || npub.slice(0, 8)}
            </h3>
            {profile?.nip05 && (
              <p className="text-sm text-base-content/60 truncate">
                {profile.nip05}
              </p>
            )}
          </div>
        </div>

        {/* Updated Time */}
        <div className="mt-auto">
          <div className="text-xs text-base-content/50 italic">
            Updated{" "}
            <time className="font-medium">
              {new Date(site.created_at * 1000).toLocaleString()}
            </time>
          </div>
        </div>
      </div>
    </a>
  );
}
