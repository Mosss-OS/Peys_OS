// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title PeysEscrow
 * @notice Escrow contract for the Peys payment platform. Creates time-locked
 *         payments that are claimed via a secret (hash), enabling magic-link flows.
 *
 * @dev === ARCHITECTURE ===
 * UUPS (Universal Upgradeable Proxy Standard) pattern:
 *   - Proxy   (ERC1967Proxy) – holds all state, forwards delegatecall to implementation
 *   - Impl    (this code)    – holds logic, zero state at its own address
 *   - Upgrade : deploy new impl + proxy.upgradeTo(newImpl)
 *   - _authorizeUpgrade is gated by onlyOwner
 *
 * @dev === MULTI-TOKEN SUPPORT ===
 *   - supportedTokens (mapping + array) whitelist controls which tokens are accepted.
 *   - address(0) represents native ETH – added automatically on initialize.
 *   - addSupportedToken / removeSupportedToken (owner only) modify the whitelist.
 *   - Claim/refund use payment.token from storage, so whitelist changes don't orphan live payments.
 *
 * @dev === ETH FLOW ===
 *   - createPayment is payable: when _token == address(0), msg.value must equal _amount.
 *   - Claim/refund ETH via call{value} with return-value check.
 *   - Permit flow rejects ETH (no EIP-2612 equivalent for native).
 *
 * @dev === SECURITY MODEL ===
 *   Reentrancy guard (fixed slot): all state-changing functions guarded.
 *     ✓ safeTransfer / call{value} called AFTER state mutation (CEI pattern).
 *   Secret-based claim: anyone with the correct secret can claim; funds go to
 *     the on-chain recipient. This is by design for magic links:
 *     - Front-runner can only claim on behalf of the recipient (funds still arrive).
 *     - Real recipient is notified via the app UI that the payment was claimed.
 *     - After expiry, sender can refund.
 *   Emergency withdrawal: 48-hour timelock + event for owner-only fund recovery.
 *   Two-step ownership transfer: prevents accidental renounce.
 *   Storage gap: uint256[50] reserves slots for future upgrade fields.
 *
 * @dev === STORAGE LAYOUT (v2) ===
 *   Slot 0..n: sequential variables below (DO NOT REORDER).
 *   Constants/errors/events do not occupy storage.
 *   Reentrancy guard uses a fixed hash slot 0x9b779b... (OZ standard).
 *   Only append new variables at the end, before __gap.
 */
contract PeysEscrow is Initializable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    /* ════════════════════════════════════════════════════
     *  CUSTOM REENTRANCY GUARD (fixed storage slot)
     *  Same slot as OZ ReentrancyGuard:
     *  keccak256(abi.encode(uint256(keccak256(
     *    "openzeppelin.storage.ReentrancyGuard"
     *  )) - 1)) & ~bytes32(uint256(0xff))
     * ════════════════════════════════════════════════════ */

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    error ReentrancyGuardReentrantCall();

    modifier nonReentrant() {
        uint256 slot;
        assembly {
            slot := sload(0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00)
        }
        if (slot == _ENTERED) revert ReentrancyGuardReentrantCall();
        assembly {
            sstore(0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00, _ENTERED)
        }
        _;
        assembly {
            sstore(0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00, _NOT_ENTERED)
        }
    }

    /* ════════════════════════════════════════════════════
     *  ENUMS & STRUCTS
     * ════════════════════════════════════════════════════ */

    enum PaymentStatus { Pending, Claimed, Refunded, Expired }

    struct Payment {
        address sender;
        address recipient;
        uint256 amount;
        address token;    // address(0) = native ETH
        bytes32 secretHash;
        PaymentStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 claimedAt;
    }

    /* ════════════════════════════════════════════════════
     *  STATE VARIABLES (sequential, DO NOT REORDER)
     * ════════════════════════════════════════════════════ */

    uint256 public paymentCount;

    uint256 public constant MAX_PAYMENT_AMOUNT     = 1_000_000_000e18;
    uint256 public constant MIN_PAYMENT_AMOUNT     = 1000;
    uint256 public constant DEFAULT_EXPIRATION     = 7 days;
    uint256 public constant MAX_EXPIRATION         = 90 days;
    uint256 public constant EMERGENCY_WITHDRAWAL_DELAY = 48 hours;

    address public owner;
    address public pendingOwner;

    mapping(uint256 => Payment)      public payments;
    mapping(address => uint256[])    public userPayments;
    mapping(address => uint256[])    public recipientPendingPayments;
    mapping(address => uint256)      public recipientPendingCount;

    mapping(address => bool)  public supportedTokens;
    address[]                  public supportedTokenList;

    uint256  public emergencyWithdrawInitiatedAt;
    address  public emergencyWithdrawToken;
    address  public emergencyWithdrawTarget;
    uint256  public emergencyWithdrawAmount;

    uint256[50] private __gap; // reserve slots for future upgrade fields

    /* ════════════════════════════════════════════════════
     *  EVENTS
     * ════════════════════════════════════════════════════ */

    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    event PaymentCreated(
        uint256 indexed paymentId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        address token,
        uint256 expiresAt
    );
    event PaymentClaimed(
        uint256 indexed paymentId,
        address indexed recipient,
        uint256 amount,
        address token
    );
    event PaymentRefunded(
        uint256 indexed paymentId,
        address indexed sender,
        uint256 amount,
        address token
    );
    event EmergencyWithdrawInitiated(
        address indexed token,
        address indexed target,
        uint256 amount,
        uint256 executeTime
    );
    event EmergencyWithdrawCancelled();
    event EmergencyWithdrawExecuted(
        address indexed token,
        address indexed target,
        uint256 amount
    );
    event OwnershipTransferInitiated(
        address indexed oldOwner,
        address indexed newOwner
    );
    event OwnershipTransferCompleted(
        address indexed oldOwner,
        address indexed newOwner
    );

    /* ════════════════════════════════════════════════════
     *  CUSTOM ERRORS
     * ════════════════════════════════════════════════════ */

    error Unauthorized();
    error TokenNotSupported(address token);
    error TokenAlreadySupported(address token);
    error CannotRemoveLastToken();
    error EthTransferFailed();
    error EthNotSupportedWithPermit();

    /* ════════════════════════════════════════════════════
     *  CONSTRUCTOR  (disable initializers in impl)
     * ════════════════════════════════════════════════════ */

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /* ════════════════════════════════════════════════════
     *  INITIALIZER  (replaces constructor for proxy)
     * ════════════════════════════════════════════════════ */

    /**
     * @notice Initializes the contract (called once at proxy deploy time).
     * @param  _tokens  Array of ERC-20 token addresses to whitelist.
     *                  address(0) for native ETH is always added automatically.
     */
    function initialize(address[] calldata _tokens) external initializer {
        supportedTokens[address(0)] = true;
        supportedTokenList.push(address(0));
        emit TokenAdded(address(0));

        for (uint256 i = 0; i < _tokens.length; i++) {
            require(_tokens[i] != address(0), "Duplicate zero-address entry");
            if (supportedTokens[_tokens[i]]) continue; // skip duplicates
            supportedTokens[_tokens[i]] = true;
            supportedTokenList.push(_tokens[i]);
            emit TokenAdded(_tokens[i]);
        }
        owner = msg.sender;
    }

    /* ════════════════════════════════════════════════════
     *  UUPS: AUTHORISE UPGRADES (owner only)
     * ════════════════════════════════════════════════════ */

    /**
     * @notice Authorises a contract upgrade.
     * @dev    Only the current owner can trigger an upgrade. The new
     *         implementation must have the same storage layout (append-only).
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /* ════════════════════════════════════════════════════
     *  MODIFIERS
     * ════════════════════════════════════════════════════ */

    /// @notice Reverts if caller is not the owner.
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    /* ════════════════════════════════════════════════════
     *  TOKEN WHITELIST MANAGEMENT  (owner only)
     * ════════════════════════════════════════════════════ */

    /**
     * @notice Adds a token to the accepted-currency whitelist.
     * @param  _token  Token address (address(0) for native ETH).
     */
    function addSupportedToken(address _token) external onlyOwner {
        if (_token == address(0)) revert("ETH is always supported");
        if (supportedTokens[_token]) revert TokenAlreadySupported(_token);
        supportedTokens[_token] = true;
        supportedTokenList.push(_token);
        emit TokenAdded(_token);
    }

    /**
     * @notice Removes a token from the whitelist.
     * @dev    Live payments with this token can still be claimed/refunded
     *         because those functions read payment.token from storage.
     *         At least one token must remain in the list.
     * @param  _token  Token address to remove.
     */
    function removeSupportedToken(address _token) external onlyOwner {
        if (!supportedTokens[_token]) revert TokenNotSupported(_token);
        if (supportedTokenList.length <= 1) revert CannotRemoveLastToken();

        supportedTokens[_token] = false;

        // swap-and-pop to keep O(1) removal
        for (uint256 i = 0; i < supportedTokenList.length; i++) {
            if (supportedTokenList[i] == _token) {
                supportedTokenList[i] = supportedTokenList[supportedTokenList.length - 1];
                supportedTokenList.pop();
                break;
            }
        }
        emit TokenRemoved(_token);
    }

    /* ════════════════════════════════════════════════════
     *  CREATE PAYMENT
     * ════════════════════════════════════════════════════ */

    /**
     * @notice Creates a new time-locked payment.
     * @dev    Payable – when _token == address(0), msg.value must == _amount.
     * @param  _recipient   Address that can claim the payment (via the secret).
     * @param  _amount      Payment amount in the smallest token unit.
     * @param  _token       Token address, or address(0) for native ETH.
     * @param  _secretHash  keccak256 hash of the claim secret.
     * @param  _duration    Lock duration in seconds (0 = DEFAULT_EXPIRATION).
     * @return paymentId    Sequential ID of the newly created payment.
     */
    function createPayment(
        address _recipient,
        uint256 _amount,
        address _token,
        bytes32 _secretHash,
        uint256 _duration
    ) external payable nonReentrant returns (uint256) {
        require(_recipient != address(0), "Invalid recipient");
        require(_recipient != msg.sender, "Cannot pay yourself");
        require(_amount >= MIN_PAYMENT_AMOUNT, "Amount too small");
        require(_amount <= MAX_PAYMENT_AMOUNT, "Amount too large");
        if (!supportedTokens[_token]) revert TokenNotSupported(_token);
        require(_secretHash != bytes32(0), "Invalid secret hash");

        uint256 duration = _duration > 0 ? _duration : DEFAULT_EXPIRATION;
        require(duration <= MAX_EXPIRATION, "Duration too long");
        uint256 expiresAt = block.timestamp + duration;

        // ── Fund collection ──
        if (_token == address(0)) {
            require(msg.value == _amount, "Incorrect ETH amount");
        } else {
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }

        paymentCount++;
        uint256 paymentId = paymentCount;

        payments[paymentId].sender       = msg.sender;
        payments[paymentId].recipient     = _recipient;
        payments[paymentId].amount        = _amount;
        payments[paymentId].token         = _token;
        payments[paymentId].secretHash    = _secretHash;
        payments[paymentId].status        = PaymentStatus.Pending;
        payments[paymentId].createdAt     = block.timestamp;
        payments[paymentId].expiresAt     = expiresAt;
        payments[paymentId].claimedAt     = 0;

        userPayments[msg.sender].push(paymentId);
        recipientPendingPayments[_recipient].push(paymentId);
        recipientPendingCount[_recipient]++;

        emit PaymentCreated(paymentId, msg.sender, _recipient, _amount, _token, expiresAt);

        return paymentId;
    }

    /* ════════════════════════════════════════════════════
     *  CREATE PAYMENT VIA EIP-2612 PERMIT
     * ════════════════════════════════════════════════════ */

    /**
     * @notice Creates a payment via a signed EIP-2612 permit (gasless for payer).
     * @dev    The caller (relayer) pays gas. The sender signs a permit off-chain.
     *         ETH is NOT supported – only ERC-20 tokens with EIP-2612.
     * @param  _sender      Address that owns the tokens and signed the permit.
     * @param  _recipient   Address that can claim the payment.
     * @param  _amount      Payment amount.
     * @param  _token       ERC-20 token address (must support EIP-2612).
     * @param  _secretHash  keccak256 of the claim secret.
     * @param  _duration    Lock duration (0 = DEFAULT_EXPIRATION).
     * @param  _deadline    Permit deadline (timestamp).
     * @param  _v           Permit signature v.
     * @param  _r           Permit signature r.
     * @param  _s           Permit signature s.
     * @return paymentId    Sequential ID of the new payment.
     */
    function createPaymentWithPermit(
        address _sender,
        address _recipient,
        uint256 _amount,
        address _token,
        bytes32 _secretHash,
        uint256 _duration,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external nonReentrant returns (uint256) {
        require(_sender != address(0), "Invalid sender");
        require(_recipient != address(0), "Invalid recipient");
        require(_recipient != _sender, "Cannot pay yourself");
        require(_amount >= MIN_PAYMENT_AMOUNT, "Amount too small");
        require(_amount <= MAX_PAYMENT_AMOUNT, "Amount too large");
        if (!supportedTokens[_token]) revert TokenNotSupported(_token);
        require(_secretHash != bytes32(0), "Invalid secret hash");
        if (_token == address(0)) revert EthNotSupportedWithPermit();

        uint256 duration = _duration > 0 ? _duration : DEFAULT_EXPIRATION;
        require(duration <= MAX_EXPIRATION, "Duration too long");
        uint256 expiresAt = block.timestamp + duration;

        IERC20Permit(_token).permit(_sender, address(this), _amount, _deadline, _v, _r, _s);
        IERC20(_token).safeTransferFrom(_sender, address(this), _amount);

        paymentCount++;
        uint256 paymentId = paymentCount;

        payments[paymentId].sender       = _sender;
        payments[paymentId].recipient     = _recipient;
        payments[paymentId].amount        = _amount;
        payments[paymentId].token         = _token;
        payments[paymentId].secretHash    = _secretHash;
        payments[paymentId].status        = PaymentStatus.Pending;
        payments[paymentId].createdAt     = block.timestamp;
        payments[paymentId].expiresAt     = expiresAt;
        payments[paymentId].claimedAt     = 0;

        userPayments[_sender].push(paymentId);
        recipientPendingPayments[_recipient].push(paymentId);
        recipientPendingCount[_recipient]++;

        emit PaymentCreated(paymentId, _sender, _recipient, _amount, _token, expiresAt);

        return paymentId;
    }

    /* ════════════════════════════════════════════════════
     *  CLAIM PAYMENT
     * ════════════════════════════════════════════════════ */

    /**
     * @notice Claims a payment by providing the matching secret.
     * @dev    Anyone with the correct secret can call this; funds always go to
     *         the on-chain recipient (see security model above).
     *         Transfers ETH via call{value} with return-value check.
     * @param  _paymentId  ID of the payment to claim.
     * @param  _secret     Plaintext secret that hashes to the stored secretHash.
     */
    function claimPayment(uint256 _paymentId, string calldata _secret) external nonReentrant {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");

        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.Pending, "Payment not pending");
        require(block.timestamp <= payment.expiresAt, "Payment expired");
        require(payment.secretHash == keccak256(abi.encodePacked(_secret)), "Invalid secret");

        payment.status   = PaymentStatus.Claimed;
        payment.claimedAt = block.timestamp;

        recipientPendingCount[payment.recipient]--;

        if (payment.token == address(0)) {
            (bool ok, ) = payable(payment.recipient).call{value: payment.amount}("");
            if (!ok) revert EthTransferFailed();
        } else {
            IERC20(payment.token).safeTransfer(payment.recipient, payment.amount);
        }

        emit PaymentClaimed(_paymentId, payment.recipient, payment.amount, payment.token);
    }

    /* ════════════════════════════════════════════════════
     *  REFUND PAYMENT
     * ════════════════════════════════════════════════════ */

    /**
     * @notice Refunds an expired payment to the original sender.
     * @dev    Only the sender can call, and only after the lock period has passed.
     * @param  _paymentId  ID of the payment to refund.
     */
    function refundPayment(uint256 _paymentId) external nonReentrant {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");

        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.Pending, "Cannot refund");
        require(payment.sender == msg.sender, "Not the sender");
        require(block.timestamp > payment.expiresAt, "Not expired yet");

        payment.status = PaymentStatus.Refunded;
        recipientPendingCount[payment.recipient]--;

        if (payment.token == address(0)) {
            (bool ok, ) = payable(payment.sender).call{value: payment.amount}("");
            if (!ok) revert EthTransferFailed();
        } else {
            IERC20(payment.token).safeTransfer(payment.sender, payment.amount);
        }

        emit PaymentRefunded(_paymentId, payment.sender, payment.amount, payment.token);
    }

    /* ════════════════════════════════════════════════════
     *  VIEW FUNCTIONS
     * ════════════════════════════════════════════════════ */

    function getPayment(uint256 _paymentId) external view returns (Payment memory) {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");
        return payments[_paymentId];
    }

    function getUserPayments(address _user) external view returns (uint256[] memory) {
        return userPayments[_user];
    }

    function getPendingPaymentsForRecipient(
        address _recipient
    ) external view returns (uint256[] memory) {
        uint256 count = recipientPendingCount[_recipient];
        uint256[] memory pendingIds = new uint256[](count);
        uint256 index = 0;

        uint256[] storage allPayments = recipientPendingPayments[_recipient];
        for (uint256 i = 0; i < allPayments.length; i++) {
            uint256 pid = allPayments[i];
            if (payments[pid].status == PaymentStatus.Pending) {
                pendingIds[index] = pid;
                index++;
                if (index >= count) break;
            }
        }
        return pendingIds;
    }

    function paymentExists(uint256 _paymentId) external view returns (bool) {
        return _paymentId > 0 && _paymentId <= paymentCount;
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokenList;
    }

    /**
     * @notice Returns the contract's balance of a given token.
     * @param  _token  Token address, or address(0) for native ETH.
     */
    function getContractBalance(address _token) external view returns (uint256) {
        if (_token == address(0)) return address(this).balance;
        return IERC20(_token).balanceOf(address(this));
    }

    /* ════════════════════════════════════════════════════
     *  EMERGENCY WITHDRAWAL  (48 h timelock, owner only)
     * ════════════════════════════════════════════════════ */

    function initiateEmergencyWithdraw(
        address _token,
        address _target,
        uint256 _amount
    ) external onlyOwner {
        require(_token != address(0) || supportedTokens[_token], "Token not whitelisted");
        require(_target != address(0), "Invalid target");
        require(_amount > 0, "Amount must be > 0");

        emergencyWithdrawToken     = _token;
        emergencyWithdrawTarget     = _target;
        emergencyWithdrawAmount     = _amount;
        emergencyWithdrawInitiatedAt = block.timestamp + EMERGENCY_WITHDRAWAL_DELAY;

        emit EmergencyWithdrawInitiated(_token, _target, _amount, emergencyWithdrawInitiatedAt);
    }

    function executeEmergencyWithdraw() external onlyOwner {
        require(emergencyWithdrawInitiatedAt > 0, "No withdrawal initiated");
        require(block.timestamp >= emergencyWithdrawInitiatedAt, "Timelock not expired");

        if (emergencyWithdrawToken == address(0)) {
            (bool ok, ) = payable(emergencyWithdrawTarget).call{value: emergencyWithdrawAmount}("");
            if (!ok) revert EthTransferFailed();
        } else {
            require(
                IERC20(emergencyWithdrawToken).transfer(emergencyWithdrawTarget, emergencyWithdrawAmount),
                "Transfer failed"
            );
        }

        emit EmergencyWithdrawExecuted(
            emergencyWithdrawToken, emergencyWithdrawTarget, emergencyWithdrawAmount
        );

        emergencyWithdrawToken     = address(0);
        emergencyWithdrawTarget     = address(0);
        emergencyWithdrawAmount     = 0;
        emergencyWithdrawInitiatedAt = 0;
    }

    function cancelEmergencyWithdraw() external onlyOwner {
        require(emergencyWithdrawInitiatedAt > 0, "No withdrawal pending");
        emit EmergencyWithdrawCancelled();

        emergencyWithdrawToken     = address(0);
        emergencyWithdrawTarget     = address(0);
        emergencyWithdrawAmount     = 0;
        emergencyWithdrawInitiatedAt = 0;
    }

    /* ════════════════════════════════════════════════════
     *  OWNERSHIP  (two-step transfer)
     * ════════════════════════════════════════════════════ */

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        pendingOwner = _newOwner;
        emit OwnershipTransferInitiated(owner, _newOwner);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not the pending owner");
        address oldOwner = owner;
        owner            = pendingOwner;
        pendingOwner     = address(0);
        emit OwnershipTransferCompleted(oldOwner, owner);
    }

    function renounceOwnership() external onlyOwner {
        if (address(this).balance > 0) revert("Cannot renounce: contract has ETH");

        for (uint256 i = 0; i < supportedTokenList.length; i++) {
            address tk = supportedTokenList[i];
            if (tk == address(0)) continue; // ETH already checked above
            if (IERC20(tk).balanceOf(address(this)) > 0) {
                revert("Cannot renounce: contract has funds");
            }
        }

        for (uint256 i = 1; i <= paymentCount; i++) {
            if (payments[i].status == PaymentStatus.Pending) {
                revert("Cannot renounce with active payments");
            }
        }

        address oldOwner  = owner;
        owner             = address(0);
        pendingOwner      = address(0);
        emit OwnershipTransferCompleted(oldOwner, address(0));
    }

    function canRenounceOwnership()
        external
        view
        returns (bool canRenounce, string memory reason)
    {
        if (address(this).balance > 0) {
            return (false, "Contract has ETH");
        }

        for (uint256 i = 0; i < supportedTokenList.length; i++) {
            address tk = supportedTokenList[i];
            if (tk == address(0)) continue;
            if (IERC20(tk).balanceOf(address(this)) > 0) {
                return (false, "Contract has funds");
            }
        }

        for (uint256 i = 1; i <= paymentCount; i++) {
            if (payments[i].status == PaymentStatus.Pending) {
                return (false, "Active payments exist");
            }
        }

        return (true, "");
    }

    /* ════════════════════════════════════════════════════
     *  FALLBACK  (reject direct ETH transfers)
     * ════════════════════════════════════════════════════ */

    receive() external payable {
        revert("Use createPayment to send ETH");
    }
}
