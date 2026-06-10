const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Chizaram+5466@db.nhxjvhohfgihmrtiytix.supabase.co:5432/postgres'
});

async function setupDatabase() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT,
        wallet_address TEXT,
        display_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);
    console.log('Created profiles table');

    // Create payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.payments (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        payment_id TEXT NOT NULL UNIQUE,
        sender_user_id UUID NOT NULL REFERENCES auth.users(id),
        sender_email TEXT NOT NULL,
        sender_wallet TEXT,
        recipient_email TEXT NOT NULL,
        amount NUMERIC NOT NULL CHECK (amount > 0),
        token TEXT NOT NULL CHECK (token IN ('USDC', 'USDT')),
        memo TEXT,
        claim_secret TEXT NOT NULL,
        claim_link TEXT NOT NULL UNIQUE,
        blockchain_payment_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'refunded')),
        tx_hash TEXT,
        claimed_by_user_id UUID REFERENCES auth.users(id),
        claimed_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);
    console.log('Created payments table');

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('payment_received', 'payment_claimed', 'payment_expired', 'payment_refunded')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        payment_id UUID REFERENCES public.payments(id),
        read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);
    console.log('Created notifications table');

    // Enable RLS on tables
    await client.query('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY');
    console.log('Enabled RLS');

    // Create RLS policies for profiles
    await client.query(`CREATE POLICY IF NOT EXISTS "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true)`);
    await client.query(`CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id)`);
    await client.query(`CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id)`);

    // Create RLS policies for payments
    await client.query(`CREATE POLICY IF NOT EXISTS "Anyone can view payments" ON public.payments FOR SELECT USING (true)`);
    await client.query(`CREATE POLICY IF NOT EXISTS "Authenticated users can create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = sender_user_id)`);
    await client.query(`CREATE POLICY IF NOT EXISTS "Recipients can claim payments" ON public.payments FOR UPDATE USING (status = 'pending')`);

    // Create RLS policies for notifications
    await client.query(`CREATE POLICY IF NOT EXISTS "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id)`);
    await client.query(`CREATE POLICY IF NOT EXISTS "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id)`);
    await client.query(`CREATE POLICY IF NOT EXISTS "Anyone can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true)`);
    console.log('Created RLS policies');

    // Create trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SET search_path = public
    `);
    console.log('Created update_updated_at_column function');

    // Create triggers
    await client.query(`CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()`);
    await client.query(`CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()`);
    console.log('Created triggers');

    // Create handle_new_user function
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (user_id, email)
        VALUES (NEW.id, NEW.email);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
    `);
    await client.query(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`);
    await client.query(`CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()`);
    console.log('Created handle_new_user function and trigger');

    // Create notify_recipient function
    await client.query(`
      CREATE OR REPLACE FUNCTION public.notify_recipient(
        p_recipient_email TEXT,
        p_title TEXT,
        p_message TEXT,
        p_payment_id UUID,
        p_type TEXT DEFAULT 'payment_received'
      )
      RETURNS VOID AS $$
      DECLARE
        v_user_id UUID;
      BEGIN
        SELECT user_id INTO v_user_id
        FROM public.profiles
        WHERE email = p_recipient_email
        LIMIT 1;

        IF v_user_id IS NOT NULL THEN
          INSERT INTO public.notifications (user_id, type, title, message, payment_id)
          VALUES (v_user_id, p_type, p_title, p_message, p_payment_id);
        END IF;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
    `);
    console.log('Created notify_recipient function');

    console.log('\n✅ Database setup complete!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

setupDatabase();
