import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import OpenAI from "npm:openai@4.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    const { callId } = await req.json();

    if (!callId) {
      return new Response(
        JSON.stringify({ error: "Call ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get call data from database
    const { data: callData, error: callError } = await supabaseClient
      .from("calls")
      .select("*")
      .eq("id", callId)
      .single();

    if (callError) {
      return new Response(
        JSON.stringify({ error: `Error fetching call: ${callError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update call status to processing
    await supabaseClient
      .from("calls")
      .update({ status: "processing" })
      .eq("id", callId);

    // Download audio file
    const audioUrl = callData.audio_url;
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();

    // Create a FormData instance for the audio transcription
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.mp3");
    formData.append("model", "whisper-1");

    // Call OpenAI Whisper API for transcription
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: audioBlob,
      model: "whisper-1",
    });

    const transcript = transcriptionResponse.text;

    // Call GPT-4 to analyze the transcript
    const analyzeResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant specializing in mortgage lending. 
          Analyze the transcript of a call between a loan officer and a client to extract key details.
          Structure your response in JSON format with the following sections:
          1. summary - A concise summary of the conversation
          2. key_points - An array of important points discussed
          3. action_items - An array of next steps the loan officer should take
          4. loan_info - An object containing loan details with the following properties if mentioned:
             - loan_type (e.g., Conventional, FHA, VA, etc.)
             - loan_amount (as a number without commas or currency symbols)
             - property_type (e.g., Single Family, Condo, etc.)
             - rate (as a number)
             - term (in years, as a number)`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      response_format: { type: "json_object" },
    });

    const analysisJson = JSON.parse(analyzeResponse.choices[0].message.content);

    // Update call with transcript and analysis
    const { error: updateError } = await supabaseClient
      .from("calls")
      .update({
        transcript,
        summary: analysisJson.summary,
        key_points: analysisJson.key_points,
        action_items: analysisJson.action_items,
        loan_info: analysisJson.loan_info,
        status: "completed",
      })
      .eq("id", callId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: `Error updating call: ${updateError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Call processed successfully",
        transcript,
        analysis: analysisJson,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: `Error processing call: ${error.message}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});