import {
  decodePointer,
  getDisplayName,
  getProfilePicture,
  NostrEvent,
  npubEncode,
} from "applesauce-core/helpers";
import { ProfileModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";
import { useEffect, useMemo, useState } from "react";

import { NSITE_HOST, NSITE_NAMED_KIND, NSITE_ROOT_KIND } from "../const";
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

function encodePubkeyBase36(pubkey: string): string {
  return BigInt(`0x${pubkey}`).toString(36).padStart(50, "0");
}

function decodePubkeyBase36(value: string): string | null {
  if (!/^[0-9a-z]{50}$/.test(value)) return null;

  try {
    let decoded = 0n;

    for (const char of value) {
      const digit = BigInt(parseInt(char, 36));
      decoded = decoded * 36n + digit;
    }

    const pubkey = decoded.toString(16).padStart(64, "0");
    return /^[0-9a-f]{64}$/.test(pubkey) ? pubkey : null;
  } catch {
    return null;
  }
}

function isCanonicalNamedSiteIdentifier(identifier: string): boolean {
  return /^[a-z0-9-]{1,13}$/.test(identifier) && !identifier.endsWith("-");
}

function isRootSiteLabel(label: string): boolean {
  try {
    const decoded = decodePointer(label);
    return decoded.type === "npub";
  } catch {
    return false;
  }
}

function isNamedSiteLabel(label: string): boolean {
  if (!/^[0-9a-z]{50}[a-z0-9-]{1,13}$/.test(label) || label.endsWith("-")) {
    return false;
  }

  const pubkey = decodePubkeyBase36(label.slice(0, 50));
  const identifier = label.slice(50);

  return Boolean(pubkey && isCanonicalNamedSiteIdentifier(identifier));
}

function getBaseHost(): string {
  const labels = location.hostname.split(".");

  if (
    labels.length > 2 &&
    (isRootSiteLabel(labels[0]) || isNamedSiteLabel(labels[0]))
  ) {
    labels.shift();
  }

  if (labels.length > 2 && labels[0] === "www") {
    labels.shift();
  }

  const hostname = labels.join(".");
  return location.port ? `${hostname}:${location.port}` : hostname;
}

function shouldUseConfiguredHost(): boolean {
  return (
    import.meta.env.DEV ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]"
  );
}

function getCanonicalHost(): string {
  return shouldUseConfiguredHost() ? NSITE_HOST : getBaseHost();
}

function getSiteUrl(site: NostrEvent, npub: string): URL | null {
  const host = getCanonicalHost();
  const protocol = shouldUseConfiguredHost() ? "https:" : location.protocol;

  if (site.kind === NSITE_ROOT_KIND) {
    return new URL("/", `${protocol}//${npub}.${host}`);
  }

  if (site.kind === NSITE_NAMED_KIND) {
    const identifier = getManifestIdentifier(site);
    if (!isCanonicalNamedSiteIdentifier(identifier)) return null;

    const label = `${encodePubkeyBase36(site.pubkey)}${identifier}`;
    return new URL("/", `${protocol}//${label}.${host}`);
  }

  return null;
}

export default function SiteCard({
  site,
  searchTerm = "",
  hideUnknown = false,
}: SiteCardProps) {
  const npub = npubEncode(site.pubkey);

  // Memoize the URL to prevent unnecessary re-renders
  const url = useMemo(() => getSiteUrl(site, npub), [npub, site]);

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
  const hasCanonicalNamedIdentifier = useMemo(
    () =>
      site.kind !== NSITE_NAMED_KIND ||
      isCanonicalNamedSiteIdentifier(identifier),
    [identifier, site.kind],
  );
  const fileCount = useMemo(() => getManifestFileCount(site), [site]);

  // fetch Open Graph data
  useEffect(() => {
    if (!url) {
      setOgData(null);
      setIsLoading(false);
      return;
    }

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

  const content = (
    <>
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
            {!hasCanonicalNamedIdentifier && (
              <div className="badge badge-warning badge-sm">
                non-canonical id
              </div>
            )}
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
    </>
  );

  if (!url) {
    return (
      <div
        className="w-full card bg-base-200 shadow-md block overflow-hidden"
        title="This named site identifier is not canonical under the updated nsite subdomain format"
      >
        {content}
      </div>
    );
  }

  return (
    <a
      href={url.toString()}
      className="w-full card bg-base-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer block overflow-hidden"
    >
      {content}
    </a>
  );
}
