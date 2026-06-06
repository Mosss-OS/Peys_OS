import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") || "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Email template function
function generateEmailHTML(params: {
  recipientEmail: string;
  senderEmail: string;
  amount: number;
  token: string;
  memo: string | null;
  claimLink: string;
  appUrl: string;
}): string {
  const { recipientEmail, senderEmail, amount, token, memo, claimLink, appUrl } = params;
  const formattedAmount = amount.toFixed(2);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've received ${formattedAmount} ${token} on Peys!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px; }
    .content { padding: 40px 30px; }
    .amount-display { text-align: center; margin: 30px 0; }
    .amount-display .amount { font-size: 48px; font-weight: 800; color: #667eea; }
    .amount-display .token { font-size: 24px; color: #666; }
    .details { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0; }
    .details-row { display: flex; justify-content: space-between; margin: 12px 0; }
    .details-row span:first-child { color: #666; }
    .details-row span:last-child { font-weight: 600; color: #333; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 18px 50px; border-radius: 30px; font-weight: 700; font-size: 18px; margin: 30px 0; text-align: center; }
    .cta-container { text-align: center; }
    .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 13px; color: #999; }
    .footer a { color: #667eea; text-decoration: none; }
    .logo { width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💰</div>
      <h1>You've received money!</h1>
      <p>Someone sent you crypto on Peys Magic Links</p>
    </div>
    <div class="content">
      <div class="amount-display">
        <div class="amount">$${formattedAmount}</div>
        <div class="token">${token}</div>
      </div>
      
      <div class="details">
        <div class="details-row">
          <span>From</span>
          <span>${senderEmail}</span>
        </div>
        <div class="details-row">
          <span>Amount</span>
          <span>${formattedAmount} ${token}</span>
        </div>
        <div class="details-row">
          <span>To</span>
          <span>${recipientEmail}</span>
        </div>
        ${memo ? `
        <div class="details-row">
          <span>Note</span>
          <span>"${memo}"</span>
        </div>
        ` : ''}
        <div class="details-row">
          <span>Expires</span>
          <span>7 days from now</span>
        </div>
      </div>
      
      <p style="text-align: center; color: #666; font-size: 16px; margin: 25px 0;">
        Click below to claim your funds. If you don't have an account yet, you'll be able to create one instantly with your email.
      </p>
      
      <div class="cta-container">
        <a href="${claimLink}" class="cta-button">Claim Your Funds</a>
      </div>
      
      <p style="text-align: center; color: #999; font-size: 14px; margin-top: 30px;">
        Or copy this link:<br>
        <a href="${claimLink}" style="color: #667eea; word-break: break-all;">${claimLink}</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>Peys Magic Links</strong> - Send crypto to anyone via email</p>
      <p>Powered by Polkadot, Celo, and Base blockchains</p>
      <p style="margin-top: 15px;">
        <a href="${appUrl}">Visit App</a> · 
        <a href="${appUrl}/support">Support</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Generate plain text version
function generateEmailText(params: {
  recipientEmail: string;
  senderEmail: string;
  amount: number;
  token: string;
  memo: string | null;
  claimLink: string;
}): string {
  const { senderEmail, amount, token, memo, claimLink } = params;
  return `
You've received ${amount.toFixed(2)} ${token} on Peys Magic Links!

From: ${senderEmail}
Amount: ${amount.toFixed(2)} ${token}
${memo ? `Note: "${memo}"\n` : ''}

Click this link to claim your funds:
${claimLink}

If you don't have an account yet, you can create one instantly using the same email address (${params.recipientEmail}).

This payment expires in 7 days.

---
Peys Magic Links
Powered by Polkadot, Celo, and Base blockchains
  `.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { recipientEmail, senderEmail = "Someone", amount, token, memo, claimLink, appUrl = "https://peys.io" } =
      await req.json();

    if (!recipientEmail || !amount || !token || !claimLink) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate email content
    const htmlContent = generateEmailHTML({
      recipientEmail,
      senderEmail,
      amount,
      token,
      memo,
      claimLink,
      appUrl,
    });

    const textContent = generateEmailText({
      recipientEmail,
      senderEmail,
      amount,
      token,
      memo,
      claimLink,
    });

    // Try to send email if Resend API key is configured
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;

    if (RESEND_API_KEY) {
      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: Deno.env.get("RESEND_FROM_EMAIL") || "Peys <onboarding@resend.dev>",
            to: [recipientEmail],
            subject: `You've received ${amount.toFixed(2)} ${token} on Peys!`,
            html: htmlContent,
            text: textContent,
          }),
        });

        if (resendResponse.ok) {
          emailSent = true;
          console.log("Email sent successfully via Resend");
        } else {
          const errorData = await resendResponse.text();
          console.error("Resend API error:", errorData);
        }
      } catch (emailError) {
        console.error("Error sending email via Resend:", emailError);
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping email send. Logged for testing.");
    }

    // Log the notification for record keeping
    console.log("Payment notification:", {
      to: recipientEmail,
      from: senderEmail,
      amount,
      token,
      memo,
      claimLink,
      emailSent,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification ${emailSent ? 'sent' : 'logged'} for ${recipientEmail}`,
        emailSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
