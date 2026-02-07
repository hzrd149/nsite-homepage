import {
  getDisplayName,
  getProfilePicture,
  ProfilePointer,
} from "applesauce-core/helpers";
import { use$ } from "applesauce-react/hooks";
import { eventStore } from "../nostr";

export function UserAvatar({
  user,
  size = 10,
}: {
  user: string | ProfilePointer;
  size?: number;
}) {
  const profile = use$(() => eventStore.profile(user), [user]);

  return (
    <div className="avatar">
      <div className={`w-${size} h-${size} rounded-full`}>
        <img
          src={getProfilePicture(profile)}
          alt={getDisplayName(profile)}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

export function UserName({
  user,
  className,
}: {
  user: string | ProfilePointer;
  className?: string;
}) {
  const profile = use$(() => eventStore.profile(user), [user]);
  return <span className={className}>{getDisplayName(profile)}</span>;
}
