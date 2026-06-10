// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployCeloAlfajores is Script {
    address constant USDC = 0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B;
    address constant GDOLLAR = 0x03d3daB843e6c03b3d271eff9178e6A96c28D25f;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_CELO");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying PeysEscrow to Celo Alfajores...");
        console.log("Deployer address:", deployer);

        address[] memory tokens = new address[](2);
        tokens[0] = USDC;
        tokens[1] = GDOLLAR;

        vm.startBroadcast(deployerPrivateKey);

        PeysEscrow implementation = new PeysEscrow();
        console.log("Implementation deployed at:", address(implementation));

        bytes memory initData = abi.encodeCall(PeysEscrow.initialize, (tokens));
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        console.log("Proxy deployed at:", address(proxy));

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Celo Alfajores (Chain ID: 44787)");
        console.log("Proxy (use this as Escrow Contract):", address(proxy));
        console.log("Implementation:", address(implementation));
        console.log("Tokens:", USDC, GDOLLAR);
        console.log("===========================");
        console.log("");
        console.log("Add these to your .env file:");
        console.log("VITE_ESCROW_CONTRACT_ADDRESS_CELO=", vm.toString(address(proxy)));
    }
}
