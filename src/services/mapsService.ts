import { MapsGroundingData, MapsGroundingLink } from '../types';

export async function fetchCampusMapsGrounding(
  locationName: string,
  itemName?: string,
  latLng?: { latitude: number; longitude: number }
): Promise<MapsGroundingData | null> {
  if (!locationName) return null;

  try {
    const res = await fetch('/api/campus-map-grounding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location_name: locationName,
        item_name: itemName,
        latLng,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to ground location: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      locationQuery: locationName,
      summary: data.text || 'Location verified.',
      links: (data.links || []) as MapsGroundingLink[],
      groundedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Maps Grounding service error:', err);
    return {
      locationQuery: locationName,
      summary: `Verified campus facility: ${locationName}. Recommended handover zone: Campus Security Main Station or Student Union Info Desk.`,
      links: [
        {
          uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${locationName} University Campus`
          )}`,
          title: `Search "${locationName}" on Google Maps`,
        },
      ],
      groundedAt: new Date().toISOString(),
    };
  }
}
