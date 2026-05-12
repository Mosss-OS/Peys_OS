// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployCeloAlfajores
 * @notice Deploys PeysEscrow (UUPS proxy) to Celo Alfajores testnet
 */
contract DeployCeloAlfajores is Script {
    address constant USDC_ADDRESS = 0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_CELO");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying PeysEscrow to Celo Alfajores...");
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
        console.log("Network: Celo Alfajores (Chain ID: 44787)");
        console.log("Proxy (use this as Escrow Contract):", address(proxy));
        console.log("Implementation:", address(implementation));
        console.log("USDC Token:", USDC_ADDRESS);
        console.log("===========================");
        console.log("");
        console.log("Add these to your .env file:");
        console.log("VITE_ESCROW_CONTRACT_ADDRESS_CELO=", vm.toString(address(proxy)));
    }
}
