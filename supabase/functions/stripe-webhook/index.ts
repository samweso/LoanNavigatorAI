import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import Stripe from "npm:stripe@13.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Stripe-Signature",
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
    const stripeSignature = req.headers.get("stripe-signature");

    if (!stripeSignature) {
      return new Response(
        JSON.stringify({ error: "Missing Stripe signature" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stripeApiKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeApiKey || !stripeWebhookSecret) {
      return new Response(
        JSON.stringify({ error: "Missing Stripe credentials" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stripe = new Stripe(stripeApiKey, {
      apiVersion: "2023-10-16",
    });

    const requestBody = await req.text();
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        requestBody,
        stripeSignature,
        stripeWebhookSecret
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle specific Stripe events
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object;
        
        // Get price from subscription to determine the plan
        const priceId = subscription.items.data[0].price.id;
        
        // Map Stripe price IDs to plan IDs (this would be configured per your plans)
        const planMapping: Record<string, string> = {
          "price_starter": "starter",
          "price_professional": "professional", 
          "price_enterprise": "enterprise"
        };
        
        // Default to 'starter' if price not found
        const planId = planMapping[priceId] || "starter";
        
        // Find user by Stripe customer ID
        const { data: userData, error: userError } = await supabaseClient
          .from("auth.users")
          .select("id")
          .eq("raw_app_meta_data->stripe_customer_id", subscription.customer)
          .single();
          
        if (userError) {
          console.error("Error finding user:", userError.message);
          break;
        }
        
        // Update or create subscription record
        const { error: subscriptionError } = await supabaseClient
          .from("subscriptions")
          .upsert({
            user_id: userData.id,
            plan_id: planId,
            status: subscription.status,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            updated_at: new Date().toISOString()
          }, {
            onConflict: "stripe_subscription_id"
          });
          
        if (subscriptionError) {
          console.error("Error updating subscription:", subscriptionError.message);
        }
        break;
        
      case "customer.subscription.deleted":
        const canceledSubscription = event.data.object;
        
        // Update subscription status to canceled
        const { error: cancelError } = await supabaseClient
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString()
          })
          .eq("stripe_subscription_id", canceledSubscription.id);
          
        if (cancelError) {
          console.error("Error canceling subscription:", cancelError.message);
        }
        break;
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: `Error processing webhook: ${error.message}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});