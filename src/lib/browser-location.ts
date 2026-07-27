import type { Coordinates } from "@/lib/geo";

export type BrowserLocationFailureReason = "blocked" | "insecure" | "unsupported" | "timeout" | "unavailable";

export type BrowserLocationResult =
  | { ok: true; coordinates: Coordinates }
  | { ok: false; reason: BrowserLocationFailureReason };

export async function getBrowserLocation(): Promise<BrowserLocationResult> {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return { ok: false, reason: "insecure" };
  }

  if (!navigator.geolocation) {
    return { ok: false, reason: "unsupported" };
  }

  if (navigator.permissions?.query) {
    const permission = await navigator.permissions.query({ name: "geolocation" });

    if (permission.state === "denied") {
      return { ok: false, reason: "blocked" };
    }
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({ ok: false, reason: "blocked" });
          return;
        }

        if (error.code === error.TIMEOUT) {
          resolve({ ok: false, reason: "timeout" });
          return;
        }

        resolve({ ok: false, reason: "unavailable" });
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 12000 },
    );
  });
}

export function getBrowserLocationMessage(reason: BrowserLocationFailureReason) {
  if (reason === "blocked") {
    return "Location is blocked. Click the browser lock icon, allow Location, then refresh.";
  }

  if (reason === "insecure") {
    return "Location needs HTTPS. Use the deployed website or localhost, not a phone LAN IP.";
  }

  if (reason === "unsupported") {
    return "This browser does not support location search. Search by city or area instead.";
  }

  if (reason === "timeout") {
    return "Location took too long. Check device location/GPS and try again.";
  }

  return "Location is unavailable right now. Search by city or area instead.";
}
