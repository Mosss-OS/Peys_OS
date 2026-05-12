// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployBaseSepolia
 * @notice Deploys PeysEscrow (UUPS proxy) to Base Sepolia testnet
 */
contract DeployBaseSepolia is Script {
    address constant USDC_ADDRESS = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_BASE");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying PeysEscrow to Base Sepolia...");
        console.log("Deployer address:", deployer);
        console.log("USDC address:", USDC_ADDRESS);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy implementation contract (no constructor args)
        PeysEscrow implementation = new PeysEscrow();
        console.log("Implementation deployed at:", address(implementation));

        // Encode initialize() call
        bytes memory initData = abi.encodeCall(PeysEscrow.initialize, (USDC_ADDRESS));

        // Deploy ERC1967 proxy pointing to implementation
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        console.log("Proxy deployed at:", address(proxy));

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Base Sepolia (Chain ID: 84532)");
        console.log("Proxy (use this as Escrow Contract):", address(proxy));
        console.log("Implementation:", address(implementation));
        console.log("USDC Token:", USDC_ADDRESS);
        console.log("===========================");
        console.log("");
        console.log("Add these to your .env file:");
        console.log("VITE_ESCROW_CONTRACT_ADDRESS_BASE_SEPOLIA=", vm.toString(address(proxy)));
    }
}
