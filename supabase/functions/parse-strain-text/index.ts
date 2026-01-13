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

const systemPrompt = `You are a cannabis strain data extraction expert. Your task is to parse raw text data about a cannabis strain and extract structured information for a scientific passport database.

CRITICAL: You MUST respond with ONLY a valid JSON object matching this exact structure. No markdown, no code blocks, just pure JSON.

=== OUTPUT SCHEMA (ALL FIELDS) ===

{
  // --- TAB 1: PASSPORT (Basic Info) ---
  "name": "string - strain name, e.g. 'Auto AK-47 Feminised'",
  "breeder": "string or null - seed bank / breeder name, e.g. 'FastBuds'",
  "genotype": "string - e.g. 'Indica-dominant Hybrid' or 'Sativa 60% / Indica 30% / Ruderalis 10%'",
  "genetics": "string - parent strains, e.g. 'Colombian × Mexican × Thai × Afghan'",
  "type": "indica | sativa | hybrid",
  "difficulty": "easy | medium | hard",
  "flowering_days": "number - total cycle days for Autos, or flowering period for Photos",
  "thc_percent": "number - THC percentage as number, e.g. 22",
  "yield_indoor": "string - e.g. '400-500 g/m²'",
  "description": "string - full description of the strain",

  // --- TAB 2: GENETICS & MORPHOLOGY ---
  "growing_params": {
    "nutrition_profile": {
      "feeder_type": "light | medium | heavy"
    },
    "morphology": {
      "stretch_ratio": 2.0
    },
    "phenotype": {
      "height_indoor": "string - e.g. '60-100 cm'",
      "aroma": "string - e.g. 'Spicy, Earthy, Skunky'",
      "structure": "string - e.g. 'Bushy, Compact'"
    },
    "resistance_rating": {
      "mold": 3,
      "pests": 3,
      "heat": 3,
      "cold": 3
    },
    "risks": ["string array - e.g. 'Mold', 'Odor', 'Heat Stress'"],
    "wiki": {
      "training": "string - recommended training methods, e.g. 'LST, SCROG, Topping'",
      "warnings": ["string array - important warnings"]
    },

    // --- TAB 3: ENVIRONMENT (Controller Brain) ---
    "stages": [
      {
        "name": "Seedling",
        "days_duration": 14,
        "temp": [22, 25],
        "humidity": 70,
        "vpd": "0.6-0.8",
        "ppfd": "150-300",
        "ec": "0.6-0.8",
        "light_hours": 18
      },
      {
        "name": "Vegetation",
        "days_duration": 21,
        "temp": [22, 26],
        "humidity": 60,
        "vpd": "0.8-1.1",
        "ppfd": "300-600",
        "ec": "1.0-1.4",
        "light_hours": 18
      },
      {
        "name": "Flowering",
        "days_duration": 35,
        "temp": [20, 24],
        "humidity": 45,
        "vpd": "1.2-1.5",
        "ppfd": "600-900",
        "ec": "1.5-1.8",
        "light_hours": 12
      }
    ],
    "post_harvest": {
      "drying_temp": 18,
      "drying_humidity": 55,
      "drying_days": "7-14",
      "curing_notes": "string - optional curing instructions"
    },

    // --- TAB 4: NUTRITION & PPFD (already in stages above) ---
    "recommendations": {
      "ph_soil": "6.0-7.0",
      "ph_hydro": "5.5-6.5",
      "training": "LST, SCROG recommended",
      "notes": "any additional growing notes"
    },

    // --- TAB 5: ALERTS (Smart Notifications) ---
    "timeline_alerts": [
      {
        "stage": "Vegetation",
        "day_offset": 10,
        "message": "Start LST training now"
      },
      {
        "stage": "Flowering",
        "day_offset": 1,
        "message": "Stretch warning! Monitor height and raise lights if needed"
      }
    ]
  }
}

=== PARSING RULES ===

1. TEMPERATURE: Extract values in Celsius. "24C" or "24°C" = 24. 
   - temp array format: [night_temp, day_temp] or [min_temp, max_temp]
   - If only one temp given, use it for day and subtract 2-4°C for night.

2. HUMIDITY: Parse RH percentage (0-100). "70% RH" or "RH 70%" = 70.

3. RESISTANCE RATINGS (1-5 scale):
   - 1 = Very Low / Very Susceptible / High Risk
   - 2 = Low / Susceptible
   - 3 = Medium / Average
   - 4 = High / Resistant
   - 5 = Very High / Very Resistant
   Examples:
   - "Low mold resistance" or "High mold risk" = mold: 2
   - "Mold resistant" or "Good mold resistance" = mold: 4
   - "Very mold resistant" = mold: 5

4. STRETCH RATIO: Estimate from height descriptions or explicit mentions.
   - 1.0-1.5 = Compact, little stretch
   - 2.0 = Doubles in height during flowering
   - 2.5-3.0 = Significant stretch
   - 3.0+ = Very tall/stretchy

5. FEEDER TYPE: Infer from nutrient mentions.
   - "light feeder", "low nutrients", "sensitive to overfeeding" = "light"
   - "medium feeder", "average nutrients" = "medium"
   - "heavy feeder", "high nutrients", "hungry plant" = "heavy"

6. VPD: Convert or estimate based on temp/humidity.
   - Seedling: 0.4-0.8 kPa
   - Vegetation: 0.8-1.2 kPa
   - Flowering: 1.0-1.6 kPa

7. FLOWERING DAYS: 
   - For Autoflowers: use total seed-to-harvest time
   - For Photoperiod: use flowering period only (after flip)

8. TIMELINE ALERTS: Generate helpful alerts based on strain characteristics.
   - If high stretch, add alert on day 1 of Flowering about height management
   - If mold susceptible, add alert about defoliation and airflow
   - If heavy feeder, add nutrition increase reminders

9. RISKS: Extract any mentioned risks like Mold, Odor, Pests, Heat Stress, etc.

10. If data is missing, use reasonable defaults based on strain type:
    - Indica: shorter, bushier, faster flowering
    - Sativa: taller, stretchier, longer flowering
    - Hybrid: balanced defaults

IMPORTANT: Parse ALL available data from the input text. Be thorough and extract every piece of relevant information into the correct JSON field.`;

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
