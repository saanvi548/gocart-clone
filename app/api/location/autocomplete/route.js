import { NextResponse } from "next/server";

export async function GET(req) {
  const debugInfo = {
    hasKey: !!process.env.GOOGLE_MAPS_API_KEY,
    keyStart: process.env.GOOGLE_MAPS_API_KEY?.substring(0, 20),
    keyLength: process.env.GOOGLE_MAPS_API_KEY?.length,
    hasPublicKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    publicKeyStart: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 20),
  };

  try {
    const url = new URL(req.url);
    const input = url.searchParams.get("input");
    if (!input) {
      return NextResponse.json({ error: "Missing input", debugInfo }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        error: "API key not found in environment",
        debugInfo 
      }, { status: 500 });
    }

    const params = new URLSearchParams({
      input,
      key: apiKey,
    });

    const googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;

    const resp = await fetch(googleUrl);
    const data = await resp.json();

    // Return the response WITH debug info
    return NextResponse.json({
      ...data,
      debugInfo // This will show in the browser
    });
  } catch (err) {
    return NextResponse.json({ 
      error: err.message,
      debugInfo 
    }, { status: 500 });
  }
}