import { createClient } from "npm:@supabase/supabase-js@2.39.7";

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

    const { applicationId } = await req.json();

    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: "Application ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get application data from database
    const { data: applicationData, error: appError } = await supabaseClient
      .from("loan_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError) {
      return new Response(
        JSON.stringify({ error: `Error fetching application: ${appError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // In a real implementation, this would make an API call to Encompass
    // using the Encompass API credentials
    
    // Simulate API call to Encompass
    // This is where you would add the real Encompass API integration
    
    /* 
    Example of what real Encompass integration might look like:
    
    const encompassApiUrl = Deno.env.get("ENCOMPASS_API_URL");
    const encompassApiKey = Deno.env.get("ENCOMPASS_API_KEY");
    
    const encompassResponse = await fetch(`${encompassApiUrl}/loans`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${encompassApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        borrower: {
          firstName: applicationData.client_name.split(' ')[0],
          lastName: applicationData.client_name.split(' ').slice(1).join(' '),
          email: applicationData.client_email,
          phone: applicationData.client_phone
        },
        loan: {
          loanAmount: applicationData.loan_amount,
          loanType: applicationData.loan_type,
          propertyType: applicationData.property_type,
          interestRate: applicationData.interest_rate,
          term: applicationData.term
        }
      })
    });
    
    const encompassData = await encompassResponse.json();
    const encompassId = encompassData.loanId;
    */
    
    // For demo purposes, generate a mock Encompass ID
    const encompassId = `EN-${Math.floor(Math.random() * 1000000)}`;
    
    // Update the application with the Encompass ID and status
    const { error: updateError } = await supabaseClient
      .from("loan_applications")
      .update({
        status: "Pushed to Encompass",
        encompass_id: encompassId
      })
      .eq("id", applicationId);
    
    if (updateError) {
      return new Response(
        JSON.stringify({ error: `Error updating application: ${updateError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Application successfully pushed to Encompass",
        encompassId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: `Error pushing to Encompass: ${error.message}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});