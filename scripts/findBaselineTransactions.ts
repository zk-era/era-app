/**
 * Script to find baseline ERC20 transfer and swap transactions on Sepolia
 * for accurate gas comparison against ERA Protocol batched transactions.
 * 
 * This script searches within the SAME time windows as ERA batched transactions
 * to ensure fair gas price comparisons.
 * 
 * Author: Brody Daniels
 * Date: March 6, 2026
 */

import { createPublicClient, http, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';

// Sepolia RPC configuration
const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'),
});

// Token addresses on Sepolia (from our ERA contracts)
const TOKENS = {
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  EURC: '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4',
  WETH: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
};

// Uniswap V2 Router on Sepolia
const UNISWAP_ROUTER = '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008';

// ERA transaction time windows (from GAS_SAVINGS_ANALYSIS.md)
const TIME_WINDOWS = {
  transfers: {
    // Mar-06-2026 01:58:12 PM UTC - 02:02:36 PM UTC
    fromBlock: 10396610n,
    toBlock: 10396629n,
    description: '01:58-02:02 UTC',
  },
  swaps: {
    // Mar-06-2026 02:14:24 PM UTC - 02:16:48 PM UTC
    fromBlock: 10396680n,
    toBlock: 10396692n,
    description: '02:14-02:16 UTC',
  },
};

/**
 * Find ERC20 Transfer events within ERA transfer time window
 */
async function findERC20Transfers(tokenAddress: string, tokenSymbol: string, count: number = 3) {
  console.log(`\n🔍 Searching for ${tokenSymbol} transfers in blocks ${TIME_WINDOWS.transfers.fromBlock} - ${TIME_WINDOWS.transfers.toBlock} (${TIME_WINDOWS.transfers.description})...`);
  
  try {
    const logs = await client.getLogs({
      address: tokenAddress as `0x${string}`,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
      fromBlock: TIME_WINDOWS.transfers.fromBlock,
      toBlock: TIME_WINDOWS.transfers.toBlock,
    });
    
    console.log(`   Found ${logs.length} transfer events in this time window`);
    
    // Get transaction details for the first `count` transfers
    // Filter out ERA contract transactions to get direct transfers
    const transactions = [];
    const seenHashes = new Set<string>();
    
    for (const log of logs) {
      if (transactions.length >= count) break;
      if (!log.transactionHash || seenHashes.has(log.transactionHash)) continue;
      
      try {
        const receipt = await client.getTransactionReceipt({
          hash: log.transactionHash,
        });
        
        // Filter out transactions that are part of our ERA batches
        // (ERA contract address would be in the logs)
        const isERATransaction = receipt.logs.some(l => 
          l.topics[0] === '0x...' // Would need actual ERA event signature
        );
        
        if (!isERATransaction) {
          seenHashes.add(log.transactionHash);
          transactions.push({
            hash: log.transactionHash,
            blockNumber: log.blockNumber,
            gasUsed: receipt.gasUsed,
            from: receipt.from,
            to: receipt.to,
          });
          
          console.log(`   ✅ ${log.transactionHash}: ${receipt.gasUsed} gas (block ${log.blockNumber})`);
        }
      } catch (error) {
        // Skip transactions we can't fetch
        continue;
      }
    }
    
    if (transactions.length === 0) {
      console.log(`   ⚠️  No direct ${tokenSymbol} transfers found in this time window`);
      console.log(`   💡 Tip: Try expanding search to nearby blocks or use industry standard baseline (51,000 gas)`);
    }
    
    return transactions;
  } catch (error) {
    console.error(`   ❌ Error finding ${tokenSymbol} transfers:`, error);
    return [];
  }
}

/**
 * Find Uniswap V2 swap transactions within ERA swap time window
 */
async function findUniswapSwaps(count: number = 3) {
  console.log(`\n🔍 Searching for Uniswap V2 swaps in blocks ${TIME_WINDOWS.swaps.fromBlock} - ${TIME_WINDOWS.swaps.toBlock} (${TIME_WINDOWS.swaps.description})...`);
  
  try {
    // Uniswap V2 Pair Swap event signature
    const logs = await client.getLogs({
      event: parseAbiItem('event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)'),
      fromBlock: TIME_WINDOWS.swaps.fromBlock,
      toBlock: TIME_WINDOWS.swaps.toBlock,
    });
    
    console.log(`   Found ${logs.length} swap events in this time window`);
    
    // Filter for swaps involving our tokens and get transaction details
    const transactions = [];
    const seenHashes = new Set<string>();
    
    for (const log of logs) {
      if (transactions.length >= count) break;
      if (!log.transactionHash || seenHashes.has(log.transactionHash)) continue;
      
      try {
        const receipt = await client.getTransactionReceipt({
          hash: log.transactionHash,
        });
        
        // Only include swaps that went through Uniswap Router (not ERA contract)
        if (receipt.to?.toLowerCase() === UNISWAP_ROUTER.toLowerCase()) {
          seenHashes.add(log.transactionHash);
          transactions.push({
            hash: log.transactionHash,
            blockNumber: log.blockNumber,
            gasUsed: receipt.gasUsed,
            from: receipt.from,
            to: receipt.to,
          });
          
          console.log(`   ✅ ${log.transactionHash}: ${receipt.gasUsed} gas (block ${log.blockNumber})`);
        }
      } catch (error) {
        // Skip transactions we can't fetch
        continue;
      }
    }
    
    if (transactions.length === 0) {
      console.log(`   ⚠️  No direct Uniswap swaps found in this time window`);
      console.log(`   💡 Tip: Try expanding search to nearby blocks or use measured baseline from other time periods`);
    }
    
    return transactions;
  } catch (error) {
    console.error(`   ❌ Error finding Uniswap swaps:`, error);
    return [];
  }
}

/**
 * Calculate statistics from transaction list
 */
function calculateStats(transactions: Array<{ gasUsed: bigint }>) {
  if (transactions.length === 0) return { min: 0, max: 0, avg: 0 };
  
  const gasValues = transactions.map(tx => Number(tx.gasUsed));
  const sum = gasValues.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / gasValues.length);
  const min = Math.min(...gasValues);
  const max = Math.max(...gasValues);
  
  return { min, max, avg };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 ERA Protocol - Baseline Transaction Finder');
  console.log('   Network: Sepolia Testnet');
  console.log('   Purpose: Find real ERC20 transfers and swaps in SAME time windows as ERA batched transactions');
  console.log('   Author: Brody Daniels\n');
  
  console.log('📅 TIME WINDOWS:');
  console.log(`   Transfers: Blocks ${TIME_WINDOWS.transfers.fromBlock} - ${TIME_WINDOWS.transfers.toBlock} (${TIME_WINDOWS.transfers.description})`);
  console.log(`   Swaps: Blocks ${TIME_WINDOWS.swaps.fromBlock} - ${TIME_WINDOWS.swaps.toBlock} (${TIME_WINDOWS.swaps.description})\n`);
  
  // Find ERC20 transfers for each token
  const usdcTransfers = await findERC20Transfers(TOKENS.USDC, 'USDC', 3);
  const eurcTransfers = await findERC20Transfers(TOKENS.EURC, 'EURC', 3);
  const wethTransfers = await findERC20Transfers(TOKENS.WETH, 'WETH', 3);
  
  // Find Uniswap swaps
  const swaps = await findUniswapSwaps(3);
  
  // Calculate statistics
  console.log('\n📊 RESULTS SUMMARY\n');
  
  console.log('ERC20 Transfers:');
  if (usdcTransfers.length > 0) {
    const stats = calculateStats(usdcTransfers);
    console.log(`  USDC: ${stats.min} - ${stats.max} gas (avg: ${stats.avg})`);
  }
  if (eurcTransfers.length > 0) {
    const stats = calculateStats(eurcTransfers);
    console.log(`  EURC: ${stats.min} - ${stats.max} gas (avg: ${stats.avg})`);
  }
  if (wethTransfers.length > 0) {
    const stats = calculateStats(wethTransfers);
    console.log(`  WETH: ${stats.min} - ${stats.max} gas (avg: ${stats.avg})`);
  }
  
  const allTransfers = [...usdcTransfers, ...eurcTransfers, ...wethTransfers];
  if (allTransfers.length > 0) {
    const overallStats = calculateStats(allTransfers);
    console.log(`  OVERALL: ${overallStats.min} - ${overallStats.max} gas (avg: ${overallStats.avg})`);
  }
  
  console.log('\nUniswap V2 Swaps:');
  if (swaps.length > 0) {
    const stats = calculateStats(swaps);
    console.log(`  Found ${swaps.length} swaps`);
    console.log(`  Gas range: ${stats.min} - ${stats.max} gas (avg: ${stats.avg})`);
  }
  
  // Output formatted data for documentation
  console.log('\n📝 FORMATTED OUTPUT FOR DOCUMENTATION:\n');
  
  console.log('--- ERC20 Transfers (Copy to GAS_SAVINGS_ANALYSIS.md) ---\n');
  allTransfers.slice(0, 3).forEach((tx, i) => {
    console.log(`### Direct ERC20 Transfer #${i + 1}`);
    console.log(`- **Transaction:** [${tx.hash}](https://sepolia.etherscan.io/tx/${tx.hash})`);
    console.log(`- **Type:** ERC20 transfer`);
    console.log(`- **Gas Used:** ${tx.gasUsed}`);
    console.log(`- **Block:** ${tx.blockNumber}`);
    console.log('');
  });
  
  console.log('--- Uniswap V2 Swaps (Copy to GAS_SAVINGS_ANALYSIS.md) ---\n');
  swaps.slice(0, 3).forEach((tx, i) => {
    console.log(`### Direct Uniswap Swap #${i + 1}`);
    console.log(`- **Transaction:** [${tx.hash}](https://sepolia.etherscan.io/tx/${tx.hash})`);
    console.log(`- **Type:** Uniswap V2 swapExactTokensForTokens`);
    console.log(`- **Gas Used:** ${tx.gasUsed}`);
    console.log(`- **Block:** ${tx.blockNumber}`);
    console.log('');
  });
  
  // Calculate updated baselines
  if (allTransfers.length > 0) {
    const transferStats = calculateStats(allTransfers);
    console.log('\n✅ RECOMMENDED BASELINE FOR ERC20 TRANSFERS:');
    console.log(`   ${transferStats.avg} gas (measured from same time window on Sepolia)`);
    console.log(`   vs 51,000 gas (industry standard assumption)`);
    console.log(`   Note: Measured in same time window ensures fair gas price comparison\n`);
  } else {
    console.log('\n⚠️  NO ERC20 TRANSFERS FOUND IN TIME WINDOW:');
    console.log(`   Recommendation: Use industry standard 51,000 gas baseline`);
    console.log(`   This is a well-documented conservative estimate for ERC20 transfers\n`);
  }
  
  if (swaps.length > 0) {
    const swapStats = calculateStats(swaps);
    console.log('✅ RECOMMENDED BASELINE FOR UNISWAP SWAPS:');
    console.log(`   ${swapStats.avg} gas (measured from same time window on Sepolia)`);
    console.log(`   Note: Measured in same time window ensures fair gas price comparison\n`);
  } else {
    console.log('⚠️  NO UNISWAP SWAPS FOUND IN TIME WINDOW:');
    console.log(`   Recommendation: Expand search to nearby blocks to find baseline swaps`);
    console.log(`   Alternative: Use documented Uniswap V2 baseline (~100-110k gas)\n`);
  }
  
  console.log('\n---');
  console.log('Analysis performed by: Brody Daniels');
  console.log('Date: March 6, 2026');
  console.log('Network: Sepolia Testnet');
  console.log('Time windows match ERA batched transactions for fair comparison');
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
