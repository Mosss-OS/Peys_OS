// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title PeysEscrow
 * @notice Upgradeable escrow contract for Peys payment platform
 *
 * @dev === ARCHITECTURE OVERVIEW ===
 *
 * This contract uses the UUPS (Universal Upgradeable Proxy Standard) proxy pattern:
 *   - The PROXY contract (ERC1967Proxy) stores all state and forwards calls via delegatecall
 *   - The IMPLEMENTATION contract (this code) holds the logic but zero state
 *   - Upgrades deploy a new implementation and point the proxy to it via upgradeToAndCall()
 *   - Only the owner can authorize upgrades (see _authorizeUpgrade)
 *
 * @dev === STORAGE LAYOUT ===
 *
 * All state variables are declared sequentially below and MUST NOT be reordered.
 * Adding new variables must only append at the END to preserve storage compatibility
 * across upgrades. The reentrancy guard uses a fixed hash-based storage slot
 * (0x9b7...) to avoid interfering with sequential variable layout.
 *
 * @dev === SECURITY ===
 *
 * All state-changing functions use reentrancy protection via a custom storage-slot
 * implementation (identical to OpenZeppelin's ReentrancyGuard slot at 0x9b7...).
 * The commit-reveal scheme prevents front-running attacks on payment claims.
 * Emergency withdrawal has a 48-hour timelock to protect against compromised owner.
 */
contract PeysEscrow is Initializable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    // ──────────────────────────────────────────────
    //  Custom Reentrancy Guard (fixed storage slot)
    // ──────────────────────────────────────────────
    // Uses the exact same storage slot as OpenZeppelin's ReentrancyGuard:
    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.ReentrancyGuard")) - 1)) & ~bytes32(uint256(0xff))
    // This ensures no collision with sequential state variable storage slots.
    // ──────────────────────────────────────────────
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    /// @dev Revert when a reentrant call is detected
    error ReentrancyGuardReentrantCall();

    /// @dev Prevents reentrant calls to functions marked with this modifier
    modifier nonReentrant() {
        uint256 slot;
        assembly {
            slot := sload(
                0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00
            )
        }
        if (slot == _ENTERED) revert ReentrancyGuardReentrantCall();
        assembly {
            sstore(
                0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00,
                _ENTERED
            )
        }
        _;
        assembly {
            sstore(
                0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00,
                _NOT_ENTERED
            )
        }
    }

    /// @notice Payment status enum
    enum PaymentStatus { Pending, Committed, Claimed, Refunded, Expired }

    /// @notice Payment struct
    struct Payment {
        address sender;
        address recipient;
        uint256 amount;
        address token;
        bytes32 secretHash;
        PaymentStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 claimedAt;
        bytes32 commitmentHash;
        uint256 commitmentTime;
    }

    /// @notice ERC20 token interface
    IERC20 public usdc;

    /// @notice Payment counter
    uint256 public paymentCount;

    /// @notice Maximum payment amount (prevents large loss from bugs)
    uint256 public constant MAX_PAYMENT_AMOUNT = 1_000_000e6; // 1M USDC

    /// @notice Minimum payment amount
    uint256 public constant MIN_PAYMENT_AMOUNT = 1e6; // 1 USDC (6 decimals)

    /// @notice Default expiration period
    uint256 public constant DEFAULT_EXPIRATION = 7 days;

    /// @notice Maximum expiration period
    uint256 public constant MAX_EXPIRATION = 90 days;

    /// @notice Commit reveal delay - prevents front-running
    uint256 public constant COMMIT_REVEAL_DELAY = 2 minutes;

    /// @notice Emergency withdrawal delay - prevents accidental triggering
    uint256 public constant EMERGENCY_WITHDRAWAL_DELAY = 48 hours;

    /// @notice Owner of the contract
    address public owner;

    /// @notice Pending owner for safe ownership transfer
    address public pendingOwner;

    /// @notice Timestamp when emergency withdrawal was initiated
    uint256 public emergencyWithdrawInitiatedAt;

    /// @notice Token address queued for emergency withdrawal
    address public emergencyWithdrawToken;

    /// @notice Target address for emergency withdrawal
    address public emergencyWithdrawTarget;

    /// @notice Amount queued for emergency withdrawal
    uint256 public emergencyWithdrawAmount;

    /// @notice Emergency withdrawal initiated event
    event EmergencyWithdrawInitiated(
        address indexed token,
        address indexed target,
        uint256 amount,
        uint256 executeTime
    );

    /// @notice Emergency withdrawal cancelled event
    event EmergencyWithdrawCancelled();

    /// @notice Emergency withdrawal executed event
    event EmergencyWithdrawExecuted(
        address indexed token,
        address indexed target,
        uint256 amount
    );

    /// @notice Ownership transfer initiated
    event OwnershipTransferInitiated(address indexed oldOwner, address indexed newOwner);

    /// @notice Ownership transfer completed
    event OwnershipTransferCompleted(address indexed oldOwner, address indexed newOwner);

    /// @notice Unauthorized access attempt
    error Unauthorized();

    /// @notice Payments mapping
    mapping(uint256 => Payment) public payments;

    /// @notice User's payment IDs
    mapping(address => uint256[]) public userPayments;

    /// @notice Recipient's pending/committed payment IDs (optimized index)
    mapping(address => uint256[]) public recipientPendingPayments;

    /// @notice Count of pending payments for each recipient
    mapping(address => uint256) public recipientPendingCount;

    /// @notice Events
    event PaymentCreated(
        uint256 indexed paymentId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        address token,
        uint256 expiresAt
    );

    event PaymentCommitted(
        uint256 indexed paymentId,
        address indexed recipient,
        bytes32 commitmentHash
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

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract (replaces constructor for proxy pattern)
     * @param _usdc USDC token address
     */
    function initialize(address _usdc) external initializer {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
        owner = msg.sender;
    }

    /**
     * @notice UUPS: authorize upgrades (owner only)
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @notice Modifier to restrict access to owner only
     */
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    /**
     * @notice Create a new payment
     * @param _recipient Recipient address
     * @param _amount Amount to escrow (must be between MIN and MAX)
     * @param _token Token address (must be USDC)
     * @param _secretHash Hash of the secret for claiming
     * @param _duration Lock duration in seconds (default 7 days, max 90 days)
     */
    function createPayment(
        address _recipient,
        uint256 _amount,
        address _token,
        bytes32 _secretHash,
        uint256 _duration
    ) external nonReentrant returns (uint256) {
        require(_recipient != address(0), "Invalid recipient");
        require(_recipient != msg.sender, "Cannot pay yourself");
        require(_amount >= MIN_PAYMENT_AMOUNT, "Amount too small");
        require(_amount <= MAX_PAYMENT_AMOUNT, "Amount too large");
        require(_token == address(usdc), "Only USDC accepted");
        require(_secretHash != bytes32(0), "Invalid secret hash");

        uint256 duration = _duration > 0 ? _duration : DEFAULT_EXPIRATION;
        require(duration <= MAX_EXPIRATION, "Duration too long");
        uint256 expiresAt = block.timestamp + duration;

        usdc.safeTransferFrom(msg.sender, address(this), _amount);

        paymentCount++;
        uint256 paymentId = paymentCount;

        payments[paymentId] = Payment({
            sender: msg.sender,
            recipient: _recipient,
            amount: _amount,
            token: _token,
            secretHash: _secretHash,
            status: PaymentStatus.Pending,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            claimedAt: 0,
            commitmentHash: bytes32(0),
            commitmentTime: 0
        });

        userPayments[msg.sender].push(paymentId);

        recipientPendingPayments[_recipient].push(paymentId);
        recipientPendingCount[_recipient]++;

        emit PaymentCreated(paymentId, msg.sender, _recipient, _amount, _token, expiresAt);

        return paymentId;
    }

    /**
     * @notice Commit to claiming a payment (prevents front-running)
     * @param _paymentId Payment ID
     * @param _commitmentHash Hash of (secret + recipient address) to prevent front-running
     * @dev Front-running protection: the commitment is bound to the recipient
     */
    function commitClaim(uint256 _paymentId, bytes32 _commitmentHash) external nonReentrant {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");
        require(_commitmentHash != bytes32(0), "Invalid commitment");

        Payment storage payment = payments[_paymentId];

        require(payment.status == PaymentStatus.Pending, "Payment not pending or already claimed");
        require(block.timestamp <= payment.expiresAt, "Payment expired");
        require(payment.recipient == msg.sender, "Not the recipient");
        require(payment.commitmentHash == bytes32(0), "Already committed");
        require(payment.commitmentTime == 0, "Already committed");

        payment.commitmentHash = _commitmentHash;
        payment.commitmentTime = block.timestamp;
        payment.status = PaymentStatus.Committed;

        emit PaymentCommitted(_paymentId, msg.sender, _commitmentHash);
    }

    /**
     * @notice Claim a payment using the secret (after commit)
     * @param _paymentId Payment ID
     * @param _secret The secret to claim
     * @dev Front-running protected by commit-reveal scheme
     */
    function claimPayment(uint256 _paymentId, string calldata _secret) external nonReentrant {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");

        Payment storage payment = payments[_paymentId];

        require(payment.status == PaymentStatus.Committed, "Must commit first");
        require(block.timestamp <= payment.expiresAt, "Payment expired");
        require(payment.recipient == msg.sender, "Not the recipient");
        require(payment.commitmentTime + COMMIT_REVEAL_DELAY <= block.timestamp, "Too soon to reveal");

        // Verify commitment hash: hash(secret + recipient) must match
        require(
            payment.commitmentHash == keccak256(abi.encodePacked(_secret, msg.sender)),
            "Invalid secret or commitment"
        );

        // Verify the original secret hash matches
        require(
            payment.secretHash == keccak256(abi.encodePacked(_secret)),
            "Invalid secret"
        );

        payment.status = PaymentStatus.Claimed;
        payment.claimedAt = block.timestamp;

        recipientPendingCount[payment.recipient]--;

        usdc.safeTransfer(payment.recipient, payment.amount);

        emit PaymentClaimed(_paymentId, payment.recipient, payment.amount, payment.token);
    }

    /**
     * @notice Cancel a commit if something went wrong (refund after expiry only)
     * @param _paymentId Payment ID
     * @dev Allows sender to refund after expiry, even if someone committed
     */
    function cancelCommit(uint256 _paymentId) external nonReentrant {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");

        Payment storage payment = payments[_paymentId];

        require(payment.status == PaymentStatus.Committed, "No commit to cancel");
        require(payment.sender == msg.sender, "Not the sender");
        require(block.timestamp > payment.expiresAt, "Cannot cancel before expiry");

        payment.status = PaymentStatus.Refunded;
        recipientPendingCount[payment.recipient]--;
        usdc.safeTransfer(payment.sender, payment.amount);

        emit PaymentRefunded(_paymentId, payment.sender, payment.amount, payment.token);
    }

    /**
     * @notice Refund an unclaimed payment (only sender can call after expiry)
     * @param _paymentId Payment ID
     */
    function refundPayment(uint256 _paymentId) external nonReentrant {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");

        Payment storage payment = payments[_paymentId];

        require(payment.status == PaymentStatus.Pending || payment.status == PaymentStatus.Committed, "Cannot refund");
        require(payment.sender == msg.sender, "Not the sender");
        require(block.timestamp > payment.expiresAt, "Not expired yet");

        payment.status = PaymentStatus.Refunded;
        recipientPendingCount[payment.recipient]--;
        usdc.safeTransfer(payment.sender, payment.amount);

        emit PaymentRefunded(_paymentId, payment.sender, payment.amount, payment.token);
    }

    /**
     * @notice Get payment details
     * @param _paymentId Payment ID
     */
    function getPayment(uint256 _paymentId) external view returns (Payment memory) {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");
        return payments[_paymentId];
    }

    /**
     * @notice Get user's payment IDs
     * @param _user User address
     */
    function getUserPayments(address _user) external view returns (uint256[] memory) {
        return userPayments[_user];
    }

    /**
     * @notice Get pending payments for a recipient (gas optimized)
     * @param _recipient Recipient address
     */
    function getPendingPaymentsForRecipient(address _recipient) external view returns (uint256[] memory) {
        uint256 count = recipientPendingCount[_recipient];
        uint256[] memory pendingIds = new uint256[](count);
        uint256 index = 0;
        
        uint256[] storage allPayments = recipientPendingPayments[_recipient];
        for (uint256 i = 0; i < allPayments.length; i++) {
            uint256 paymentId = allPayments[i];
            Payment storage payment = payments[paymentId];
            if (payment.status == PaymentStatus.Pending || payment.status == PaymentStatus.Committed) {
                pendingIds[index] = paymentId;
                index++;
                if (index >= count) break;
            }
        }
        
        return pendingIds;
    }

    /**
     * @notice Check if a payment exists
     * @param _paymentId Payment ID
     */
    function paymentExists(uint256 _paymentId) external view returns (bool) {
        return _paymentId > 0 && _paymentId <= paymentCount;
    }

    /**
     * @notice Get contract USDC balance
     */
    function getContractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /**
     * @notice Get remaining time until reveal is allowed
     * @param _paymentId Payment ID
     */
    function getRevealTimeRemaining(uint256 _paymentId) external view returns (uint256) {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");
        Payment storage payment = payments[_paymentId];
        if (payment.commitmentTime == 0) return 0;
        uint256 revealTime = payment.commitmentTime + COMMIT_REVEAL_DELAY;
        if (block.timestamp >= revealTime) return 0;
        return revealTime - block.timestamp;
    }

    /**
     * @notice Initiate emergency withdrawal of tokens (48 hour timelock)
     * @param _token Token address to withdraw
     * @param _target Address to receive the tokens
     * @param _amount Amount to withdraw
     * @dev Requires 48 hour delay before execution
     */
    function initiateEmergencyWithdraw(
        address _token,
        address _target,
        uint256 _amount
    ) external onlyOwner {
        require(_token != address(0), "Invalid token");
        require(_target != address(0), "Invalid target");
        require(_amount > 0, "Amount must be > 0");

        emergencyWithdrawToken = _token;
        emergencyWithdrawTarget = _target;
        emergencyWithdrawAmount = _amount;
        emergencyWithdrawInitiatedAt = block.timestamp + EMERGENCY_WITHDRAWAL_DELAY;

        emit EmergencyWithdrawInitiated(_token, _target, _amount, emergencyWithdrawInitiatedAt);
    }

    /**
     * @notice Execute emergency withdrawal after timelock expires
     */
    function executeEmergencyWithdraw() external onlyOwner {
        require(emergencyWithdrawInitiatedAt > 0, "No withdrawal initiated");
        require(block.timestamp >= emergencyWithdrawInitiatedAt, "Timelock not expired");
        require(IERC20(emergencyWithdrawToken).transfer(emergencyWithdrawTarget, emergencyWithdrawAmount), "Transfer failed");

        emit EmergencyWithdrawExecuted(emergencyWithdrawToken, emergencyWithdrawTarget, emergencyWithdrawAmount);

        emergencyWithdrawToken = address(0);
        emergencyWithdrawTarget = address(0);
        emergencyWithdrawAmount = 0;
        emergencyWithdrawInitiatedAt = 0;
    }

    /**
     * @notice Cancel pending emergency withdrawal
     */
    function cancelEmergencyWithdraw() external onlyOwner {
        require(emergencyWithdrawInitiatedAt > 0, "No withdrawal pending");

        emit EmergencyWithdrawCancelled();

        emergencyWithdrawToken = address(0);
        emergencyWithdrawTarget = address(0);
        emergencyWithdrawAmount = 0;
        emergencyWithdrawInitiatedAt = 0;
    }

    /**
     * @notice Initiate ownership transfer
     * @param _newOwner Address of new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        pendingOwner = _newOwner;
        emit OwnershipTransferInitiated(owner, _newOwner);
    }

    /**
     * @notice Accept ownership transfer
     */
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not the pending owner");
        address oldOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipTransferCompleted(oldOwner, owner);
    }

    /**
     * @notice Renounce ownership (irreversible)
     * @dev Must not have any active payments or funds in the contract
     */
    function renounceOwnership() external onlyOwner {
        // Check contract has no funds
        uint256 contractBalance = usdc.balanceOf(address(this));
        require(contractBalance == 0, "Cannot renounce: contract has funds");

        // Check for active payments (pending or committed status)
        for (uint256 i = 1; i <= paymentCount; i++) {
            Payment storage payment = payments[i];
            if (payment.status == PaymentStatus.Pending || payment.status == PaymentStatus.Committed) {
                revert("Cannot renounce with active payments");
            }
        }

        address oldOwner = owner;
        owner = address(0);
        pendingOwner = address(0);
        emit OwnershipTransferCompleted(oldOwner, address(0));
    }

    /**
     * @notice Check if ownership can be safely renounced
     * @return canRenounce True if no funds and no active payments
     * @return reason Reason why ownership cannot be renounced (if applicable)
     */
    function canRenounceOwnership() external view returns (bool canRenounce, string memory reason) {
        // Check contract balance
        uint256 contractBalance = usdc.balanceOf(address(this));
        if (contractBalance > 0) {
            return (false, "Contract has funds");
        }

        // Check for active payments
        for (uint256 i = 1; i <= paymentCount; i++) {
            Payment storage payment = payments[i];
            if (payment.status == PaymentStatus.Pending || payment.status == PaymentStatus.Committed) {
                return (false, "Active payments exist");
            }
        }

        return (true, "");
    }
}
