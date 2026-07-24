const GOOGLE_MAPS_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "goo.gl",
  "maps.app.goo.gl",
]);

export function isGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return false;
    }

    return GOOGLE_MAPS_HOSTS.has(url.hostname) || url.hostname.endsWith(".google.com");
  } catch {
    return false;
  }
}

export function normalizeGoogleMapsUrl(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed;
}

export function buildDirectionsUrl({
  googleMapsUrl,
  name,
  address,
  city,
  state,
}: {
  googleMapsUrl?: string | null;
  name: string;
  address: string;
  city: string;
  state: string;
}) {
  const normalizedGoogleMapsUrl = normalizeGoogleMapsUrl(googleMapsUrl);

  if (normalizedGoogleMapsUrl && isGoogleMapsUrl(normalizedGoogleMapsUrl)) {
    return normalizedGoogleMapsUrl;
  }

  const query = [name, address, city, state].filter(Boolean).join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
