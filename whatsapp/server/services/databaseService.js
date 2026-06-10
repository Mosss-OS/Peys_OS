/**
 * Database Service for WhatsApp Bot
 * 
 * Interacts with Supabase using the same tables as the main app:
 * - profiles (with whatsapp_id, phone_number, passcode_hash)
 * - wallets
 * - transactions
 * - escrow_payments
 * - whatsapp_sessions
 * - whatsapp_commands
 * - notifications
 * 
 * Security Features:
 * - Passcodes are hashed using bcrypt
 * - Wallet keys are derived using PBKDF2 with salt
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ============================================================================
// Supabase Client
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return supabaseUrl && 
         !supabaseUrl.includes('your-project') &&
         supabaseKey &&
         !supabaseKey.includes('your_');
};

// Initialize Supabase client
const getSupabase = () => {
  if (!supabase && isSupabaseConfigured()) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabase;
};

// ============================================================================
// In-Memory Mock Store (for testing without Supabase)
// ============================================================================

const mockStore = {
  profiles: new Map(),  // keyed by whatsapp_id
  transactions: [],
  escrowPayments: []
};

// ============================================================================
// Profile Operations (profiles table)
// ============================================================================

/**
 * Get profile by WhatsApp ID
 */
export async function getProfileByWhatsappId(whatsappId) {
  const client = getSupabase();
  
  if (!client) {
    // Mock mode
    return mockStore.profiles.get(whatsappId) || null;
  }

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('whatsapp_id', whatsappId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting profile:', error.message);
    return null;
  }

  return data;
}

/**
 * Check if user is registered (has profile with whatsapp_id)
 */
export async function isUserRegistered(whatsappId) {
  const profile = await getProfileByWhatsappId(whatsappId);
  return !!profile;
}

/**
 * Create new profile for WhatsApp user
 */
export async function createProfile(whatsappId, phone, passcode) {
  const client = getSupabase();
  
  // Generate secure wallet address with salt
  const { walletAddress, walletSalt } = generateWalletAddress(passcode);
  const passcodeHash = await hashPasscode(passcode);
  
  if (!client) {
    // Mock mode - create in-memory profile
    const mockProfile = {
      id: crypto.randomUUID(),
      whatsapp_id: whatsappId,
      phone_number: phone,
      passcode_hash: passcodeHash,
      wallet_address: walletAddress,
      wallet_salt: walletSalt,
      whatsapp_linked: true,
      primary_wallet_address: walletAddress,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockStore.profiles.set(whatsappId, mockProfile);
    console.log(`[DB-MOCK] Created profile for ${whatsappId}`);
    return mockProfile;
  }

  // Note: In production, profile should be created via auth signup
  // For WhatsApp-only users, we create a minimal profile
  const { data, error } = await client
    .from('profiles')
    .upsert({
      whatsapp_id: whatsappId,
      phone_number: phone,
      passcode_hash: passcodeHash,
      wallet_address: walletAddress,
      wallet_salt: walletSalt,
      whatsapp_linked: true,
      primary_wallet_address: walletAddress
    }, {
      onConflict: 'whatsapp_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error.message);
    return null;
  }

  console.log(`[DB] Created/updated profile for ${whatsappId}`);
  return data;
}

/**
 * Get user's primary wallet address
 */
export async function getUserWallet(whatsappId) {
  const profile = await getProfileByWhatsappId(whatsappId);
  return profile?.primary_wallet_address || profile?.wallet_address || null;
}

/**
 * Lookup user by username
 */
export async function lookupUserByUsername(username) {
  const client = getSupabase();
  
  if (!client) {
    // Mock mode - search by username in mock profiles
    for (const [_, profile] of mockStore.profiles) {
      if (profile.username?.toLowerCase() === username.toLowerCase()) {
        return profile;
      }
    }
    return null;
  }

  const { data, error } = await client
    .from('profiles')
    .select('id, whatsapp_id, username, wallet_address, primary_wallet_address, phone, email')
    .ilike('username', username)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error looking up user by username:', error.message);
    return null;
  }

  return data;
}

/**
 * Lookup user by phone number (with or without + prefix)
 */
export async function lookupUserByPhone(phone) {
  const client = getSupabase();
  
  // Normalize phone - remove + prefix and any spaces
  const normalizedPhone = phone.replace(/[\+\s-]/g, '');
  
  if (!client) {
    // Mock mode - search by phone in mock profiles
    for (const [_, profile] of mockStore.profiles) {
      const profilePhone = profile.phone_number?.replace(/[\+\s-]/g, '');
      if (profilePhone === normalizedPhone) {
        return profile;
      }
    }
    return null;
  }

  // Search with and without + prefix
  const { data, error } = await client
    .from('profiles')
    .select('id, whatsapp_id, username, wallet_address, primary_wallet_address, phone, email')
    .or(`phone.eq.+${normalizedPhone},phone.eq.${normalizedPhone},phone.eq.${normalizedPhone}`)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error looking up user by phone:', error.message);
    return null;
  }

  return data;
}

/**
 * Update user's username
 */
export async function updateUsername(whatsappId, username) {
  const client = getSupabase();
  
  if (!client) {
    // Mock mode
    const profile = mockStore.profiles.get(whatsappId);
    if (profile) {
      profile.username = username;
      profile.updated_at = new Date().toISOString();
      return profile;
    }
    return null;
  }

  const { data, error } = await client
    .from('profiles')
    .update({ username, updated_at: new Date().toISOString() })
    .eq('whatsapp_id', whatsappId)
    .select()
    .single();

  if (error) {
    console.error('Error updating username:', error.message);
    return null;
  }

  return data;
}

// ============================================================================
// WhatsApp Session Operations (whatsapp_sessions table)
// ============================================================================

/**
 * Save WhatsApp session
 */
export async function saveWhatsappSession(userId, phoneNumber, whatsappJid, sessionData) {
  const client = getSupabase();
  
  if (!client) {
    console.log(`[DB-MOCK] Saved session for ${phoneNumber}`);
    return true;
  }

  const { error } = await client
    .from('whatsapp_sessions')
    .upsert({
      user_id: userId,
      phone_number: phoneNumber,
      whatsapp_jid: whatsappJid,
      session_data: sessionData,
      is_active: true
    }, {
      onConflict: 'phone_number'
    });

  if (error) {
    console.error('Error saving session:', error.message);
    return false;
  }

  return true;
}

// ============================================================================
// WhatsApp Commands Audit Log (whatsapp_commands table)
// ============================================================================

/**
 * Log WhatsApp command execution
 */
export async function logCommand(userId, phoneNumber, command, parameters, response, status = 'success', errorMessage = null) {
  const client = getSupabase();
  
  if (!client) {
    console.log(`[DB-MOCK] Command: ${command} from ${phoneNumber}`);
    return true;
  }

  const { error } = await client
    .from('whatsapp_commands')
    .insert({
      user_id: userId,
      phone_number: phoneNumber,
      command,
      parameters,
      response,
      status,
      error_message: errorMessage
    });

  if (error) {
    console.error('Error logging command:', error.message);
    return false;
  }

  return true;
}

// ============================================================================
// Transaction Operations (transactions table)
// ============================================================================

/**
 * Create transaction record
 */
export async function createTransaction(transaction) {
  const client = getSupabase();
  
  const txData = {
    tx_hash: transaction.txHash,
    user_id: transaction.userId,
    profile_id: transaction.profileId,
    type: transaction.type, // 'send', 'receive', 'escrow_create', 'escrow_claim', etc.
    amount: transaction.amount, // in smallest unit (e.g., wei for ETH)
    amount_usd: transaction.amountUsd,
    token: transaction.token || 'USDC',
    status: transaction.status || 'pending',
    recipient_phone: transaction.recipientPhone,
    recipient_wallet: transaction.recipientWallet,
    sender_wallet: transaction.senderWallet,
    escrow_id: transaction.escrowId,
    fee: transaction.fee || 0,
    memo: transaction.memo,
    metadata: transaction.metadata || {}
  };

  if (!client) {
    // Mock mode
    txData.id = crypto.randomUUID();
    txData.created_at = new Date().toISOString();
    mockStore.transactions.push(txData);
    console.log(`[DB-MOCK] Created transaction: ${txData.type} ${txData.amount} ${txData.token}`);
    return txData;
  }

  const { data, error } = await client
    .from('transactions')
    .insert(txData)
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error.message);
    return null;
  }

  console.log(`[DB] Created transaction: ${data.id}`);
  return data;
}

/**
 * Get user's transaction history
 */
export async function getUserTransactions(whatsappId, limit = 10) {
  const client = getSupabase();
  
  if (!client) {
    // Mock mode
    return mockStore.transactions
      .filter(tx => tx.recipient_phone === whatsappId || tx.metadata?.sender_whatsapp_id === whatsappId)
      .slice(-limit);
  }

  const profile = await getProfileByWhatsappId(whatsappId);
  if (!profile) return [];

  const { data, error } = await client
    .from('transactions')
    .select('*')
    .or(`profile_id.eq.${profile.id},recipient_phone.eq.${whatsappId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting transactions:', error.message);
    return [];
  }

  return data || [];
}

// ============================================================================
// Escrow Payment Operations (escrow_payments table)
// ============================================================================

/**
 * Create escrow payment record
 */
export async function createEscrowPayment(escrow) {
  const client = getSupabase();
  
  const escrowData = {
    payment_id: escrow.paymentId,
    secret_hash: escrow.secretHash,
    sender_id: escrow.senderId,
    sender_profile_id: escrow.senderProfileId,
    sender_wallet: escrow.senderWallet,
    recipient_phone: escrow.recipientPhone,
    claim_code: escrow.claimCode,
    amount: escrow.amount,
    amount_usd: escrow.amountUsd,
    token: escrow.token || 'USDC',
    expiry: escrow.expiry,
    status: 'pending',
    tx_hash: escrow.txHash,
    memo: escrow.memo
  };

  if (!client) {
    // Mock mode
    escrowData.id = crypto.randomUUID();
    escrowData.created_at = new Date().toISOString();
    mockStore.escrowPayments.push(escrowData);
    console.log(`[DB-MOCK] Created escrow: ${escrowData.payment_id}`);
    return escrowData;
  }

  const { data, error } = await client
    .from('escrow_payments')
    .insert(escrowData)
    .select()
    .single();

  if (error) {
    console.error('Error creating escrow:', error.message);
    return null;
  }

  console.log(`[DB] Created escrow: ${data.payment_id}`);
  return data;
}

/**
 * Get pending escrow payments for a recipient
 */
export async function getPendingEscrows(phoneNumber) {
  const client = getSupabase();
  
  if (!client) {
    // Mock mode
    return mockStore.escrowPayments.filter(
      e => e.recipient_phone === phoneNumber && e.status === 'pending'
    );
  }

  const { data, error } = await client
    .from('escrow_payments')
    .select('*')
    .eq('recipient_phone', phoneNumber)
    .eq('status', 'pending')
    .gt('expiry', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting escrows:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Update escrow status
 */
export async function updateEscrowStatus(paymentId, status, extraData = {}) {
  const client = getSupabase();
  
  if (!client) {
    // Mock mode
    const escrow = mockStore.escrowPayments.find(e => e.payment_id === paymentId);
    if (escrow) {
      escrow.status = status;
      Object.assign(escrow, extraData);
    }
    console.log(`[DB-MOCK] Updated escrow ${paymentId} to ${status}`);
    return true;
  }

  const { error } = await client
    .from('escrow_payments')
    .update({ 
      status, 
      ...extraData,
      ...(status === 'claimed' ? { claimed_at: new Date().toISOString() } : {}),
      ...(status === 'refunded' ? { refunded_at: new Date().toISOString() } : {})
    })
    .eq('payment_id', paymentId);

  if (error) {
    console.error('Error updating escrow:', error.message);
    return false;
  }

  return true;
}

// ============================================================================
// Notification Operations (notifications table)
// ============================================================================

/**
 * Create notification for user
 */
export async function createNotification(userId, type, title, message, paymentId = null) {
  const client = getSupabase();
  
  if (!client) {
    console.log(`[DB-MOCK] Notification for ${userId}: ${title}`);
    return true;
  }

  const { error } = await client
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      payment_id: paymentId
    });

  if (error) {
    console.error('Error creating notification:', error.message);
    return false;
  }

  return true;
}

// ============================================================================
// Utility Functions - Security
// ============================================================================

/**
 * Hash passcode using PBKDF2
 * @param {string} passcode - User's passcode
 * @returns {Promise<string>} - Hashed passcode
 */
async function hashPasscode(passcode) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(passcode, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify passcode against stored hash
 * @param {string} passcode - User's passcode
 * @param {string} storedHash - Stored hash in format "salt:hash"
 * @returns {Promise<boolean>} - True if passcode matches
 */
async function verifyPasscode(passcode, storedHash) {
  const [salt, hash] = storedHash.split(':');
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(passcode, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(hash === derivedKey.toString('hex'));
    });
  });
}

/**
 * Generate wallet address from passcode using PBKDF2
 * @param {string} passcode - User's passcode
 * @returns {Object} - { walletAddress, walletSalt }
 */
function generateWalletAddress(passcode) {
  // Generate a unique salt for this wallet
  const salt = crypto.randomBytes(16).toString('hex');
  
  // Derive key using PBKDF2
  const hash = crypto.pbkdf2Sync(passcode, salt, 100000, 32, 'sha512');
  
  // Take first 20 bytes as wallet address
  const address = hash.toString('hex').slice(0, 40);
  
  return {
    walletAddress: `0x${address}`,
    walletSalt: salt
  };
}

/**
 * Derive wallet address from stored salt and passcode
 * @param {string} passcode - User's passcode
 * @param {string} salt - Stored salt
 * @returns {string} - Wallet address
 */
function deriveWalletAddress(passcode, salt) {
  const hash = crypto.pbkdf2Sync(passcode, salt, 100000, 32, 'sha512');
  const address = hash.toString('hex').slice(0, 40);
  return `0x${address}`;
}

/**
 * Check Supabase connection health
 */
export async function checkDatabaseHealth() {
  const client = getSupabase();
  
  if (!client) {
    return { status: 'mock', message: 'Running in mock mode - no Supabase configured' };
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      return { status: 'error', message: error.message };
    }

    return { status: 'ok', message: 'Connected to Supabase' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  // Config
  isSupabaseConfigured,
  checkDatabaseHealth,
  
  // Profile
  getProfileByWhatsappId,
  isUserRegistered,
  createProfile,
  getUserWallet,
  verifyPasscode,
  
  // Session
  saveWhatsappSession,
  
  // Commands
  logCommand,
  
  // Transactions
  createTransaction,
  getUserTransactions,
  
  // Escrow
  createEscrowPayment,
  getPendingEscrows,
  updateEscrowStatus,
  
  // Notifications
  createNotification
};
