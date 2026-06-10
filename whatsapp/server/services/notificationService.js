/**
 * Notification Service
 * 
 * Handles sending WhatsApp notifications for payment events
 */

const APP_URL = process.env.APP_URL || 'https://peydot.vercel.app';

class NotificationService {
  constructor() {
    this.client = null;
  }

  setClient(clientInstance) {
    this.client = clientInstance;
  }

  async sendMessage(chatId, text) {
    if (!this.client) {
      console.log('[Notification] Client not initialized');
      return false;
    }

    try {
      await this.client.sendMessage(chatId, text);
      return true;
    } catch (error) {
      console.error('[Notification] Error sending message:', error.message);
      return false;
    }
  }

  async notifyPaymentCreated(payload) {
    const { recipient_whatsapp_id, amount, token, sender_name, claim_code } = payload;
    
    if (!recipient_whatsapp_id) {
      console.log('[Notification] No recipient WhatsApp ID');
      return false;
    }

    const chatId = `${recipient_whatsapp_id}@c.us`;
    const claimLink = `${APP_URL}/claim/${payload.payment_id}?code=${claim_code}`;

    const message = 
`💰 *Payment Received!*

Amount: ${amount} ${token}
From: ${sender_name}

Claim Code: \`${claim_code}\`

🔗 Claim Link: ${claimLink}

_Reply "claim" to see pending payments_`;

    return this.sendMessage(chatId, message);
  }

  async notifyPaymentClaimed(payload) {
    const { recipient_whatsapp_id, amount, token, sender_name } = payload;
    
    if (!recipient_whatsapp_id) {
      console.log('[Notification] No recipient WhatsApp ID');
      return false;
    }

    const chatId = `${recipient_whatsapp_id}@c.us`;

    const message = 
`✅ *Payment Claimed!*

${amount} ${token} has been added to your wallet.

From: ${sender_name}

_Your balance has been updated_`;

    return this.sendMessage(chatId, message);
  }

  async notifyPaymentRefunded(payload) {
    const { sender_whatsapp_id, amount, token, recipient_email } = payload;
    
    if (!sender_whatsapp_id) {
      console.log('[Notification] No sender WhatsApp ID');
      return false;
    }

    const chatId = `${sender_whatsapp_id}@c.us`;

    const message = 
`🔄 *Payment Refunded*

Your ${amount} ${token} payment to ${recipient_email} has been refunded.

_Your funds have been returned to your wallet_`;

    return this.sendMessage(chatId, message);
  }

  async handlePaymentWebhook(event, payload) {
    console.log(`[Notification] Handling webhook: ${event}`);

    switch (event) {
      case 'payment_created':
        return this.notifyPaymentCreated(payload);
      
      case 'payment_claimed':
        return this.notifyPaymentClaimed(payload);
      
      case 'payment_refunded':
        return this.notifyPaymentRefunded(payload);
      
      default:
        console.log(`[Notification] Unknown event type: ${event}`);
        return false;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
