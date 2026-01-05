"use client";

import { useState, useEffect } from "react";

interface ClockStatus {
  isClockedIn: boolean;
  clockInTime: string | null;
  todayHours: number;
}

interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export default function ClockPage() {
  const [status, setStatus] = useState<ClockStatus>({
    isClockedIn: false,
    clockInTime: null,
    todayHours: 0,
  });
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch clock status on mount
  useEffect(() => {
    fetchClockStatus();
  }, []);

  const fetchClockStatus = async () => {
    try {
      const res = await fetch("/api/mobile/clock");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch clock status:", err);
    }
  };

  const getLocation = (): Promise<GeoPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      setGeoLoading(true);
      setGeoError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLoading(false);
          const position = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setPosition(position);
          resolve(position);
        },
        (err) => {
          setGeoLoading(false);
          const message =
            err.code === 1
              ? "Location access denied. Please enable location services."
              : err.code === 2
                ? "Location unavailable. Please try again."
                : "Location request timed out. Please try again.";
          setGeoError(message);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleClockAction = async () => {
    setLoading(true);
    setGeoError(null);

    try {
      // Get GPS position first
      const pos = await getLocation();

      const action = status.isClockedIn ? "clock_out" : "clock_in";

      const res = await fetch("/api/mobile/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          latitude: pos.latitude,
          longitude: pos.longitude,
          accuracy: pos.accuracy,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to clock in/out");
      }

      // Refresh status
      await fetchClockStatus();
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Calculate elapsed time if clocked in
  const getElapsedTime = () => {
    if (!status.clockInTime) return "0:00";
    const clockIn = new Date(status.clockInTime);
    const diff = currentTime.getTime() - clockIn.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-4 flex flex-col min-h-full">
      {/* Current Time */}
      <div className="text-center mb-8">
        <p className="text-5xl font-display">
          {currentTime.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className="text-ink/60">
          {currentTime.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Status Card */}
      <div
        className={`rounded-2xl p-6 mb-6 ${
          status.isClockedIn
            ? "bg-forest/10 border-2 border-forest"
            : "bg-stone/10 border border-stone/30"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                status.isClockedIn ? "bg-forest animate-pulse" : "bg-stone"
              }`}
            />
            <span className="font-medium">
              {status.isClockedIn ? "Currently Working" : "Not Clocked In"}
            </span>
          </div>
          {status.isClockedIn && (
            <span className="text-forest font-display text-xl">
              {getElapsedTime()}
            </span>
          )}
        </div>

        {status.isClockedIn && status.clockInTime && (
          <p className="text-sm text-ink/60">
            Clocked in at{" "}
            {new Date(status.clockInTime).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {/* Clock Button */}
      <div className="flex-1 flex items-center justify-center mb-8">
        <button
          onClick={handleClockAction}
          disabled={loading || geoLoading}
          className={`w-48 h-48 rounded-full flex flex-col items-center justify-center text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
            status.isClockedIn
              ? "bg-terracotta hover:bg-terracotta/90"
              : "bg-forest hover:bg-forest/90"
          }`}
        >
          {loading || geoLoading ? (
            <>
              <i className="fas fa-spinner fa-spin text-4xl mb-2" />
              <span className="text-lg">
                {geoLoading ? "Getting Location..." : "Processing..."}
              </span>
            </>
          ) : (
            <>
              <i
                className={`fas ${status.isClockedIn ? "fa-stop" : "fa-play"} text-4xl mb-2`}
              />
              <span className="text-xl font-semibold">
                {status.isClockedIn ? "Clock Out" : "Clock In"}
              </span>
            </>
          )}
        </button>
      </div>

      {/* GPS Status */}
      {position && (
        <div className="bg-white rounded-xl p-4 border border-stone/30 mb-4">
          <div className="flex items-center gap-3">
            <i className="fas fa-map-marker-alt text-ocean" />
            <div className="flex-1">
              <p className="text-sm font-medium">Location Acquired</p>
              <p className="text-xs text-ink/60">
                Accuracy: {Math.round(position.accuracy)}m
              </p>
            </div>
            <i className="fas fa-check-circle text-forest" />
          </div>
        </div>
      )}

      {/* Error */}
      {geoError && (
        <div className="bg-terracotta/10 rounded-xl p-4 border border-terracotta/30 mb-4">
          <div className="flex items-start gap-3">
            <i className="fas fa-exclamation-triangle text-terracotta mt-0.5" />
            <div>
              <p className="text-sm font-medium text-terracotta">
                Location Error
              </p>
              <p className="text-xs text-ink/60">{geoError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Hours */}
      <div className="bg-white rounded-xl p-4 border border-stone/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink/60">Today&apos;s Hours</p>
            <p className="text-2xl font-display">
              {status.todayHours.toFixed(1)}h
            </p>
          </div>
          <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center">
            <i className="fas fa-clock text-ocean text-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
