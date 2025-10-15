import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReferralRequest {
  type: 'email' | 'sms';
  to: string;
  from: string;
  appUrl: string;
  description: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { type, to, from, appUrl, description }: ReferralRequest = await req.json();

    if (!type || !to || !from || !appUrl || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (type === 'email') {
      console.log(`Sending email referral to: ${to}`);
      console.log(`From: ${from}`);
      console.log(`App URL: ${appUrl}`);
      console.log(`Description: ${description}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email referral sent successfully',
          info: 'Email functionality is simulated. In production, integrate with services like SendGrid, AWS SES, or Resend.'
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else if (type === 'sms') {
      console.log(`Sending SMS referral to: ${to}`);
      console.log(`From: ${from}`);
      console.log(`App URL: ${appUrl}`);
      console.log(`Description: ${description.substring(0, 100)}...`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'SMS referral sent successfully',
          info: 'SMS functionality is simulated. In production, integrate with services like Twilio, AWS SNS, or Vonage.'
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid referral type' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error processing referral:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
