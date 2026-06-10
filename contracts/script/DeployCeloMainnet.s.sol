// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployCeloMainnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_CELO");
        address deployer = vm.addr(deployerPrivateKey);

        // Hardcoded to avoid vm.parseAddress bug (odd number of digits error)
        address usdc = 0x0CEba9300F2b948710D2653dD7f07B3Ff9F7Fa88;
        address gd = 0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A;

        console.log("Deploying PeysEscrow to Celo Mainnet...");
        console.log("Deployer address:", deployer);
        console.log("USDC:", usdc);
        console.log("G$:", gd);

        address[] memory tokens = new address[](2);
        tokens[0] = usdc;
        tokens[1] = gd;

        vm.startBroadcast(deployerPrivateKey);

        PeysEscrow implementation = new PeysEscrow();
        console.log("Implementation deployed at:", address(implementation));

        bytes memory initData = abi.encodeCall(PeysEscrow.initialize, (tokens));
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        console.log("Proxy deployed at:", address(proxy));

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Celo Mainnet (Chain ID: 42220)");
        console.log("Proxy (use this as Escrow Contract):", address(proxy));
        console.log("Implementation:", address(implementation));
        console.log("Tokens: USDC=", usdc, " G$=", gd);
        console.log("===========================");
        console.log("");
        console.log("Add these to your .env file:");
        console.log("VITE_ESCROW_CONTRACT_ADDRESS_CELO_MAINNET=", vm.toString(address(proxy)));
    }
}
