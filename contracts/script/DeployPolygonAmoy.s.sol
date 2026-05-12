// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployPolygonAmoy
 * @notice Deploys PeysEscrow (UUPS proxy) to Polygon Amoy testnet
 */
contract DeployPolygonAmoy is Script {
    address constant USDC_ADDRESS = 0x41E94EB09554da6d1DE6384F89b8c2C5B2c7f3f7;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_POLYGON");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying PeysEscrow to Polygon Amoy...");
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
        console.log("Network: Polygon Amoy (Chain ID: 80002)");
        console.log("Proxy (use this as Escrow Contract):", address(proxy));
        console.log("Implementation:", address(implementation));
        console.log("USDC Token:", USDC_ADDRESS);
        console.log("===========================");
        console.log("");
        console.log("Add these to your .env file:");
        console.log("VITE_ESCROW_CONTRACT_ADDRESS_POLYGON=", vm.toString(address(proxy)));
    }
}
