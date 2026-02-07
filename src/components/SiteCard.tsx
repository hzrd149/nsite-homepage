import {
  getDisplayName,
  getProfilePicture,
  NostrEvent,
  npubEncode,
} from "applesauce-core/helpers";
import { ProfileModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";
import { useEffect, useMemo, useState } from "react";

import { NSITE_ROOT_KIND } from "../const";
import { getOpenGraphData, OpenGraphData } from "../helpers/open-graph";
import { UserAvatar, UserName } from "./User";

interface SiteCardProps {
  site: NostrEvent;
  searchTerm?: string;
  hideUnknown?: boolean;
}

// Helper functions to extract manifest data from event tags
function getManifestTitle(site: NostrEvent): string | undefined {
  return site.tags.find((t) => t[0] === "title")?.[1];
}

function getManifestDescription(site: NostrEvent): string | undefined {
  return site.tags.find((t) => t[0] === "description")?.[1];
}

function getManifestIdentifier(site: NostrEvent): string {
  // For root sites (kind 15128), return "root"
  if (site.kind === NSITE_ROOT_KIND) return "root";

  // For named sites (kind 35128), return the d tag value
  return site.tags.find((t) => t[0] === "d")?.[1] || "unknown";
}

function getManifestFileCount(site: NostrEvent): number {
  return site.tags.filter((t) => t[0] === "path").length;
}

export default function SiteCard({
  site,
  searchTerm = "",
  hideUnknown = false,
}: SiteCardProps) {
  const npub = npubEncode(site.pubkey);
  const host = location.host.replace(
    /^npub1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,}\./,
    "",
  );

  // Memoize the URL to prevent unnecessary re-renders
  const url = useMemo(() => {
    // Get the identifier for named sites (d tag value)
    const identifier = getManifestIdentifier(site);

    // For named sites (kind 35128), include identifier as subdomain
    const subdomain = identifier !== "root" ? `${identifier}.${npub}` : npub;

    if (import.meta.env.DEV) return new URL(`https://${subdomain}.nsite.lol`);

    return new URL("/", `${location.protocol}//${subdomain}.${host}`);
  }, [npub, host, site]);

  const profile = useEventModel(ProfileModel, [site.pubkey]);
  const picture = getProfilePicture(profile);

  const [ogData, setOgData] = useState<OpenGraphData | null>();
  const [isLoading, setIsLoading] = useState(false);

  // Extract manifest metadata
  const manifestTitle = useMemo(() => getManifestTitle(site), [site]);
  const manifestDescription = useMemo(
    () => getManifestDescription(site),
    [site],
  );
  const identifier = useMemo(() => getManifestIdentifier(site), [site]);
  const fileCount = useMemo(() => getManifestFileCount(site), [site]);

  // fetch Open Graph data
  useEffect(() => {
    setIsLoading(true);
    getOpenGraphData(url.toString())
      .then(setOgData)
      .finally(() => {
        setIsLoading(false);
      });
  }, [url]);

  // Filter logic
  const displayName = getDisplayName(profile, npub.slice(0, 12));

  // Check if site should be hidden due to unknown data
  if (hideUnknown) {
    const hasManifestData = manifestTitle || manifestDescription;
    const hasOpenGraphData = ogData && (ogData.title || ogData.description);
    const hasProfileData = profile && getDisplayName(profile);

    if (!hasManifestData && !hasOpenGraphData && !hasProfileData) {
      return null;
    }
  }

  // Check if site matches search term
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase().trim();
    const manifestTitleMatch = manifestTitle
      ?.toLowerCase()
      .includes(searchLower);
    const manifestDescriptionMatch = manifestDescription
      ?.toLowerCase()
      .includes(searchLower);
    const identifierMatch = identifier?.toLowerCase().includes(searchLower);
    const ogTitleMatch = ogData?.title?.toLowerCase().includes(searchLower);
    const ogDescriptionMatch = ogData?.description
      ?.toLowerCase()
      .includes(searchLower);
    const displayNameMatch = displayName?.toLowerCase().includes(searchLower);

    if (
      !manifestTitleMatch &&
      !manifestDescriptionMatch &&
      !identifierMatch &&
      !ogTitleMatch &&
      !ogDescriptionMatch &&
      !displayNameMatch
    ) {
      return null;
    }
  }

  return (
    <a
      href={url.toString()}
      className="w-full card bg-base-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer block overflow-hidden"
    >
      <div className="card-body p-0 flex flex-row h-full overflow-hidden">
        {/* Content Section - Left Side */}
        <div className="flex-1 p-4 flex flex-col min-w-0 overflow-hidden">
          {/* Site Title and Description */}
          <div className="flex-1 mb-3 overflow-hidden">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-base-300 rounded mb-2"></div>
                <div className="h-4 bg-base-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-base-300 rounded w-1/2"></div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-base-content mb-2 overflow-hidden text-ellipsis line-clamp-2">
                  {manifestTitle || ogData?.title || displayName}
                </h2>
                {(manifestDescription || ogData?.description) && (
                  <p className="text-sm text-base-content/70 leading-relaxed overflow-hidden text-ellipsis line-clamp-2">
                    {manifestDescription || ogData?.description}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Site Metadata - Identifier and File Count */}
          <div className="flex items-center gap-3 mb-3 text-xs text-base-content/60 flex-wrap">
            <div className="badge badge-outline badge-sm">{identifier}</div>
            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <span>
                {fileCount} file{fileCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Published By Footer */}
          <div className="mt-auto pt-3 border-t border-base-300 shrink-0">
            <div className="flex items-center justify-between text-xs text-base-content/60 gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="shrink-0">Published by</span>
                {picture && <UserAvatar user={site.pubkey} size={6} />}
                <UserName user={site.pubkey} className="font-medium truncate" />
                {profile?.nip05 && (
                  <span className="text-base-content/40 truncate">
                    ({profile.nip05})
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-base-content/50 italic mt-1">
              Last updated{" "}
              {new Date(site.created_at * 1000).toLocaleDateString()}
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
