import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const place_id = url.searchParams.get("place_id");
    if (!place_id) return NextResponse.json({ error: "Missing place_id" }, { status: 400 });

    const params = new URLSearchParams({
      place_id,
      // CRITICAL FIX: Use the environment variable name, not the key value.
      key: process.env.GOOGLE_MAPS_API_KEY, 
      fields: "geometry,formatted_address,name,place_id",
    });

    const endpoint = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
    
    const resp = await fetch(endpoint);
    if (!resp.ok) {
        const errorData = await resp.json();
        return NextResponse.json(errorData, { status: resp.status });
    }

    const data = await resp.json();

    return NextResponse.json(data);
  } catch (err) {
    console.error("Place details error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}