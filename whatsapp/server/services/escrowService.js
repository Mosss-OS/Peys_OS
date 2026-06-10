/**
 * Escrow Service
 * 
 * Handles escrow payment creation, claiming, and refunds
 * Integrates with blockchain and database services
 */

import blockchainService from './blockchainService.js';
import * as db from './databaseService.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_NETWORK = 'base_sepolia';
const ESCROW_EXPIRY_DAYS = 7;
const APP_URL = process.env.APP_URL || 'https://peydot.vercel.app';

// ============================================================================
// Escrow Service
// ============================================================================

class EscrowService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the escrow service
   */
  async initialize() {
    try {
      await blockchainService.initialize();
      this.initialized = true;
      console.log('[EscrowService] Initialized');
    } catch (error) {
      console.warn('[EscrowService] Initialization warning:', error.message);
      this.initialized = true; // Mark as initialized anyway, will retry on demand
    }
  }

  // ========================================================================
  // Create Payment
  // ========================================================================

  /**
   * Create a new escrow payment
   * 
   * @param {Object} params - Payment parameters
   * @param {string} params.senderWhatsappId - Sender's WhatsApp ID
   * @param {string} params.recipientEmail - Recipient's email
   * @param {string} params.recipientPhone - Recipient's phone (optional)
   * @param {string} params.amount - Amount in USDC
   * @param {string} params.token - Token type (USDC, USDT, PASS)
   * @param {string} params.memo - Optional memo
   * @param {number} params.chainId - Chain ID (default: Base Sepolia)
   * @returns {Object} Payment details including claim link
   */
  async createPayment(params) {
    const {
      senderWhatsappId,
      senderWallet,
      recipientEmail,
      recipientPhone,
      amount,
      token = 'USDC',
      memo,
      chainId = 84532
    } = params;

    try {
      // Get sender profile
      const senderProfile = await db.getProfileByWhatsappId(senderWhatsappId);
      if (!senderProfile) {
        throw new Error('Sender not registered');
      }

      // Generate payment ID and secret
      const paymentId = blockchainService.generatePaymentId();
      const { secret, hash: secretHash } = blockchainService.generateSecret();
      
      // Generate claim code (user-friendly)
      const claimCode = this.generateClaimCode();
      
      // Calculate expiry
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + ESCROW_EXPIRY_DAYS);

      // Determine network
      const network = this.getNetworkByChainId(chainId);
      
      // Try to create on-chain escrow (if blockchain is available)
      let txHash = null;
      try {
        // Note: Creating escrow requires a signer/private key
        // For WhatsApp bot, we use Supabase Edge Functions for on-chain operations
        console.log(`[EscrowService] Creating escrow for payment ${paymentId}`);
        // txHash = await blockchainService.createEscrowOnChain(...);
      } catch (error) {
        console.warn('[EscrowService] On-chain creation skipped:', error.message);
      }

      // Store in database
      const escrowPayment = await db.createEscrowPayment({
        paymentId,
        secretHash,
        senderId: senderProfile.user_id,
        senderProfileId: senderProfile.id,
        senderWallet: senderWallet || senderProfile.primary_wallet_address,
        recipientPhone: recipientPhone || recipientEmail,
        claimCode,
        amount: blockchainService.formatAmount(amount),
        amountUsd: parseFloat(amount),
        token,
        expiry: expiry.toISOString(),
        txHash,
        memo
      });

      if (!escrowPayment) {
        throw new Error('Failed to create payment record');
      }

      // Log the command
      await db.logCommand(
        senderProfile.user_id,
        senderWhatsappId,
        'create_payment',
        { amount, token, recipientEmail },
        JSON.stringify({ paymentId, claimCode }),
        'success'
      );

      // Generate claim link
      const claimLink = `${APP_URL}/claim/${paymentId}?code=${claimCode}`;

      return {
        success: true,
        paymentId,
        claimCode,
        claimLink,
        amount,
        token,
        expiry: expiry.toISOString(),
        secret // Only returned once, for the sender to share
      };

    } catch (error) {
      console.error('[EscrowService] Error creating payment:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========================================================================
  // Claim Payment
  // ========================================================================

  /**
   * Claim an escrow payment
   * 
   * @param {Object} params - Claim parameters
   * @param {string} params.paymentId - Payment ID
   * @param {string} params.claimCode - Claim code
   * @param {string} params.recipientWhatsappId - Recipient's WhatsApp ID
   * @param {string} params.recipientWallet - Recipient's wallet address
   * @returns {Object} Claim result
   */
  async claimPayment(params) {
    const {
      paymentId,
      claimCode,
      recipientWhatsappId,
      recipientWallet
    } = params;

    try {
      // Get recipient profile
      const recipientProfile = await db.getProfileByWhatsappId(recipientWhatsappId);
      if (!recipientProfile) {
        throw new Error('Recipient not registered');
      }

      // TODO: Verify claim code and process claim on-chain
      // For now, mark as claimed in database

      await db.updateEscrowStatus(paymentId, 'claimed', {
        claimed_by_user_id: recipientProfile.user_id
      });

      // Log the command
      await db.logCommand(
        recipientProfile.user_id,
        recipientWhatsappId,
        'claim_payment',
        { paymentId, claimCode },
        JSON.stringify({ success: true }),
        'success'
      );

      return {
        success: true,
        message: 'Payment claimed successfully'
      };

    } catch (error) {
      console.error('[EscrowService] Error claiming payment:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========================================================================
  // Query Operations
  // ========================================================================

  /**
   * Get payment details
   */
  async getPayment(paymentId) {
    try {
      // Get from database
      // TODO: Query escrow_payments table
      
      return {
        id: paymentId,
        status: 'pending'
      };
    } catch (error) {
      console.error('[EscrowService] Error getting payment:', error.message);
      return null;
    }
  }

  /**
   * Get pending claims for a user
   */
  async getPendingClaims(whatsappId) {
    try {
      const escrows = await db.getPendingEscrows(whatsappId);
      return escrows.map(escrow => ({
        paymentId: escrow.payment_id,
        amount: blockchainService.parseAmount(escrow.amount),
        token: escrow.token,
        sender: escrow.sender_wallet,
        claimCode: escrow.claim_code,
        expiry: escrow.expiry
      }));
    } catch (error) {
      console.error('[EscrowService] Error getting claims:', error.message);
      return [];
    }
  }

  /**
   * Get user's transaction history
   */
  async getUserPayments(whatsappId) {
    try {
      return await db.getUserTransactions(whatsappId);
    } catch (error) {
      console.error('[EscrowService] Error getting history:', error.message);
      return [];
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(tokenAddress, walletAddress) {
    try {
      return await blockchainService.getTokenBalance(tokenAddress, walletAddress);
    } catch (error) {
      console.error('[EscrowService] Error getting balance:', error.message);
      return '0.00';
    }
  }

  /**
   * Get USDC balance
   */
  async getUSDCBalance(walletAddress) {
    return this.getTokenBalance(
      '0x036CbD53842c5426634e7929541eC2318f3dCF7e',  // Base Sepolia USDC
      walletAddress
    );
  }

  /**
   * Get USDT balance
   */
  async getUSDTBalance(walletAddress) {
    return this.getTokenBalance(
      '0x...',  // Would be USDT contract address
      walletAddress
    );
  }

  // ========================================================================
  // Utility Functions
  // ========================================================================

  /**
   * Generate user-friendly claim code
   */
  generateClaimCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Get network name by chain ID
   */
  getNetworkByChainId(chainId) {
    const networks = {
      84532: 'base_sepolia',
      8453: 'base',
      420420421: 'polkadot',
      44787: 'celo'
    };
    return networks[chainId] || DEFAULT_NETWORK;
  }

  /**
   * Health check
   */
  async healthCheck() {
    const dbHealth = await db.checkDatabaseHealth();
    const blockchainHealth = await blockchainService.healthCheck();
    
    return {
      database: dbHealth,
      blockchain: blockchainHealth,
      initialized: this.initialized
    };
  }
}

// Export singleton instance
const escrowService = new EscrowService();
export default escrowService;
