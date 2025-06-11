import { useState } from "react";
import { useObservableState } from "applesauce-react/hooks";
import { appRelays } from "./settings";
import { DEFAULT_RELAYS } from "./const";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AddRelayFormProps {
  newRelay: string;
  setNewRelay: (value: string) => void;
  error: string;
  setError: (value: string) => void;
  onAddRelay: () => void;
}

interface RelayListProps {
  relays: string[];
  onRemoveRelay: (relay: string) => void;
}

interface RelayItemProps {
  relay: string;
  onRemove: () => void;
}

// Sub-component for individual relay item
function RelayItem({ relay, onRemove }: RelayItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
      <span className="font-mono text-sm break-all">{relay}</span>
      <button
        className="btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content"
        onClick={onRemove}
        aria-label={`Remove ${relay}`}
      >
        ✕
      </button>
    </div>
  );
}

// Sub-component for the relay list
function RelayList({ relays, onRemoveRelay }: RelayListProps) {
  return (
    <div className="space-y-2 mb-4">
      {relays.map((relay) => (
        <RelayItem
          key={relay}
          relay={relay}
          onRemove={() => onRemoveRelay(relay)}
        />
      ))}
    </div>
  );
}

// Sub-component for adding new relays
function AddRelayForm({ newRelay, setNewRelay, error, setError, onAddRelay }: AddRelayFormProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onAddRelay();
    }
  };

  return (
    <>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="wss://relay.example.com"
          className="input input-bordered flex-1"
          value={newRelay}
          onChange={(e) => {
            setNewRelay(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyPress}
        />
        <button
          className="btn btn-primary"
          onClick={onAddRelay}
        >
          Add
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}
    </>
  );
}

// Main Settings component
export default function Settings({ isOpen, onClose }: SettingsProps) {
  const relays = useObservableState(appRelays);
  const [newRelay, setNewRelay] = useState("");
  const [error, setError] = useState("");

  const addRelay = () => {
    const relay = newRelay.trim();
    if (!relay) {
      setError("Please enter a relay URL");
      return;
    }

    // Basic URL validation
    try {
      const url = new URL(relay);
      if (!url.protocol.startsWith("ws")) {
        setError("Relay URL must start with ws:// or wss://");
        return;
      }
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    if (relays.includes(relay)) {
      setError("Relay already exists");
      return;
    }

    appRelays.next([...relays, relay]);
    setNewRelay("");
    setError("");
  };

  const removeRelay = (relayToRemove: string) => {
    appRelays.next(relays.filter(relay => relay !== relayToRemove));
  };

  const resetToDefaults = () => {
    appRelays.next([...DEFAULT_RELAYS]);
    setError("");
  };

  return (
    <>
      {/* Modal */}
      <div className={`modal ${isOpen ? "modal-open" : ""}`}>
        <div className="modal-box max-w-2xl">
          <h3 className="font-bold text-lg mb-4">Settings</h3>

          {/* Relay Settings Section */}
          <div className="mb-6">
            <h4 className="font-semibold text-base mb-3">App Relays</h4>
            <p className="text-sm text-base-content/70 mb-4">
              Configure the relays used to fetch nsite data. Changes are saved automatically.
            </p>

            {/* Add New Relay Form */}
            <AddRelayForm
              newRelay={newRelay}
              setNewRelay={setNewRelay}
              error={error}
              setError={setError}
              onAddRelay={addRelay}
            />

            {/* Current Relays List */}
            <RelayList
              relays={relays}
              onRemoveRelay={removeRelay}
            />

            {/* Reset Button */}
            <button
              className="btn btn-outline btn-sm"
              onClick={resetToDefaults}
            >
              Reset to Defaults
            </button>
          </div>

          {/* Modal Actions */}
          <div className="modal-action">
            <button className="btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {/* Modal Backdrop */}
        <div className="modal-backdrop" onClick={onClose}></div>
      </div>
    </>
  );
}
