/**
 * Conversation State Machine
 * 
 * Manages multi-step conversation states for the WhatsApp bot
 */

const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const STATES = {
  IDLE: 'idle',
  AWAITING_CONFIRMATION: 'awaiting_confirmation',
  AWAITING_PIN: 'awaiting_pin',
  AWAITING_CLAIM_CODE: 'awaiting_claim_code',
  AWAITING_FEEDBACK: 'awaiting_feedback'
};

const ACTIONS = {
  SEND: 'send',
  CONFIRM: 'confirm',
  CANCEL: 'cancel',
  CLAIM: 'claim',
  REGISTER: 'register',
  BALANCE: 'balance'
};

class ConversationStateMachine {
  constructor() {
    this.sessions = new Map();
    this.stateTimeouts = new Map();
  }

  getOrCreateSession(chatId) {
    let session = this.sessions.get(chatId);
    
    if (!session) {
      session = {
        state: STATES.IDLE,
        data: {},
        history: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.sessions.set(chatId, session);
    }
    
    session.updatedAt = Date.now();
    return session;
  }

  setState(chatId, state, data = {}) {
    const session = this.getOrCreateSession(chatId);
    const previousState = session.state;
    
    session.state = state;
    session.data = { ...session.data, ...data };
    session.history.push({ state, timestamp: Date.now() });
    
    // Clear existing timeout
    this.clearTimeout(chatId);
    
    // Set new timeout for non-idle states
    if (state !== STATES.IDLE) {
      this.setTimeout(chatId);
    }
    
    console.log(`[StateMachine] ${chatId}: ${previousState} → ${state}`);
    
    return session;
  }

  setTimeout(chatId) {
    this.stateTimeouts.set(
      chatId,
      setTimeout(() => {
        this.handleTimeout(chatId);
      }, SESSION_TIMEOUT)
    );
  }

  clearTimeout(chatId) {
    const timeout = this.stateTimeouts.get(chatId);
    if (timeout) {
      clearTimeout(timeout);
      this.stateTimeouts.delete(chatId);
    }
  }

  handleTimeout(chatId) {
    const session = this.sessions.get(chatId);
    if (session && session.state !== STATES.IDLE) {
      console.log(`[StateMachine] Session timed out for ${chatId}`);
      this.clear(chatId);
    }
  }

  clear(chatId) {
    this.clearTimeout(chatId);
    this.sessions.delete(chatId);
  }

  isInState(chatId, state) {
    const session = this.sessions.get(chatId);
    return session?.state === state;
  }

  getState(chatId) {
    const session = this.sessions.get(chatId);
    return session?.state || STATES.IDLE;
  }

  getData(chatId) {
    const session = this.sessions.get(chatId);
    return session?.data || {};
  }

  handleMessage(chatId, text, handlers) {
    const session = this.getOrCreateSession(chatId);
    const lowerText = text.toLowerCase().trim();
    
    // Handle cancel command in any state
    if (['cancel', 'stop', 'exit', 'back'].includes(lowerText)) {
      if (session.state !== STATES.IDLE) {
        this.clear(chatId);
        return handlers.onCancel?.();
      }
      return null;
    }

    // State-specific handlers
    switch (session.state) {
      case STATES.AWAITING_CONFIRMATION:
        if (['confirm', 'yes', 'y', 'ok', 'sure'].includes(lowerText)) {
          const data = { ...session.data };
          this.clear(chatId);
          return handlers.onConfirm?.(data);
        } else if (lowerText !== 'cancel') {
          return { error: 'Please reply with "confirm" or "cancel"' };
        }
        break;

      case STATES.AWAITING_PIN:
        if (/^\d{4,6}$/.test(lowerText)) {
          const data = { ...session.data, pin: lowerText };
          this.clear(chatId);
          return handlers.onPin?.(data);
        } else if (lowerText !== 'cancel') {
          return { error: 'Please enter a 4-6 digit PIN or "cancel"' };
        }
        break;

      case STATES.AWAITING_CLAIM_CODE:
        if (/^[A-Z0-9]{8}$/i.test(lowerText)) {
          const data = { ...session.data, claimCode: lowerText.toUpperCase() };
          this.clear(chatId);
          return handlers.onClaimCode?.(data);
        } else if (lowerText !== 'cancel') {
          return { error: 'Please enter the 8-character claim code or "cancel"' };
        }
        break;

      case STATES.AWAITING_FEEDBACK:
        const data = { ...session.data, feedback: text };
        this.clear(chatId);
        return handlers.onFeedback?.(data);
    }

    // Return null to continue with normal command processing
    return null;
  }

  startConfirmation(chatId, data) {
    return this.setState(chatId, STATES.AWAITING_CONFIRMATION, data);
  }

  startPinEntry(chatId, data = {}) {
    return this.setState(chatId, STATES.AWAITING_PIN, data);
  }

  startClaimCodeEntry(chatId, data = {}) {
    return this.setState(chatId, STATES.AWAITING_CLAIM_CODE, data);
  }

  startFeedback(chatId, data = {}) {
    return this.setState(chatId, STATES.AWAITING_FEEDBACK, data);
  }

  cancel(chatId) {
    this.clear(chatId);
  }

  getSessionInfo(chatId) {
    const session = this.sessions.get(chatId);
    if (!session) return null;
    
    return {
      state: session.state,
      data: session.data,
      history: session.history,
      duration: Date.now() - session.createdAt
    };
  }
}

const conversationStateMachine = new ConversationStateMachine();
export default conversationStateMachine;
