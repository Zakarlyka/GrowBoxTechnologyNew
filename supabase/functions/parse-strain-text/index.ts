import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a cannabis strain data extraction expert. Your task is to parse raw text data about a cannabis strain and extract structured information.

CRITICAL: You MUST respond with ONLY a valid JSON object matching this exact structure. No markdown, no code blocks, just pure JSON.

Output structure:
{
  "name": "string - strain name",
  "breeder": "string or null - seed bank / breeder name",
  "type": "indica | sativa | hybrid",
  "genotype": "string - e.g. 'Indica-dominant Hybrid' or 'Sativa 60% / Indica 30% / Ruderalis 10%'",
  "genetics": "string - parent strains, e.g. 'Colombian × Mexican × Thai'",
  "thc_percent": "number or null - THC percentage as number, e.g. 20",
  "flowering_days": "number or null - total flowering days",
  "difficulty": "easy | medium | hard",
  "yield_indoor": "string - e.g. '400-500 g/m²'",
  "description": "string - brief description",
  "growing_params": {
    "stages": [
      {
        "name": "Seedling",
        "days_duration": 14,
        "temp": [22, 25],
        "humidity": 70,
        "vpd": "0.6-0.8",
        "ppfd": "150-300",
        "ec": "0.6-0.8"
      },
      {
        "name": "Vegetation",
        "days_duration": 21,
        "temp": [22, 26],
        "humidity": 60,
        "vpd": "0.8-1.1",
        "ppfd": "300-600",
        "ec": "1.0-1.4"
      },
      {
        "name": "Flowering",
        "days_duration": 35,
        "temp": [20, 24],
        "humidity": 45,
        "vpd": "1.2-1.5",
        "ppfd": "600-900",
        "ec": "1.5-1.8"
      }
    ],
    "risks": ["array of risk strings, e.g. 'Mold susceptibility in high humidity'"],
    "morphology": {
      "stretch_ratio": 2.0,
      "bud_density": "dense | medium | airy",
      "odor_intensity": 0.8
    },
    "resistance_rating": {
      "mold": 3,
      "pests": 3,
      "heat": 3,
      "cold": 3
    },
    "nutrition_profile": {
      "feeder_type": "light | medium | heavy"
    },
    "phenotype": {
      "height_indoor": "80-120cm",
      "aroma": "earthy, woody, skunky",
      "structure": "bushy / compact"
    },
    "recommendations": {
      "ph_soil": "6.0-7.0",
      "ph_hydro": "5.5-6.5",
      "training": "LST, SCROG recommended",
      "notes": "any additional notes"
    }
  }
}

Parsing rules:
1. Extract temperature values in Celsius. If you see "24C" or "24°C", extract 24.
2. Parse humidity as RH percentage (0-100).
3. For resistance ratings, use 1-5 scale: 1=very low, 2=low, 3=medium, 4=high, 5=very high.
   - "Low mold resistance" = mold: 2
   - "High mold risk" = mold: 1 or 2
   - "Mold resistant" = mold: 4 or 5
4. For stretch_ratio, estimate from height descriptions (2.0 = doubles in flower, 3.0 = triples).
5. For odor_intensity, use 0-1 scale (0.3=low, 0.5=medium, 0.8=high, 1.0=very strong).
6. For feeder_type, infer from nutrient mentions.
7. If specific climate data per stage is provided, update the stages array.
8. If data is missing, use reasonable defaults or null.

IMPORTANT: Parse ALL available data. If the text mentions specific temperatures, humidity, or VPD for different stages (Seedling, Veg, Flower), update the stages array accordingly.`;

    const userPrompt = `Parse the following strain datasheet and extract all available data:

---
${text}
---

Respond with ONLY the JSON object, no additional text.`;

    console.log('[parse-strain-text] Processing text length:', text.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("[parse-strain-text] AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log('[parse-strain-text] Raw AI response:', content);

    // Parse the JSON from the response
    let parsedData;
    try {
      // Try to extract JSON from the response (in case it has markdown code blocks)
      let jsonStr = content.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      parsedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[parse-strain-text] JSON parse error:', parseError);
      console.error('[parse-strain-text] Failed content:', content);
      throw new Error("Failed to parse AI response as JSON");
    }

    console.log('[parse-strain-text] Successfully parsed strain data:', parsedData.name);

    return new Response(
      JSON.stringify({ success: true, data: parsedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[parse-strain-text] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
