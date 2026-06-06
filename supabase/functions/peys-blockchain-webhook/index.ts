import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payloadData = encoder.encode(payload);
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadData);
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  
  if (signature.length !== expectedSignature.length) {
    return false;
  }
  
  const sigBuffer = encoder.encode(signature);
  const expectedBuffer = encoder.encode(expectedSignature);
  
  let result = 0;
  for (let i = 0; i < sigBuffer.length; i++) {
    result |= sigBuffer[i] ^ expectedBuffer[i];
  }
  
  return result === 0;
}

interface BlockchainEvent {
  eventType: 'PaymentCreated' | 'PaymentClaimed' | 'PaymentRefunded';
  paymentId: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  data: {
    sender?: string;
    recipient?: string;
    token?: string;
    amount?: string;
    expiry?: number;
    memo?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature
    const signature = req.headers.get('x-webhook-signature');
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    const body = await req.text();
    
    if (!webhookSecret) {
      console.error('WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate signature
    if (!signature) {
      console.warn('Missing webhook signature');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const isValid = await verifyWebhookSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.warn('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const event: BlockchainEvent = JSON.parse(body);
    console.log('Received blockchain event:', event.eventType, event.paymentId);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process event based on type
    switch (event.eventType) {
      case 'PaymentCreated':
        await handlePaymentCreated(supabaseClient, event);
        break;
      case 'PaymentClaimed':
        await handlePaymentClaimed(supabaseClient, event);
        break;
      case 'PaymentRefunded':
        await handlePaymentRefunded(supabaseClient, event);
        break;
      default:
        console.warn('Unknown event type:', event.eventType);
    }

    return new Response(
      JSON.stringify({ success: true, eventType: event.eventType }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handlePaymentCreated(supabase: unknown, event: BlockchainEvent) {
  const { paymentId, transactionHash, data } = event;

  // Check if payment already exists
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('payment_id', paymentId)
    .single();

  if (existing) {
    console.log('Payment already exists, updating tx_hash:', paymentId);
    await supabase
      .from('payments')
      .update({ tx_hash: transactionHash })
      .eq('payment_id', paymentId);
  } else {
    console.log('Payment created on-chain but not in DB:', paymentId);
    // This case should be rare since create-payment edge function creates DB record first
  }
}

async function handlePaymentClaimed(supabase: unknown, event: BlockchainEvent) {
  const { paymentId, transactionHash, data } = event;

  console.log('Processing PaymentClaimed event:', paymentId);

  // Find payment by blockchain payment_id
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('id, status, recipient_email')
    .eq('payment_id', paymentId)
    .single();

  if (fetchError || !payment) {
    console.error('Payment not found:', paymentId, fetchError);
    return;
  }

  // Update payment status
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'claimed',
      claimed_at: new Date().toISOString(),
      tx_hash: transactionHash,
    })
    .eq('payment_id', paymentId);

  if (updateError) {
    console.error('Error updating payment:', updateError);
    return;
  }

  console.log('Payment marked as claimed:', paymentId);

  // Notify sender that payment was claimed
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', payment.recipient_email)
    .single();

  if (profile) {
    await supabase.from('notifications').insert({
      user_id: profile.user_id,
      type: 'payment_claimed',
      title: 'Payment Claimed',
      message: `Your payment has been successfully claimed on-chain`,
      payment_id: payment.id,
    });
  }
}

async function handlePaymentRefunded(supabase: unknown, event: BlockchainEvent) {
  const { paymentId, transactionHash } = event;

  console.log('Processing PaymentRefunded event:', paymentId);

  // Find and update payment
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('id, sender_email')
    .eq('payment_id', paymentId)
    .single();

  if (fetchError || !payment) {
    console.error('Payment not found:', paymentId, fetchError);
    return;
  }

  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'refunded',
      tx_hash: transactionHash,
    })
    .eq('payment_id', paymentId);

  if (updateError) {
    console.error('Error updating payment:', updateError);
    return;
  }

  console.log('Payment marked as refunded:', paymentId);

  // Notify sender of refund
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', payment.sender_email)
    .single();

  if (profile) {
    await supabase.from('notifications').insert({
      user_id: profile.user_id,
      type: 'payment_refunded',
      title: 'Payment Refunded',
      message: `Your expired payment has been refunded`,
      payment_id: payment.id,
    });
  }
}
