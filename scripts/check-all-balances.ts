import { ethers } from "ethers";

const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.PLATFORM_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error("Error: PRIVATE_KEY environment variable is required");
  process.exit(1);
}

const USDC_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

interface TokenBalance {
  symbol: string;
  balance: number;
  decimals: number;
  network: string;
  chainId: number;
}

const networks = [
  {
    name: "Polkadot Asset Hub (Paseo)",
    rpc: process.env.POLKADOT_RPC || "https://rpc.polkadot.io",
    chainId: 420420417,
    nativeSymbol: "DOT",
    tokens: [
      { address: "0x0000000000000000000000000000000000000001", symbol: "PASS", isNative: false }
    ]
  },
  {
    name: "Base Sepolia",
    rpc: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
    chainId: 84532,
    nativeSymbol: "ETH",
    tokens: [
      { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC", isNative: false }
    ]
  },
  {
    name: "Celo Alfajores",
    rpc: process.env.CELO_ALFAJORES_RPC || "https://rpc.alfajores.celo.org",
    chainId: 44787,
    nativeSymbol: "CELO",
    tokens: [
      { address: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B", symbol: "USDC", isNative: false },
      { address: "0x0000000000000000000000000000000000000001", symbol: "USDT", isNative: false }
    ]
  }
];

async function getTokenBalance(provider: ethers.JsonRpcProvider, walletAddress: string, tokenAddress: string, timeout = 5000): Promise<{ balance: number; symbol: string; decimals: number } | null> {
  try {
    if (tokenAddress === "0x0000000000000000000000000000000000000001" || tokenAddress === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const contract = new ethers.Contract(tokenAddress, USDC_ABI, provider);
    const balance = await contract.balanceOf(walletAddress).finally(() => clearTimeout(timeoutId));
    const decimals = await contract.decimals().finally(() => clearTimeout(timeoutId));
    const symbol = await contract.symbol().finally(() => clearTimeout(timeoutId));
    return {
      balance: Number(ethers.formatUnits(balance, decimals)),
      symbol,
      decimals
    };
  } catch {
    return null;
  }
}

async function checkAllBalances() {
  const wallet = new ethers.Wallet(PRIVATE_KEY as string);
  console.log("\n" + "=".repeat(60));
  console.log("WALLET ADDRESS:", wallet.address);
  console.log("=".repeat(60) + "\n");

  const allBalances: TokenBalance[] = [];

  for (const network of networks) {
    console.log(`\n📡 Connecting to ${network.name}...`);
    try {
      const provider = new ethers.JsonRpcProvider(network.rpc);
      
      const nativeBalance = await provider.getBalance(wallet.address);
      const nativeBal = Number(ethers.formatEther(nativeBalance));
      
      console.log(`   💰 ${network.nativeSymbol}: ${nativeBal.toFixed(6)}`);
      
      allBalances.push({
        symbol: network.nativeSymbol,
        balance: nativeBal,
        decimals: 18,
        network: network.name,
        chainId: network.chainId
      });

      for (const token of network.tokens) {
        const tokenBal = await getTokenBalance(provider, wallet.address, token.address);
        if (tokenBal && tokenBal.balance > 0) {
          console.log(`   💰 ${tokenBal.symbol}: ${tokenBal.balance.toFixed(6)}`);
          allBalances.push({
            symbol: tokenBal.symbol,
            balance: tokenBal.balance,
            decimals: tokenBal.decimals,
            network: network.name,
            chainId: network.chainId
          });
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${(error as Error).message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 BALANCE RANKING (Highest to Lowest)");
  console.log("=".repeat(60));
  
  const sorted = allBalances.sort((a, b) => b.balance - a.balance);
  
  sorted.forEach((bal, index) => {
    const rank = index + 1;
    const value = bal.balance.toFixed(6).padEnd(15);
    const symbol = bal.symbol.padEnd(6);
    const network = bal.network.padEnd(25);
    console.log(`  #${rank}. ${value} ${symbol} | ${network}`);
  });

  console.log("\n" + "=".repeat(60));
  const totalUSD = sorted.reduce((acc, bal) => acc + bal.balance, 0);
  console.log(`💵 TOTAL (All Tokens): ${totalUSD.toFixed(6)}`);
  console.log("=".repeat(60) + "\n");
}

checkAllBalances().catch(console.error);
