/**
 * @file Provides location tagging (GPS or manual) and a toggle hook for location preferences.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, MapPinPlus, Check, X, Loader2, Crosshair, Globe, Hash } from "lucide-react";
import { toast } from "sonner";

/** A geographic location captured via GPS or entered manually. */
interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  name?: string;
}

interface LocationTaggingProps {
  /** Callback invoked whenever the current location changes. */
  onLocationChange: (location: Location | null) => void;
  /** Pre-populated location (e.g. from a previous session). */
  initialLocation?: Location | null;
  /** When true, the component renders nothing. */
  disabled?: boolean;
}

/**
 * A UI component that lets the user attach a location (GPS or manual coordinates) to a payment.
 * Renders nothing when disabled.
 */
export function LocationTagging({ onLocationChange, initialLocation = null, disabled = false }: LocationTaggingProps) {
  const [location, setLocation] = useState<Location | null>(initialLocation);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(() => localStorage.getItem("peys_location_enabled") !== "false");
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);

  useEffect(() => {
    localStorage.setItem("peys_location_enabled", String(locationEnabled));
  }, [locationEnabled]);

  useEffect(() => {
    onLocationChange(location);
  }, [location, onLocationChange]);

  /**
   * Attempt to capture the device's current location via the Geolocation API.
   * Falls back to manual coordinate entry on permission denial or error.
   */
  const requestLocation = async () => {
    if (!locationEnabled) {
      toast.error("Location is disabled in settings");
      return;
    }

    setIsCapturing(true);

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(permission.state);

      if (permission.state === 'granted') {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation: Location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString(),
            };
            setLocation(newLocation);
            setIsCapturing(false);
            toast.success("Location captured!");
          },
          (error) => {
            setIsCapturing(false);
            switch (error.code) {
              case error.PERMISSION_DENIED:
                toast.error("Location permission denied");
                break;
              case error.POSITION_UNAVAILABLE:
                toast.error("Location unavailable");
                break;
              case error.TIMEOUT:
                toast.error("Location request timeout");
                break;
              default:
                toast.error("Failed to get location");
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
      } else if (permission.state === 'prompt') {
        // Request permission by calling getCurrentPosition
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation: Location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString(),
            };
            setLocation(newLocation);
            setIsCapturing(false);
            toast.success("Location captured!");
          },
          (error) => {
            setIsCapturing(false);
            toast.error("Location permission denied");
          }
        );
      } else {
        setIsCapturing(false);
        toast.error("Location permission denied");
      }
    } catch (err) {
      setIsCapturing(false);
      toast.error("Location not supported in this browser");
    }
  };

  /** Validate and save manually-entered latitude/longitude coordinates. */
  const saveManualLocation = () => {
    if (!manualLat || !manualLng) {
      toast.error("Please enter coordinates");
      return;
    }

    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error("Invalid coordinates");
      return;
    }

    setLocation({
      latitude: lat,
      longitude: lng,
      accuracy: 0,
      timestamp: new Date().toISOString(),
    });
    setShowManual(false);
    setManualLat("");
    setManualLng("");
    toast.success("Location added");
  };

  /** Remove the currently tagged location. */
  const clearLocation = () => {
    setLocation(null);
    toast.success("Location cleared");
  };

  if (disabled) {
    return null;
  }

  return (
    <div className="space-y-2">
      {location ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
            <MapPin className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Location tagged</p>
            <p className="truncate text-sm text-foreground">
              {location.name || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
            </p>
          </div>
          <button
            onClick={clearLocation}
            className="rounded-full p-1.5 hover:bg-green-500/20 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={requestLocation}
            disabled={isCapturing}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isCapturing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Crosshair className="h-3.5 w-3.5" />
            )}
            Add Location
          </button>
          <button
            onClick={() => setShowManual(!showManual)}
            className="flex items-center gap-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Hash className="h-3.5 w-3.5" />
            Manual
          </button>
        </div>
      )}

      <AnimatePresence>
        {showManual && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 py-2">
              <input
                type="text"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="Latitude"
                className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="Longitude"
                className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={saveManualLocation}
                className="rounded-lg bg-primary px-2 py-1 text-xs text-primary-foreground hover:opacity-90"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Hook that controls the global location-enabled preference (persisted to localStorage).
 */
export function useLocation() {
  const [locationEnabled, setLocationEnabled] = useState(() => localStorage.getItem("peys_location_enabled") !== "false");
  const [lastLocation, setLastLocation] = useState<Location | null>(null);

  const toggleLocation = (enabled: boolean) => {
    setLocationEnabled(enabled);
    localStorage.setItem("peys_location_enabled", String(enabled));
  };

  return {
    locationEnabled,
    setLocationEnabled: toggleLocation,
    lastLocation,
    setLastLocation,
  };
}
