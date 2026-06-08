// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "../src/PeysEscrow.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;

    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }

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

    function nonces(address) external pure returns (uint256) { return 0; }

    function permit(address owner, address spender, uint256 value, uint256, uint8, bytes32, bytes32) external {
        allowance[owner][spender] = value;
    }
}

contract PeysEscrowTest is Test {
    PeysEscrow public escrow;
    MockERC20 public usdc;
    MockERC20 public gd;

    address public sender    = address(0x1);
    address public recipient = address(0x2);
    address public attacker  = address(0x3);

    function setUp() public {
        usdc = new MockERC20();
        gd   = new MockERC20();

        PeysEscrow impl = new PeysEscrow();

        address[] memory tokens = new address[](2);
        tokens[0] = address(usdc);
        tokens[1] = address(gd);

        ERC1967Proxy proxy = new ERC1967Proxy(
            address(impl),
            abi.encodeCall(PeysEscrow.initialize, (tokens))
        );

        escrow = PeysEscrow(payable(address(proxy)));

        usdc.mint(sender,    1000e6);
        usdc.mint(recipient, 100e6);
        usdc.mint(attacker,  100e6);
        gd.mint(sender,      1000e18);
        gd.mint(recipient,   100e18);
    }

    // ── helpers ──

    function _createPayment(string memory _secret, uint256 _duration, address _token, uint256 _amount) internal returns (uint256) {
        bytes32 sh = keccak256(abi.encodePacked(_secret));
        vm.prank(sender);
        if (_token != address(0)) MockERC20(_token).approve(address(escrow), type(uint256).max);
        vm.prank(sender);
        return escrow.createPayment(recipient, _amount, _token, sh, _duration);
    }

    function _createPayment(string memory _secret, uint256 _duration) internal returns (uint256) {
        return _createPayment(_secret, _duration, address(usdc), 100e6);
    }

    function _createEthPayment(string memory _secret, uint256 _amount) internal returns (uint256) {
        bytes32 sh = keccak256(abi.encodePacked(_secret));
        vm.deal(sender, _amount);
        vm.prank(sender);
        return escrow.createPayment{value: _amount}(recipient, _amount, address(0), sh, 0);
    }

    // ══════════════════════════════════════════
    //  ERC-20 FLOWS
    // ══════════════════════════════════════════

    function testCreatePayment() public {
        uint256 pid = _createPayment("secret", 0);
        assertEq(pid, 1);
        assertEq(usdc.balanceOf(address(escrow)), 100e6);
        PeysEscrow.Payment memory p = escrow.getPayment(1);
        assertGt(p.expiresAt, block.timestamp);
    }

    function testCreatePaymentWithGd() public {
        uint256 pid = _createPayment("g-secret", 0, address(gd), 50e18);
        assertEq(pid, 1);
        PeysEscrow.Payment memory p = escrow.getPayment(1);
        assertEq(p.token, address(gd));
        assertEq(p.amount, 50e18);
    }

    function testClaimPayment() public {
        _createPayment("s", 0);
        vm.prank(recipient);
        escrow.claimPayment(1, "s");
        assertEq(usdc.balanceOf(recipient), 200e6);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    function testClaimGdPayment() public {
        _createPayment("s", 0, address(gd), 50e18);
        uint256 before = gd.balanceOf(recipient);
        vm.prank(recipient);
        escrow.claimPayment(1, "s");
        assertEq(gd.balanceOf(recipient), before + 50e18);
    }

    function testAnyoneWithSecretCanClaim() public {
        _createPayment("s", 0);
        vm.prank(attacker);
        escrow.claimPayment(1, "s");
        assertEq(usdc.balanceOf(recipient), 200e6);
    }

    function testInvalidSecret() public {
        _createPayment("real", 0);
        vm.prank(recipient);
        vm.expectRevert("Invalid secret");
        escrow.claimPayment(1, "fake");
    }

    function testRefundAfterExpiry() public {
        uint256 before = usdc.balanceOf(sender);
        _createPayment("s", 1 minutes);
        vm.warp(block.timestamp + 2 minutes);
        vm.prank(sender);
        escrow.refundPayment(1);
        assertEq(usdc.balanceOf(sender), before);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    function testCannotRefundBeforeExpiry() public {
        _createPayment("s", 1 days);
        vm.prank(sender);
        vm.expectRevert("Not expired yet");
        escrow.refundPayment(1);
    }

    function testCannotRefundClaimedPayment() public {
        _createPayment("s", 7 days);
        vm.prank(recipient);
        escrow.claimPayment(1, "s");
        vm.warp(block.timestamp + 10 days);
        vm.prank(sender);
        vm.expectRevert("Cannot refund");
        escrow.refundPayment(1);
    }

    // ══════════════════════════════════════════
    //  PERMIT FLOWS
    // ══════════════════════════════════════════

    function testCreatePaymentWithPermit() public {
        bytes32 sh = keccak256(abi.encodePacked("s"));
        uint256 before = usdc.balanceOf(sender);
        vm.prank(attacker);
        escrow.createPaymentWithPermit(sender, recipient, 100e6, address(usdc), sh, 0, block.timestamp + 1 hours, 0, bytes32(0), bytes32(0));
        assertEq(usdc.balanceOf(address(escrow)), 100e6);
        assertEq(usdc.balanceOf(sender), before - 100e6);
    }

    function testPermitThenClaim() public {
        bytes32 sh = keccak256(abi.encodePacked("s"));
        vm.prank(attacker);
        escrow.createPaymentWithPermit(sender, recipient, 100e6, address(usdc), sh, 0, block.timestamp + 1 hours, 0, bytes32(0), bytes32(0));
        vm.prank(recipient);
        escrow.claimPayment(1, "s");
        assertEq(usdc.balanceOf(recipient), 200e6);
    }

    // ══════════════════════════════════════════
    //  NATIVE ETH FLOWS
    // ══════════════════════════════════════════

    function testCreateEthPayment() public {
        uint256 amount = 5 ether;
        uint256 before = address(escrow).balance;
        _createEthPayment("eth-secret", amount);
        assertEq(address(escrow).balance, before + amount);
    }

    function testClaimEthPayment() public {
        uint256 amount = 5 ether;
        _createEthPayment("eth-secret", amount);

        vm.prank(recipient);
        escrow.claimPayment(1, "eth-secret");

        assertEq(recipient.balance, amount);
        assertEq(address(escrow).balance, 0);
    }

    function testRefundEthPayment() public {
        uint256 amount = 3 ether;
        _createEthPayment("eth-secret", amount);

        // sender had 0, got 3 ether, sent 3 ether to escrow → now has 0
        assertEq(address(escrow).balance, amount);

        vm.warp(block.timestamp + 8 days);
        vm.prank(sender);
        escrow.refundPayment(1);

        assertEq(sender.balance, amount);
        assertEq(address(escrow).balance, 0);
    }

    function testIncorrectEthAmount() public {
        bytes32 sh = keccak256(abi.encodePacked("s"));
        vm.deal(sender, 10 ether);
        vm.prank(sender);
        vm.expectRevert("Incorrect ETH amount");
        escrow.createPayment{value: 1 ether}(recipient, 2 ether, address(0), sh, 0);
    }

    function testEthNotSupportedWithPermit() public {
        bytes32 sh = keccak256(abi.encodePacked("s"));
        vm.prank(attacker);
        vm.expectRevert(PeysEscrow.EthNotSupportedWithPermit.selector);
        escrow.createPaymentWithPermit(sender, recipient, 1 ether, address(0), sh, 0, block.timestamp + 1 hours, 0, bytes32(0), bytes32(0));
    }

    function testRejectDirectEth() public {
        vm.deal(sender, 1 ether);
        vm.prank(sender);
        (bool ok,) = payable(address(escrow)).call{value: 1 ether}("");
        assertFalse(ok);
    }

    // ══════════════════════════════════════════
    //  TOKEN WHITELIST
    // ══════════════════════════════════════════

    function testGetSupportedTokens() public {
        address[] memory tokens = escrow.getSupportedTokens();
        assertEq(tokens.length, 3); // address(0) + usdc + gd
        assertEq(tokens[0], address(0));
        assertEq(tokens[1], address(usdc));
        assertEq(tokens[2], address(gd));
    }

    function testAddSupportedToken() public {
        MockERC20 newToken = new MockERC20();
        assertFalse(escrow.supportedTokens(address(newToken)));

        vm.prank(attacker);
        vm.expectRevert(PeysEscrow.Unauthorized.selector);
        escrow.addSupportedToken(address(newToken));

        escrow.addSupportedToken(address(newToken));
        assertTrue(escrow.supportedTokens(address(newToken)));
    }

    function testRemoveSupportedToken() public {
        MockERC20 removable = new MockERC20();
        escrow.addSupportedToken(address(removable));

        escrow.removeSupportedToken(address(removable));
        assertFalse(escrow.supportedTokens(address(removable)));
    }

    function testCannotRemoveLastToken() public {
        PeysEscrow soloEscrow;
        MockERC20 t = new MockERC20();

        PeysEscrow soloImpl = new PeysEscrow();
        address[] memory erc20s = new address[](1);
        erc20s[0] = address(t);
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(soloImpl),
            abi.encodeCall(PeysEscrow.initialize, (erc20s))
        );
        soloEscrow = PeysEscrow(payable(address(proxy)));

        // initialize adds address(0) for ETH + 1 ERC-20 → 2 total
        vm.prank(soloEscrow.owner());
        soloEscrow.removeSupportedToken(address(t));

        // now only ETH (address(0)) remains — cannot remove it
        vm.expectRevert(PeysEscrow.CannotRemoveLastToken.selector);
        soloEscrow.removeSupportedToken(address(0));
    }

    function testRevertUnsupportedToken() public {
        MockERC20 bad = new MockERC20();
        bad.mint(sender, 100e6);
        bytes32 sh = keccak256(abi.encodePacked("s"));
        vm.prank(sender);
        bad.approve(address(escrow), 100e6);
        vm.prank(sender);
        vm.expectRevert(abi.encodeWithSelector(PeysEscrow.TokenNotSupported.selector, address(bad)));
        escrow.createPayment(recipient, 100e6, address(bad), sh, 0);
    }

    // ══════════════════════════════════════════
    //  OWNERSHIP & RENOUNCE
    // ══════════════════════════════════════════

    function testTwoStepOwnershipTransfer() public {
        address newOwner = address(0x42);
        escrow.transferOwnership(newOwner);
        assertEq(address(escrow.pendingOwner()), newOwner);

        vm.prank(newOwner);
        escrow.acceptOwnership();
        assertEq(address(escrow.owner()), newOwner);
    }

    function testCannotRenounceWithFunds() public {
        _createPayment("s", 0);
        vm.expectRevert();
        escrow.renounceOwnership();
    }

    function testCanRenounceAfterCleanup() public {
        _createPayment("s", 1 minutes);
        vm.warp(block.timestamp + 2 minutes);
        vm.prank(sender);
        escrow.refundPayment(1);

        (bool ok, string memory reason) = escrow.canRenounceOwnership();
        assertTrue(ok);
        assertEq(reason, "");

        escrow.renounceOwnership();
        assertEq(address(escrow.owner()), address(0));
    }
}
