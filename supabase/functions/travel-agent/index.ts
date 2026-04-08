import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are TravelMate AI, an expert travel planning assistant. You help users with:

1. **Flights**: Search and recommend flights. When asked about flights, provide realistic current information including airlines, approximate prices, durations, and booking tips. Always mention that prices fluctuate and recommend checking aggregators like Google Flights, Skyscanner, or Kayak for real-time pricing.

2. **Hotels**: Recommend accommodations based on budget, location, and preferences. Include approximate nightly rates, neighborhood recommendations, and amenities. Suggest booking platforms like Booking.com, Hotels.com, or Airbnb.

3. **Weather**: When asked about weather for a destination, provide seasonal climate information. Mention typical temperatures, rainfall, and the best time to visit. For current/near-term weather, mention that you're providing general seasonal data and recommend checking weather services for real-time forecasts.

4. **Trip Planning**: Create detailed itineraries with day-by-day plans, must-see attractions, local food recommendations, transportation tips, and budget estimates.

Guidelines:
- Be enthusiastic but concise
- Use bullet points and clear formatting
- Include approximate costs in USD when relevant
- Mention visa requirements if applicable
- Suggest travel insurance for international trips
- Always provide actionable, practical advice
- If you don't have real-time data, be transparent and suggest where to find it`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Add funds in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("travel-agent error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
