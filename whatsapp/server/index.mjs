/**
 * Peys WhatsApp Bot v3.0 - Cloud API Edition
 * 
 * Uses the official WhatsApp Cloud API (Meta) instead of whatsapp-web.js
 * This works behind firewalls - no browser automation needed
 * 
 * Setup:
 * 1. Create a Meta Developer account: https://developers.facebook.com/
 * 2. Create a WhatsApp Business App
 * 3. Get your Phone Number ID and Access Token
 * 4. Set up the webhook in Meta Developer Console
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

// Suppress ethers ENS background errors
process.on('unhandledRejection', (reason) => {
  if (reason?.message?.includes('ENS') || reason?.message?.includes('network does not support')) {
    return;
  }
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  if (error?.message?.includes('ENS') || error?.message?.includes('network does not support')) {
    console.warn('⚠️ Ignoring ethers ENS error on non-ENS network');
    return;
  }
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Import services
import escrowService from './services/escrowService.js';
import blockchainService from './services/blockchainService.js';
import dbService from './services/databaseService.js';
import notificationService from './services/notificationService.js';
import conversationStateMachine from './services/conversationStateMachine.js';
const db = dbService;

// ============================================================================
// Configuration
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// WhatsApp Cloud API config
const WHATSAPP_TOKEN = process.env.WHATSAPP_CLOUD_API_TOKEN || '';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'peys-webhook-token';
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

// ============================================================================
// State Management
// ============================================================================

let isConnected = false;
let lastSuccessfulOperation = Date.now();
const userSessions = new Map();

// ============================================================================
// Initialize Services
// ============================================================================

async function initializeServices() {
  console.log('⏳ Initializing services...');
  
  try {
    await escrowService.initialize();
  } catch (error) {
    console.log('⚠️ Escrow service init warning (will retry on demand):', error.message);
  }
  
  try {
    const dbHealth = await db.checkDatabaseHealth();
    console.log('📊 Database: ' + dbHealth.status + ' - ' + dbHealth.message);
  } catch (error) {
    console.log('⚠️ Database health check warning:', error.message);
  }
  
  console.log('✅ Services initialized\n');
}

// ============================================================================
// WhatsApp Cloud API Helper
// ============================================================================

async function sendWhatsAppMessage(to, text) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.log('📤 [DRY RUN] Would send to +' + to + ': ' + text.substring(0, 60));
    return true;
  }

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ WhatsApp API error:', data.error);
      return false;
    }

    console.log('📤 SENT → +' + to);
    console.log('   ' + text.substring(0, 60) + (text.length > 60 ? '...' : ''));
    
    lastSuccessfulOperation = Date.now();
    return true;
  } catch (error) {
    console.error('❌ Failed to send message:', error.message);
    return false;
  }
}

async function sendWhatsAppButtons(to, text, buttons) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.log('📤 [DRY RUN] Would send buttons to +' + to + ': ' + text.substring(0, 60));
    return true;
  }

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: text },
          action: {
            buttons: buttons.map((btn, i) => ({
              type: 'reply',
              reply: { id: `btn_${i}`, title: btn.body.substring(0, 20) }
            }))
          }
        }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ WhatsApp API error:', data.error);
      return false;
    }

    console.log('📤 SENT (Buttons) → +' + to);
    lastSuccessfulOperation = Date.now();
    return true;
  } catch (error) {
    console.error('❌ Failed to send buttons:', error.message);
    return false;
  }
}

// ============================================================================
// Message Handler (reused from v2)
// ============================================================================

async function handleMessage(from, text) {
  const chatId = from;
  const lowerText = text.toLowerCase().trim();

  // Show typing indicator (not available in Cloud API, skip)

  // Check conversation state machine
  const stateResult = conversationStateMachine.handleMessage(chatId, text, {
    onCancel: async () => {
      await sendWhatsAppMessage(chatId, '❌ *Action cancelled*\n\n_Send "menu" for available commands_');
    },
    onConfirm: async (data) => {
      await sendWhatsAppMessage(chatId, '⏳ Processing your confirmation...');
    },
    onPin: async (data) => {
      await sendWhatsAppMessage(chatId, '⏳ Verifying PIN...');
    },
    onClaimCode: async (data) => {
      await processClaimWithCode(chatId, from, data.claimCode);
    }
  });

  if (stateResult !== null) {
    if (stateResult.error) {
      await sendWhatsAppMessage(chatId, stateResult.error);
    }
    return;
  }

  // Handle button responses
  const buttonResponse = handleButtonResponse(lowerText, chatId, from);
  if (buttonResponse) {
    return;
  }

  // Get user session
  let session = userSessions.get(chatId);
  
  // Check registration
  const isRegistered = await db.isUserRegistered(chatId);
  
  // ========================================================================
  // Public Commands (no registration required)
  // ========================================================================

  if (['menu', 'start', 'help', 'hello', 'hi', 'hey'].includes(lowerText)) {
    await sendMainMenu(chatId, isRegistered);
    await db.logCommand(null, from, 'menu', null, 'success');
    return;
  }

  if (lowerText === 'register' || lowerText === 'sign up') {
    if (isRegistered) {
      const profile = await db.getProfileByWhatsappId(chatId);
      const walletTrunc = profile?.wallet_address 
        ? `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`
        : 'Not set';
      
      await sendWhatsAppMessage(chatId,
        '✅ *Already Registered*\n\n' +
        `Wallet: \`${walletTrunc}\`\n` +
        `Email: ${profile?.email || 'Not linked'}\n\n` +
        'Send *menu* to see available commands.'
      );
      await db.logCommand(null, from, 'register_already', null, 'success');
      return;
    }

    const welcomeMsg = 
      '👋 *Welcome to Peys!*\n\n' +
      'Peys is a stablecoin wallet that works right here in WhatsApp.\n\n' +
      '✨ *What you can do:*\n' +
      '• Send & receive USDC/USDT\n' +
      '• Pay anyone by email or wallet\n' +
      '• Check your balance anytime\n' +
      '• No apps to download\n\n' +
      'Let\'s create your account...';
    
    await sendWhatsAppMessage(chatId, welcomeMsg);
    await new Promise(r => setTimeout(r, 1000));

    const appUrl = process.env.APP_URL || 'https://bot-frontend-inky.vercel.app';
    const registerUrl = `${appUrl}/register/whatsapp?wa=${from}`;
    await sendWhatsAppMessage(chatId,
      '🔐 *Create Your Account*\n\n' +
      `Tap the link below to register:\n${registerUrl}\n\n` +
      '📋 *Steps:*\n' +
      '1. Tap the link above\n' +
      '2. Sign in with phone or email\n' +
      '3. Your wallet is created automatically\n' +
      '4. Come back here and send *menu*\n\n' +
      '_It takes less than 30 seconds!_'
    );
    return;
  }

  // ========================================================================
  // Authenticated Commands (registration required)
  // ========================================================================

  if (!isRegistered) {
    await sendWhatsAppMessage(chatId,
      '⚠️ *Not Registered*\n\n' +
      'Please register first:\n' +
      'Send "register" to get started.'
    );
    return;
  }

  const profile = await db.getProfileByWhatsappId(chatId);
  const wallet = profile?.primary_wallet_address || profile?.wallet_address;

  // Balance
  if (['balance', 'bal', 'wallet'].includes(lowerText)) {
    await handleBalance(chatId, from, wallet);
    return;
  }

  // History
  if (['history', 'transactions', 'tx'].includes(lowerText)) {
    await handleHistory(chatId, from);
    return;
  }

  // Transaction Details
  if (lowerText.startsWith('details ') || lowerText.startsWith('detail ')) {
    const txIndex = parseInt(text.split(' ')[1]) - 1;
    if (!isNaN(txIndex)) {
      await handleTransactionDetails(chatId, from, txIndex);
    } else {
      await sendWhatsAppMessage(chatId, '❌ *Invalid command*\n\nUsage: `details 1` (where 1 is the transaction number)');
    }
    return;
  }

  // Send/Pay
  if (lowerText.startsWith('send ') || lowerText.startsWith('pay ')) {
    await handleSend(chatId, from, text, wallet);
    return;
  }

  // Claim
  if (lowerText === 'claim' || lowerText.startsWith('claim ')) {
    await handleClaim(chatId, from);
    return;
  }

  // Confirm pending transaction
  if (lowerText === 'confirm' && session?.pendingTransaction) {
    await confirmTransaction(chatId, from, session);
    return;
  }

  // Cancel
  if (lowerText === 'cancel') {
    if (session?.pendingTransaction) {
      userSessions.delete(chatId);
      await sendWhatsAppMessage(chatId, '❌ Transaction cancelled.');
    } else {
      conversationStateMachine.cancel(chatId);
      await sendWhatsAppMessage(chatId, '❌ Action cancelled.\n\n_Send "menu" for available commands_');
    }
    return;
  }

  // Session info
  if (lowerText === 'session' || lowerText === 'state' || lowerText === 'status') {
    const stateInfo = conversationStateMachine.getSessionInfo(chatId);
    if (stateInfo) {
      await sendWhatsAppMessage(chatId,
        `📊 *Session Status*\n\n` +
        `State: ${stateInfo.state}\n` +
        `Duration: ${Math.floor(stateInfo.duration / 1000)}s\n` +
        `Data: ${JSON.stringify(stateInfo.data).slice(0, 100)}`
      );
    } else {
      await sendWhatsAppMessage(chatId, '📊 No active session');
    }
    return;
  }

  // FAQ
  if (['faq', '?'].includes(lowerText)) {
    await sendFAQ(chatId);
    await db.logCommand(null, from, 'faq', null, 'success');
    return;
  }

  // Profile
  if (lowerText === 'profile' || lowerText === 'me' || lowerText === 'account') {
    await handleProfile(chatId, from);
    await db.logCommand(null, from, 'profile', null, 'success');
    return;
  }

  // Support
  if (lowerText === 'support' || lowerText === 'helpme' || lowerText === 'contact') {
    await handleSupport(chatId, from);
    await db.logCommand(null, from, 'support', null, 'success');
    return;
  }

  // Status check for transactions
  if (lowerText.startsWith('status ') || lowerText.startsWith('tx ')) {
    const txId = lowerText.split(' ')[1];
    if (txId) {
      await handleStatus(chatId, from, txId);
      await db.logCommand(null, from, 'status', { txId }, 'success');
    } else {
      await sendWhatsAppMessage(chatId, '❓ *Please provide a transaction ID*\n\nExample: `status abc123`');
    }
    return;
  }

  // Unknown command
  await sendWhatsAppMessage(chatId,
    '❓ *Unknown Command*\n\n' +
    'Send "menu" to see available commands.'
  );
}

// ============================================================================
// Command Handlers (same logic as v2)
// ============================================================================

async function handleButtonResponse(text, chatId, phone) {
  const isRegistered = await db.isUserRegistered(chatId);
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('check balance') || lowerText === 'balance') {
    const profile = await db.getProfileByWhatsappId(chatId);
    const wallet = profile?.primary_wallet_address || profile?.wallet_address;
    await handleBalance(chatId, phone, wallet);
    return true;
  }
  
  if (lowerText.includes('send payment') || lowerText === 'send') {
    await sendWhatsAppMessage(chatId,
      '📤 *Send Payment*\n\n' +
      'Send payments by email or wallet address:\n\n' +
      '• `send 10 USDC to email@example.com` (escrow)\n' +
      '• `send 10 USDC to 0xABC...` (direct)\n\n' +
      '_Example: send 10 USDC to john@email.com_'
    );
    return true;
  }
  
  if (lowerText.includes('transaction history') || lowerText === 'history') {
    await handleHistory(chatId, phone);
    return true;
  }
  
  if (lowerText.includes('claim pending') || lowerText === 'claim') {
    await handleClaim(chatId, phone);
    return true;
  }
  
  if (lowerText.includes('help') || lowerText.includes('faq') || lowerText === '?') {
    await sendFAQ(chatId);
    return true;
  }
  
  if (lowerText.includes('register now') || lowerText === 'register') {
    if (isRegistered) {
      const profile = await db.getProfileByWhatsappId(chatId);
      const walletTrunc = profile?.wallet_address 
        ? `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`
        : 'Not set';
      await sendWhatsAppMessage(chatId,
        '✅ *Already Registered*\n\n' +
        `Wallet: \`${walletTrunc}\`\n` +
        `Email: ${profile?.email || 'Not linked'}\n\n` +
        'Send *menu* to see available commands.'
      );
      return true;
    }
    const appUrl = process.env.APP_URL || 'https://bot-frontend-inky.vercel.app';
    const registerUrl = `${appUrl}/register/whatsapp?wa=${phone}`;
    await sendWhatsAppMessage(chatId,
      '🔐 *Create Your Account*\n\n' +
      `Tap here to register: ${registerUrl}\n\n` +
      '📋 *Steps:*\n' +
      '1. Tap the link above\n' +
      '2. Sign in with phone or email\n' +
      '3. Your wallet is created automatically\n' +
      '4. Come back here and send *menu*\n\n' +
      '_It takes less than 30 seconds!_'
    );
    return true;
  }
  
  if (lowerText.includes('what is peys')) {
    await sendWhatsAppMessage(chatId,
      '💡 *What is Peys?*\n\n' +
      'Peys is a stablecoin wallet that works right here in WhatsApp.\n\n' +
      '✨ *Features:*\n' +
      '• Send & receive USDC/USDT\n' +
      '• Pay anyone by email or wallet\n' +
      '• Check your balance anytime\n' +
      '• No apps to download\n\n' +
      '🔐 *Security:*\n' +
      '• Non-custodial wallet\n' +
      '• Your keys, your crypto\n' +
      '• Secure with your phone\n\n' +
      'Send *register* to get started!'
    );
    return true;
  }
  
  return false;
}

async function sendMainMenu(chatId, isRegistered) {
  if (isRegistered) {
    const buttons = [
      { body: '💰 Check Balance' },
      { body: '📤 Send Payment' },
      { body: '📜 History' },
      { body: '🎁 Claim Pending' },
      { body: '❓ Help/FAQ' }
    ];
    await sendWhatsAppButtons(
      chatId,
      '🤖 *Peys WhatsApp Bot*\n\nSelect an action:',
      buttons
    );
  } else {
    const buttons = [
      { body: '🔐 Register Now' },
      { body: '❓ What is Peys?' }
    ];
    await sendWhatsAppButtons(
      chatId,
      '👋 *Welcome to Peys!*\n\nPeys is a stablecoin wallet that works right here in WhatsApp.\n\nTap a button to get started:',
      buttons
    );
  }
}

async function handleBalance(chatId, phone, wallet) {
  if (!wallet) {
    await sendWhatsAppMessage(chatId, '❌ No wallet found. Please register again.');
    return;
  }

  const profile = await db.getProfileByWhatsappId(chatId);
  const usdcBalance = await escrowService.getUSDCBalance(wallet);
  const usdtBalance = await escrowService.getUSDTBalance(wallet);
  const network = profile?.network || 'base_sepolia';
  const networkName = network === 'base_sepolia' ? 'Base Sepolia' : 
                     network === 'celo' ? 'Celo' : 
                     network === 'polkadot' ? 'Polkadot' : network;

  const walletTrunc = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

  await sendWhatsAppMessage(chatId,
    `💰 *Your Wallet*\n\n` +
    `Wallet: \`${walletTrunc}\`\n` +
    `Network: ${networkName}\n\n` +
    `*Balances:*\n` +
    `• USDC: ${usdcBalance} ($${usdcBalance})\n` +
    `• USDT: ${usdtBalance} ($${usdtBalance})\n\n` +
    `*Total:* $${parseFloat(usdcBalance) + parseFloat(usdtBalance)}\n\n` +
    `_Send "send [amount] [TOKEN] to [recipient]"_`
  );

  await db.logCommand(null, phone, 'balance', { 
    wallet: walletTrunc, 
    usdc: usdcBalance, 
    usdt: usdtBalance,
    network 
  }, 'success');
}

async function handleHistory(chatId, phone) {
  const transactions = await escrowService.getUserPayments(chatId);
  
  if (transactions.length === 0) {
    await sendWhatsAppMessage(chatId,
      '📋 *Transaction History*\n\n' +
      '_No transactions yet_\n\n' +
      'Send your first payment:\n' +
      '`send 10 USDC to friend@email.com`'
    );
  } else {
    let msg = '📋 *Your Transactions*\n\n';
    
    transactions.slice(0, 10).forEach((tx, i) => {
      const status = tx.status === 'pending' ? '⏳' : tx.status === 'claimed' ? '✅' : tx.status === 'refunded' ? '🔄' : '❓';
      const amount = tx.amount || tx.amount_usd;
      const token = tx.token || 'USDC';
      const direction = tx.is_sender ? '→' : '←';
      const otherParty = tx.recipient_email || tx.sender_email || 'Unknown';
      const date = tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Unknown date';
      
      msg += `${i + 1}. ${status} ${amount} ${token} ${direction} ${otherParty}\n`;
      msg += `   📅 ${date} | ID: ${tx.payment_id?.slice(0, 8) || 'N/A'}\n\n`;
    });
    
    msg += '_Reply "details [number]" for full transaction info_';
    await sendWhatsAppMessage(chatId, msg);
  }
  
  await db.logCommand(null, phone, 'history', { count: transactions.length }, 'success');
}

async function handleTransactionDetails(chatId, phone, txIndex) {
  const transactions = await escrowService.getUserPayments(chatId);
  const tx = transactions[txIndex];
  
  if (!tx) {
    await sendWhatsAppMessage(chatId, '❌ *Transaction not found*\n\nPlease check the number and try again.');
    return;
  }
  
  const status = tx.status === 'pending' ? '⏳ Pending' : tx.status === 'claimed' ? '✅ Claimed' : tx.status === 'refunded' ? '🔄 Refunded' : '❓ Unknown';
  const direction = tx.is_sender ? 'Sent' : 'Received';
  const otherParty = tx.is_sender ? tx.recipient_email : tx.sender_email;
  const amount = tx.amount || tx.amount_usd;
  const token = tx.token || 'USDC';
  const createdDate = tx.created_at ? new Date(tx.created_at).toLocaleString() : 'Unknown';
  const expiryDate = tx.expiry ? new Date(tx.expiry).toLocaleString() : 'N/A';
  
  const message = 
`📋 *Transaction Details #${txIndex + 1}*

*Status:* ${status}
*Type:* ${direction}
*Amount:* ${amount} ${token}

*${direction === 'Sent' ? 'To' : 'From'}:* ${otherParty || 'Unknown'}

*Created:* ${createdDate}
*Expires:* ${expiryDate}

*Payment ID:* \`${tx.payment_id || 'N/A'}\`
*Claim Code:* \`${tx.claim_code || 'N/A'}\`

${tx.tx_hash ? `*Tx Hash:* \`${tx.tx_hash.slice(0, 10)}...${tx.tx_hash.slice(-4)}\`` : ''}`;

  await sendWhatsAppMessage(chatId, message);
  await db.logCommand(null, phone, 'details', { txIndex }, 'success');
}

async function handleSend(chatId, phone, text, wallet) {
  const parts = text.split(' ');
  const amount = parts[1];
  const token = parts[2]?.toUpperCase();
  const toIndex = parts.findIndex(p => p.toLowerCase() === 'to');

  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    await sendWhatsAppMessage(chatId,
      '❌ *Invalid Amount*\n\n' +
      'Examples:\n' +
      '• `send 50 USDC to alice@email.com`\n' +
      '• `send 50 USDC to 0x1234...abcd`\n' +
      '• `send 50 USDC to @timothy`\n' +
      '• `send 50 USDC to +2348123456789`'
    );
    return;
  }

  let recipient = '';
  if (toIndex !== -1 && toIndex < parts.length - 1) {
    recipient = parts.slice(toIndex + 1).join(' ').trim();
  }

  if (!recipient) {
    await sendWhatsAppMessage(chatId,
      '❌ *Missing Recipient*\n\n' +
      'Example: `send 50 USDC to alice@email.com`\n' +
      'Or: `send 50 USDC to 0x1234...abcd`'
    );
    return;
  }

  const validTokens = ['USDC', 'USDT'];
  if (!token || !validTokens.includes(token)) {
    await sendWhatsAppMessage(chatId, '❌ *Invalid Token*\n\nSupported: USDC, USDT');
    return;
  }

  let resolvedRecipient = recipient;
  let recipientWallet = null;
  let recipientName = null;
  let transferType = 'escrow';

  if (recipient.startsWith('@')) {
    const username = recipient.slice(1);
    await sendWhatsAppMessage(chatId, '🔍 Looking up @' + username + '...');
    
    const lookupUser = await db.lookupUserByUsername(username);
    if (lookupUser) {
      recipientWallet = lookupUser.primary_wallet_address || lookupUser.wallet_address;
      recipientName = lookupUser.username || username;
      
      if (recipientWallet) {
        resolvedRecipient = recipientWallet;
        transferType = 'direct';
      } else {
        await sendWhatsAppMessage(chatId,
          '❌ *User Found But No Wallet*\n\n' +
          `@${username} is registered but has no wallet yet.\n` +
          'Ask them to complete registration first.'
        );
        return;
      }
    } else {
      await sendWhatsAppMessage(chatId,
        '❌ *User Not Found*\n\n' +
        `No Peys user found with username @${username}.`
      );
      return;
    }
  } else if (recipient.startsWith('+') || /^\d{10,15}$/.test(recipient)) {
    await sendWhatsAppMessage(chatId, '🔍 Looking up phone number...');
    
    const lookupUser = await db.lookupUserByPhone(recipient);
    if (lookupUser) {
      recipientWallet = lookupUser.primary_wallet_address || lookupUser.wallet_address;
      recipientName = lookupUser.phone || recipient;
      
      if (recipientWallet) {
        resolvedRecipient = recipientWallet;
        transferType = 'direct';
      } else {
        await sendWhatsAppMessage(chatId,
          '❌ *User Found But No Wallet*\n\n' +
          'This phone number is registered but has no wallet yet.'
        );
        return;
      }
    }
  } else if (/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
    resolvedRecipient = recipient;
    transferType = 'direct';
  }

  userSessions.set(chatId, {
    pendingTransaction: {
      amount: parseFloat(amount),
      token,
      recipient: resolvedRecipient,
      originalRecipient: recipient,
      recipientName,
      wallet,
      transferType,
      timestamp: Date.now()
    }
  });

  const fee = '0.0005';
  const total = parseFloat(amount) + parseFloat(fee);

  const recipientTrunc = resolvedRecipient.length > 10 
    ? `${resolvedRecipient.slice(0, 6)}...${resolvedRecipient.slice(-4)}`
    : resolvedRecipient;

  const buttons = [
    { body: '✅ Confirm' },
    { body: '❌ Cancel' }
  ];

  if (transferType === 'direct') {
    await sendWhatsAppButtons(
      chatId,
      `📤 *Confirm Direct Transfer*\n\n` +
      `Amount: ${amount} ${token}\n` +
      `To: \`${recipientTrunc}\`\n` +
      `Type: Direct Transfer (instant)\n` +
      `Network Fee: ~${fee} ETH\n\n` +
      `Tap a button to confirm or cancel:`,
      buttons
    );
  } else {
    await sendWhatsAppButtons(
      chatId,
      `📤 *Confirm Escrow Payment*\n\n` +
      `Amount: ${amount} ${token}\n` +
      `To: ${resolvedRecipient}\n` +
      `Type: Escrow (recipient must claim)\n` +
      `Network Fee: ~${fee} ETH\n\n` +
      `Tap a button to confirm or cancel:`,
      buttons
    );
  }
  
  await db.logCommand(null, phone, 'send_prepare', { amount, token, recipient, transferType }, 'success');
}

async function confirmTransaction(chatId, phone, session) {
  const { amount, token, recipient, wallet, transferType } = session.pendingTransaction;
  
  userSessions.delete(chatId);

  if (transferType === 'direct') {
    await sendWhatsAppMessage(chatId, '⏳ *Processing Direct Transfer...*\n\nSending to blockchain...');

    const result = await blockchainService.directTransfer({
      fromWallet: wallet,
      toAddress: recipient,
      amount: amount.toString(),
      token,
      network: 'base_sepolia'
    });

    if (result.success) {
      const recipientTrunc = `${recipient.slice(0, 6)}...${recipient.slice(-4)}`;
      
      await db.createTransaction({
        type: 'direct_transfer',
        amount: amount.toString(),
        amountUsd: amount,
        token,
        senderWallet: wallet,
        recipientAddress: recipient,
        txHash: result.txHash,
        status: 'confirmed',
        metadata: { sender_whatsapp_id: chatId, transfer_type: 'direct' }
      });

      await sendWhatsAppMessage(chatId,
        `✅ *Direct Transfer Complete!*\n\n` +
        `Amount: ${amount} ${token}\n` +
        `To: \`${recipientTrunc}\`\n` +
        `Tx Hash: \`${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}\`\n\n` +
        `_The funds have been sent directly._`
      );
      
      await db.logCommand(null, phone, 'send_direct', { amount, token, recipient, txHash: result.txHash }, 'success');
    } else {
      await sendWhatsAppMessage(chatId,
        '❌ *Transfer Failed*\n\n' +
        `${result.error || 'Please try again later.'}\n\n` +
        '_Your funds are safe. No transaction was made._'
      );
      
      await db.logCommand(null, phone, 'send_failed', { amount, token, recipient }, 'failed', result.error);
    }
  } else {
    const result = await escrowService.createPayment({
      senderWhatsappId: chatId,
      senderWallet: wallet,
      recipientEmail: recipient,
      amount: amount.toString(),
      token
    });

    if (result.success) {
      await db.createTransaction({
        type: 'escrow_create',
        amount: amount.toString(),
        amountUsd: amount,
        token,
        senderWallet: wallet,
        recipientEmail: recipient,
        escrowId: result.paymentId,
        status: 'confirmed',
        metadata: { sender_whatsapp_id: chatId, claim_code: result.claimCode }
      });

      await sendWhatsAppMessage(chatId,
        `✅ *Escrow Payment Created!*\n\n` +
        `Amount: ${amount} ${token}\n` +
        `To: ${recipient}\n\n` +
        `Claim Code: \`${result.claimCode}\`\n` +
        `Claim Link: ${result.claimLink}\n\n` +
        `_Share the claim code with the recipient_`
      );
      
      await db.logCommand(null, phone, 'send_escrow', { amount, token, recipient, paymentId: result.paymentId }, 'success');
    } else {
      await sendWhatsAppMessage(chatId,
        '❌ *Payment Failed*\n\n' +
        `${result.error || 'Please try again later.'}`
      );
      
      await db.logCommand(null, phone, 'send_failed', { amount, token, recipient }, 'failed', result.error);
    }
  }
}

async function handleClaim(chatId, phone) {
  const claims = await escrowService.getPendingClaims(chatId);
  
  if (claims.length === 0) {
    await sendWhatsAppMessage(chatId,
      '🎁 *Pending Claims*\n\n' +
      '_No pending payments_\n\n' +
      'When someone sends you a payment, you\'ll see it here.'
    );
  } else {
    let msg = '🎁 *Pending Claims*\n\n';
    claims.forEach((claim, i) => {
      msg += `${i + 1}. ${claim.amount} ${claim.token}\n`;
      msg += `   Code: \`${claim.claimCode}\`\n`;
      msg += `   Expires: ${new Date(claim.expiry).toLocaleDateString()}\n\n`;
    });
    msg += '_Reply with claim code to claim_';
    
    conversationStateMachine.startClaimCodeEntry(chatId, { claims });
    
    await sendWhatsAppMessage(chatId, msg);
  }
  
  await db.logCommand(null, phone, 'claim', { count: claims.length }, 'success');
}

async function processClaimWithCode(chatId, phone, claimCode) {
  await sendWhatsAppMessage(chatId, `⏳ Claiming payment with code ${claimCode}...`);
  await db.logCommand(null, phone, 'claim_code', { claimCode }, 'success');
}

async function sendFAQ(chatId) {
  const faqMsg = 
    '❓ *Frequently Asked Questions*\n\n' +
    '*Getting Started*\n' +
    '• How do I register? Send "register"\n' +
    '• How do I check balance? Send "balance"\n' +
    '• How do I send money? Send "send 10 USDC to email@domain.com"\n\n' +
    '*Payments & Transfers*\n' +
    '• What is the difference between escrow and direct?\n' +
    '  Escrow: For emails (recipient claims)\n' +
    '  Direct: For wallet addresses (instant)\n' +
    '• Are there fees? Network fees only (~$0.01)\n' +
    '• How long do transfers take? Direct: Instant, Escrow: Upon claim\n\n' +
    '*Security*\n' +
    '• Is my wallet secure? Yes, non-custodial\n' +
    '• What if I lose access? Use your Privy login\n' +
    '• Are transactions private? Yes, peer-to-peer\n\n' +
    '*Limits*\n' +
    '• Minimum send: 0.01 USDC\n' +
    '• Maximum send: No limit\n' +
    '• Daily limit: None\n\n' +
    'Still need help? Send "support"';
  
  await sendWhatsAppMessage(chatId, faqMsg);
}

async function handleProfile(chatId, phone) {
  const profile = await db.getProfileByWhatsappId(chatId);
  
  if (!profile) {
    await sendWhatsAppMessage(chatId,
      '❌ *Profile Not Found*\n\n' +
      'You are not registered. Send "register" to create your account.'
    );
    return;
  }
  
  const walletTrunc = profile?.wallet_address 
    ? `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`
    : 'Not set';
    
  const profileMsg = 
    '👤 *Your Profile*\n\n' +
    `📱 WhatsApp: +${profile.whatsapp_id || 'Not linked'}\n` +
    `📧 Email: ${profile.email || 'Not linked'}\n` +
    `📞 Phone: ${profile.phone_number || 'Not linked'}\n` +
    `💳 Wallet: \`${walletTrunc}\`\n` +
    `🆔 User ID: ${profile.id || 'Not set'}\n\n` +
    '_To update your username, contact support._';
    
  await sendWhatsAppMessage(chatId, profileMsg);
}

async function handleSupport(chatId, phone) {
  const supportMsg = 
    '📞 *Peys Support*\n\n' +
    'We are here to help! Please describe your issue:\n\n' +
    '1. *Transaction problems*\n' +
    '   - Payment not arriving\n' +
    '   - Claim issues\n' +
    '   - Wrong amount sent\n\n' +
    '2. *Account issues*\n' +
    '   - Cannot access wallet\n' +
    '   - Registration problems\n' +
    '   - Phone/email not linked\n\n' +
    '3. *General questions*\n' +
    '   - How Peys works\n' +
    '   - Fees and limits\n' +
    '   - Future features\n\n' +
    '_Reply with your issue and we will get back to you soon._';
    
  await sendWhatsAppMessage(chatId, supportMsg);
}

async function handleStatus(chatId, phone, txId) {
  if (!txId || txId.length < 10) {
    await sendWhatsAppMessage(chatId,
      '❌ *Invalid Transaction ID*\n\n' +
      'Please provide a valid transaction ID.\n' +
      'Example: `status abc123def456`'
    );
    return;
  }
  
  await sendWhatsAppMessage(chatId,
    '🔍 *Transaction Status*\n\n' +
    `Transaction ID: \`${txId}\`\n` +
    'Status: Checking...\n\n' +
    '_This feature is coming soon. For now, please check your wallet balance or contact support._'
  );
}

// ============================================================================
// Webhook Routes (WhatsApp Cloud API)
// ============================================================================

// Webhook verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed. Token mismatch.');
    res.sendStatus(403);
  }
});

// Webhook handler (POST)
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    const entries = body.entry || [];
    
    for (const entry of entries) {
      const changes = entry.changes || [];
      
      for (const change of changes) {
        const value = change.value;
        const messages = value.messages || [];
        const statuses = value.statuses || [];

        // Handle incoming messages
        for (const message of messages) {
          const from = message.from;
          const text = message.text?.body || '';
          const type = message.type;

          console.log('\n' + '─'.repeat(50));
          console.log('📩 INCOMING MESSAGE');
          console.log('─'.repeat(50));
          console.log('  From: +' + from);
          console.log('  Time: ' + new Date().toLocaleTimeString());
          console.log('  Type: ' + type);
          console.log('  Message: ' + (text.substring(0, 60) || '[media]'));
          console.log('─'.repeat(50));

          // Handle button reply
          if (type === 'interactive' && message.interactive?.type === 'button_reply') {
            const buttonTitle = message.interactive.button_reply.title;
            await handleMessage(from, buttonTitle);
          } else if (type === 'text') {
            await handleMessage(from, text);
          } else {
            await sendWhatsAppMessage(from, '📎 I received a ' + type + ' message. For now, I only support text messages.');
          }

          lastSuccessfulOperation = Date.now();
        }

        // Handle message statuses
        for (const status of statuses) {
          const statusText = status.status;
          const messageId = status.id;
          
          if (statusText === 'delivered' || statusText === 'read') {
            console.log(`📬 Message ${messageId} ${statusText}`);
          } else if (statusText === 'failed') {
            console.error(`❌ Message ${messageId} failed: ${JSON.stringify(status.errors)}`);
          }
        }
      }
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// ============================================================================
// API Routes
// ============================================================================

// Health check
app.get('/health', async (req, res) => {
  const escrowHealth = await escrowService.healthCheck();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    whatsapp: {
      connected: isConnected,
      framework: 'WhatsApp Cloud API (Meta)',
      phoneId: WHATSAPP_PHONE_ID ? 'configured' : 'not configured',
      lastSuccessfulOperation: new Date(lastSuccessfulOperation).toISOString(),
      timeSinceLastSuccess: Math.round((Date.now() - lastSuccessfulOperation) / 1000) + 's'
    },
    services: escrowHealth
  });
});

// QR Code page (for setup instructions)
app.get('/qr', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Peys WhatsApp Bot - Cloud API Setup</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; background: #f8f9fa; color: #333; }
        .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #6C63FF; margin-top: 0; }
        h2 { color: #333; margin-top: 24px; }
        code { background: #f1f3f4; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
        pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; }
        .step { display: flex; gap: 12px; margin: 16px 0; }
        .step-num { background: #6C63FF; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }
        .status { padding: 12px 16px; border-radius: 8px; margin: 16px 0; }
        .status.ok { background: #d4edda; color: #155724; }
        .status.warn { background: #fff3cd; color: #856404; }
        a { color: #6C63FF; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>📱 Peys WhatsApp Bot</h1>
        <p>Using <strong>WhatsApp Cloud API</strong> (official Meta API)</p>
        
        <div class="status ${WHATSAPP_PHONE_ID ? 'ok' : 'warn'}">
          ${WHATSAPP_PHONE_ID ? '✅ Phone Number ID is configured' : '⚠️ Phone Number ID not configured'}
        </div>
        
        <h2>Setup Instructions</h2>
        
        <div class="step">
          <div class="step-num">1</div>
          <div>Go to <a href="https://developers.facebook.com/" target="_blank">Meta for Developers</a> and create a WhatsApp Business App</div>
        </div>
        
        <div class="step">
          <div class="step-num">2</div>
          <div>Get your <strong>Phone Number ID</strong> and <strong>Access Token</strong> from the app dashboard</div>
        </div>
        
        <div class="step">
          <div class="step-num">3</div>
          <div>Add these to your <code>.env</code> file:</div>
        </div>
        
        <pre>WHATSAPP_CLOUD_API_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=peys-webhook-token</pre>
        
        <div class="step">
          <div class="step-num">4</div>
          <div>In Meta Developer Console, configure the webhook URL to:</div>
        </div>
        
        <pre>${process.env.APP_URL || 'https://your-domain.com'}/webhook</pre>
        
        <div class="step">
          <div class="step-num">5</div>
          <div>Set the Verify Token to: <code>peys-webhook-token</code></div>
        </div>
        
        <div class="step">
          <div class="step-num">6</div>
          <div>Subscribe to messages and restart the server</div>
        </div>
        
        <h2>API Endpoints</h2>
        <ul>
          <li><code>GET /health</code> - Health check</li>
          <li><code>GET /webhook</code> - Webhook verification</li>
          <li><code>POST /webhook</code> - Webhook handler</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// ============================================================================
// Start Server
// ============================================================================

async function start() {
  console.log('\n' + '═'.repeat(60));
  console.log('  🤖 Peys WhatsApp Bot v3.0');
  console.log('  Framework: WhatsApp Cloud API (Meta)');
  console.log('═'.repeat(60) + '\n');

  await initializeServices();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 WhatsApp: Cloud API (no browser needed)`);
    console.log(`🔗 Webhook URL: ${process.env.APP_URL || 'https://your-domain.com'}/webhook`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`📱 Setup: http://localhost:${PORT}/qr`);
    console.log('\n' + '═'.repeat(60) + '\n');
  });
}

start().catch(console.error);
