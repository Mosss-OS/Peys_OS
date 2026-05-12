// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "../src/PeysEscrow.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title MockERC20
 * @notice Minimal ERC20 mock for testing escrow flows
 */
contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (allowance[from][msg.sender] != type(uint256).max) {
            require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
            allowance[from][msg.sender] -= amount;
        }
        require(balanceOf[from] >= amount, "Insufficient balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/**
 * @title PeysEscrowTest
 * @notice Tests for the simplified single-step claim flow
 */
contract PeysEscrowTest is Test {
    PeysEscrow public escrow;
    PeysEscrow public implementation;
    MockERC20 public usdc;

    address public sender = address(0x1);
    address public recipient = address(0x2);
    address public attacker = address(0x3);

    /// @notice Deploy a fresh UUPS proxy + implementation before each test
    function setUp() public {
        usdc = new MockERC20();

        implementation = new PeysEscrow();

        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeCall(PeysEscrow.initialize, (address(usdc)))
        );

        escrow = PeysEscrow(address(proxy));

        usdc.mint(sender, 1000e6);
        usdc.mint(recipient, 100e6);
        usdc.mint(attacker, 100e6);
    }

    /// @notice Helper: sender creates a payment and approves escrow
    function _createPayment(string memory _secret, uint256 _duration) internal returns (uint256) {
        vm.prank(sender);
        usdc.approve(address(escrow), type(uint256).max);

        bytes32 secretHash = keccak256(abi.encodePacked(_secret));

        vm.prank(sender);
        return escrow.createPayment(recipient, 100e6, address(usdc), secretHash, _duration);
    }

    /// @notice Test basic payment creation
    function testCreatePayment() public {
        uint256 paymentId = _createPayment("mysecret", 0);

        assertEq(paymentId, 1);
        assertEq(usdc.balanceOf(address(escrow)), 100e6);

        PeysEscrow.Payment memory payment = escrow.getPayment(1);
        assertEq(uint8(payment.status), 0); // Pending
    }

    /// @notice Test single-step claim flow (replaces old commit-reveal)
    function testSingleStepClaim() public {
        string memory secret = "mysecret123";
        _createPayment(secret, 0);

        // Recipient claims directly — no commit phase needed
        vm.prank(recipient);
        escrow.claimPayment(1, secret);

        assertEq(usdc.balanceOf(recipient), 200e6); // 100 initial + 100 claimed
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    /// @notice Test that anyone with the correct secret can claim (magic link model)
    function testAnyoneWithSecretCanClaim() public {
        string memory secret = "mysecret123";
        _createPayment(secret, 0);

        // Anyone who knows the secret can claim. The funds go to the
        // recipient stored on-chain (metadata), not the claimer.
        vm.prank(attacker);
        escrow.claimPayment(1, secret);

        assertEq(usdc.balanceOf(recipient), 200e6); // 100 initial + 100 claimed
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    /// @notice Test that wrong secret is rejected
    function testInvalidSecret() public {
        _createPayment("realsecret", 0);

        vm.prank(recipient);
        vm.expectRevert("Invalid secret");
        escrow.claimPayment(1, "wrongsecret");
    }

    /// @notice Test refund after expiry
    function testRefundAfterExpiry() public {
        uint256 senderBalanceBefore = usdc.balanceOf(sender);
        string memory secret = "mysecret";
        _createPayment(secret, 1 minutes);

        // Fast forward past expiry
        vm.warp(block.timestamp + 2 minutes);

        // Sender can refund
        vm.prank(sender);
        escrow.refundPayment(1);

        assertEq(usdc.balanceOf(sender), senderBalanceBefore);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    /// @notice Test that refund fails before expiry
    function testCannotRefundBeforeExpiry() public {
        _createPayment("mysecret", 1 days);

        vm.prank(sender);
        vm.expectRevert("Not expired yet");
        escrow.refundPayment(1);
    }

    /// @notice Test that already-claimed payments cannot be refunded
    function testCannotRefundClaimedPayment() public {
        string memory secret = "mysecret";
        _createPayment(secret, 7 days);

        vm.prank(recipient);
        escrow.claimPayment(1, secret);

        vm.warp(block.timestamp + 10 days);

        vm.prank(sender);
        vm.expectRevert("Cannot refund claimed or expired");
        escrow.refundPayment(1);
    }
}
