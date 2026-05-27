// supabase/functions/generate-course/index.ts
// Generates a complete 8-lesson agriculture course using Google Gemini API

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { topic, category } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are an expert South African agriculture educator. Generate a complete, accurate, and practical agriculture course about "${topic}" in the category "${category ?? 'General Agriculture'}".

The course must follow this EXACT 8-lesson structure:
Lesson 1: Introduction & Overview
Lesson 2: Climate & Growing Conditions
Lesson 3: Soil Preparation
Lesson 4: Planting
Lesson 5: Watering & Irrigation
Lesson 6: Pest & Disease Management
Lesson 7: Monitoring & Care
Lesson 8: Harvesting & Post-Harvest

Return ONLY valid JSON, no markdown, no backticks, no explanation:
{
  "title": "Complete course title e.g. Growing Maize in South Africa",
  "description": "2-3 sentence course description",
  "category": "${category ?? 'General Agriculture'}",
  "lessons": [
    {
      "order_index": 1,
      "title": "Lesson title",
      "description": "One sentence describing this lesson",
      "content": "Full detailed lesson content minimum 400 words with practical South African farming advice. Include specific measurements in metric units.",
      "duration_mins": 15,
      "quiz": {
        "title": "Quiz: Lesson Title",
        "pass_score": 70,
        "questions": [
          {
            "text": "Question?",
            "type": "multiple_choice",
            "order_index": 1,
            "options": [
              { "text": "Correct answer", "is_correct": true, "order_index": 1 },
              { "text": "Wrong answer", "is_correct": false, "order_index": 2 },
              { "text": "Wrong answer", "is_correct": false, "order_index": 3 },
              { "text": "Wrong answer", "is_correct": false, "order_index": 4 }
            ]
          },
          {
            "text": "Question 2?",
            "type": "multiple_choice",
            "order_index": 2,
            "options": [
              { "text": "Wrong answer", "is_correct": false, "order_index": 1 },
              { "text": "Correct answer", "is_correct": true, "order_index": 2 },
              { "text": "Wrong answer", "is_correct": false, "order_index": 3 },
              { "text": "Wrong answer", "is_correct": false, "order_index": 4 }
            ]
          },
          {
            "text": "Question 3?",
            "type": "multiple_choice",
            "order_index": 3,
            "options": [
              { "text": "Wrong answer", "is_correct": false, "order_index": 1 },
              { "text": "Wrong answer", "is_correct": false, "order_index": 2 },
              { "text": "Correct answer", "is_correct": true, "order_index": 3 },
              { "text": "Wrong answer", "is_correct": false, "order_index": 4 }
            ]
          },
          {
            "text": "Question 4?",
            "type": "multiple_choice",
            "order_index": 4,
            "options": [
              { "text": "Wrong answer", "is_correct": false, "order_index": 1 },
              { "text": "Wrong answer", "is_correct": false, "order_index": 2 },
              { "text": "Wrong answer", "is_correct": false, "order_index": 3 },
              { "text": "Correct answer", "is_correct": true, "order_index": 4 }
            ]
          },
          {
            "text": "Question 5?",
            "type": "multiple_choice",
            "order_index": 5,
            "options": [
              { "text": "Correct answer", "is_correct": true, "order_index": 1 },
              { "text": "Wrong answer", "is_correct": false, "order_index": 2 },
              { "text": "Wrong answer", "is_correct": false, "order_index": 3 },
              { "text": "Wrong answer", "is_correct": false, "order_index": 4 }
            ]
          }
        ]
      }
    }
  ]
}

Generate all 8 lessons. Make content practical, accurate, relevant to South African farmers. Use metric measurements.`;

    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', errText);
      return new Response(
        JSON.stringify({ error: 'AI generation failed. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let courseData;
    try {
      courseData = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse Gemini response:', cleaned.slice(0, 500));
      return new Response(
        JSON.stringify({ error: 'AI returned invalid data. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ data: courseData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
