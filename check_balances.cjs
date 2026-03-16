const { ethers } = require('ethers');

const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.PLATFORM_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error("Error: PRIVATE_KEY or PLATFORM_PRIVATE_KEY environment variable is required");
  console.log("Usage: PRIVATE_KEY=0x... node check_balances.cjs");
  process.exit(1);
}

// USDC contract ABI (just the balanceOf function)
const USDC_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

// Networks configuration
const networks = [
  {
    name: 'Polkadot Asset Hub Testnet',
    rpc: 'https://westend-asset-hub-eth-rpc.polkadot.io',
    usdcAddress: '0x0000000000000000000000000000000000000001' // Placeholder, will try common test USDC
  },
  {
    name: 'Celo Alfajores Testnet',
    rpc: 'https://alfajores-forno.celo-testnet.org',
    usdcAddress: '0x0000000000000000000000000000000000000001'
  },
  {
    name: 'Base Sepolia Testnet',
    rpc: 'https://sepolia.base.org',
    usdcAddress: '0x0000000000000000000000000000000000000002'
  }
];

async function checkBalances() {
  const wallet = new ethers.Wallet(PRIVATE_KEY);
  console.log('\n========================================');
  console.log('Wallet Address:', wallet.address);
  console.log('========================================\n');

  for (const network of networks) {
    console.log(`\n--- ${network.name} ---`);
    try {
      const provider = new ethers.JsonRpcProvider(network.rpc);
      
      // Get native token balance
      const balance = await provider.getBalance(wallet.address);
      console.log(`Native Token Balance: ${ethers.formatEther(balance)}`);
      
      // Try to get USDC balance (will fail if address is placeholder)
      try {
        const usdcContract = new ethers.Contract(network.usdcAddress, USDC_ABI, provider);
        const usdcBalance = await usdcContract.balanceOf(wallet.address);
        const decimals = await usdcContract.decimals();
        const symbol = await usdcContract.symbol();
        console.log(`${symbol} Balance: ${ethers.formatUnits(usdcBalance, decimals)}`);
      } catch (e) {
        console.log(`USDC Balance: Unable to check (possible placeholder address)`);
        console.log(`  USDC Address configured: ${network.usdcAddress}`);
      }
    } catch (error) {
      console.log(`Error connecting: ${error.message}`);
    }
  }
}

checkBalances();
