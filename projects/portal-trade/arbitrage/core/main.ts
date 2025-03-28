import { ethers } from 'ethers';

// Standard ERC20 and AMM interfaces
const ERC20_ABI = [
			{
				"inputs": [
					{
						"internalType": "string",
						"name": "_name",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "_symbol",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "_initialSupply",
						"type": "uint256"
					}
				],
				"stateMutability": "nonpayable",
				"type": "constructor"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "spender",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "allowance",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "needed",
						"type": "uint256"
					}
				],
				"name": "ERC20InsufficientAllowance",
				"type": "error"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "balance",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "needed",
						"type": "uint256"
					}
				],
				"name": "ERC20InsufficientBalance",
				"type": "error"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "approver",
						"type": "address"
					}
				],
				"name": "ERC20InvalidApprover",
				"type": "error"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "receiver",
						"type": "address"
					}
				],
				"name": "ERC20InvalidReceiver",
				"type": "error"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					}
				],
				"name": "ERC20InvalidSender",
				"type": "error"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "spender",
						"type": "address"
					}
				],
				"name": "ERC20InvalidSpender",
				"type": "error"
			},
			{
				"anonymous": false,
				"inputs": [
					{
						"indexed": true,
						"internalType": "address",
						"name": "owner",
						"type": "address"
					},
					{
						"indexed": true,
						"internalType": "address",
						"name": "spender",
						"type": "address"
					},
					{
						"indexed": false,
						"internalType": "uint256",
						"name": "value",
						"type": "uint256"
					}
				],
				"name": "Approval",
				"type": "event"
			},
			{
				"anonymous": false,
				"inputs": [
					{
						"indexed": true,
						"internalType": "address",
						"name": "from",
						"type": "address"
					},
					{
						"indexed": true,
						"internalType": "address",
						"name": "to",
						"type": "address"
					},
					{
						"indexed": false,
						"internalType": "uint256",
						"name": "value",
						"type": "uint256"
					}
				],
				"name": "Transfer",
				"type": "event"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "owner",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "spender",
						"type": "address"
					}
				],
				"name": "allowance",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "spender",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "value",
						"type": "uint256"
					}
				],
				"name": "approve",
				"outputs": [
					{
						"internalType": "bool",
						"name": "",
						"type": "bool"
					}
				],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "account",
						"type": "address"
					}
				],
				"name": "balanceOf",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "decimals",
				"outputs": [
					{
						"internalType": "uint8",
						"name": "",
						"type": "uint8"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "to",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					}
				],
				"name": "mint",
				"outputs": [],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "name",
				"outputs": [
					{
						"internalType": "string",
						"name": "",
						"type": "string"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "symbol",
				"outputs": [
					{
						"internalType": "string",
						"name": "",
						"type": "string"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "totalSupply",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "to",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "value",
						"type": "uint256"
					}
				],
				"name": "transfer",
				"outputs": [
					{
						"internalType": "bool",
						"name": "",
						"type": "bool"
					}
				],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "from",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "to",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "value",
						"type": "uint256"
					}
				],
				"name": "transferFrom",
				"outputs": [
					{
						"internalType": "bool",
						"name": "",
						"type": "bool"
					}
				],
				"stateMutability": "nonpayable",
				"type": "function"
			}
];

const AMM_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "provider",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amountA",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amountB",
                "type": "uint256"
            }
        ],
        "name": "LiquidityAdded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "tokenIn",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "tokenOut",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amountOut",
                "type": "uint256"
            }
        ],
        "name": "Swapped",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_tokenA",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_amountA",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "_tokenB",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_amountB",
                "type": "uint256"
            }
        ],
        "name": "addLiquidity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "tokenIn",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            }
        ],
        "name": "getAmountOut",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getReserves",
        "outputs": [
            {
                "internalType": "address",
                "name": "_tokenA",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_reserveA",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "_tokenB",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_reserveB",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_tokenA",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_tokenB",
                "type": "address"
            }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "initialized",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "reserveA",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "reserveB",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "tokenIn",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            }
        ],
        "name": "swap",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "tokenA",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "tokenB",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

async function detectArbitrageOpportunities() {
    // Connect to the blockchain (read-only is sufficient for monitoring)
    const provider = new ethers.providers.JsonRpcProvider('https://hashkeychain-testnet.alt.technology');


    const privatekey = ""
    
    // Contract addresses
    const ammA = '0xE6bD1F20389b8f9e3aa45F5bF5A3055eE3C90329';
    const ammB = '0xB8f1e8033628C1646BE2b2502e7D01f9115A0964';
    const usdt = '0x880eE68a9b6E51601c07196dff5BE1bf3764E8Ac';
    const whsk = '0xc6FA3F7710662Be44Fc10c6beeB4fF1575aADaB6';
    
    // Initialize contract instances (read-only)
    const ammAContract = new ethers.Contract(ammA, AMM_ABI, provider);
    const ammBContract = new ethers.Contract(ammB, AMM_ABI, provider);
    const usdtContract = new ethers.Contract(usdt, ERC20_ABI, provider);
    const whskContract = new ethers.Contract(whsk, ERC20_ABI, provider);
    
    try {
      // Get token symbols for better logging
      const usdtSymbol = await usdtContract.symbol();
      const whskSymbol = await whskContract.symbol();
      
      // Get token addresses in each AMM
      const ammAToken0 = await ammAContract.tokenA();
      const ammAToken1 = await ammAContract.tokenB();
      const ammBToken0 = await ammBContract.tokenA();
      const ammBToken1 = await ammBContract.tokenB();
      
      console.log(`AMM A contains: ${ammAToken0} and ${ammAToken1}`);
      console.log(`AMM B contains: ${ammBToken0} and ${ammBToken1}`);
      
      // Get USDT decimals for proper formatting
      const usdtDecimals = await usdtContract.decimals();
      console.log(`${usdtSymbol} decimals: ${usdtDecimals}`);
      
      // Get reserves from AMM A
      const reservesA = await ammAContract.getReserves();
      console.log(`AMM A Reserves: 
        - ${reservesA._tokenA}: ${ethers.utils.formatUnits(reservesA._reserveA, 18)}
        - ${reservesA._tokenB}: ${ethers.utils.formatUnits(reservesA._reserveB, usdtDecimals)}
      `);
      
      // Determine which reserve is USDT in AMM A
      const isUsdtTokenAInAmmA = reservesA._tokenA.toLowerCase() === usdt.toLowerCase();
      const usdtReserveA = isUsdtTokenAInAmmA ? reservesA._reserveA : reservesA._reserveB;
      const otherTokenA = isUsdtTokenAInAmmA ? reservesA._tokenB : reservesA._tokenA;
      const otherReserveA = isUsdtTokenAInAmmA ? reservesA._reserveB : reservesA._reserveA;
      
      // Get reserves from AMM B
      const reservesB = await ammBContract.getReserves();
      console.log(`AMM B Reserves: 
        - ${reservesB._tokenA}: ${ethers.utils.formatUnits(reservesB._reserveA, 18)}
        - ${reservesB._tokenB}: ${ethers.utils.formatUnits(reservesB._reserveB, usdtDecimals)}
      `);
      
      // Determine which reserve is USDT in AMM B
      const isUsdtTokenAInAmmB = reservesB._tokenA.toLowerCase() === usdt.toLowerCase();
      const usdtReserveB = isUsdtTokenAInAmmB ? reservesB._reserveA : reservesB._reserveB;
      const whskReserveB = isUsdtTokenAInAmmB ? reservesB._reserveB : reservesB._reserveA;
      
      // Calculate prices (as the ratio of reserves)
      // Price of USDT in terms of the other token in AMM A
      const priceUsdtInAmmA = otherReserveA.mul(ethers.BigNumber.from(10).pow(usdtDecimals)).div(usdtReserveA);
      
      // Price of USDT in terms of WHSK in AMM B
      const priceUsdtInAmmB = whskReserveB.mul(ethers.BigNumber.from(10).pow(usdtDecimals)).div(usdtReserveB);
      
      console.log(`${usdtSymbol} price in AMM A: ${ethers.utils.formatUnits(priceUsdtInAmmA, 18)} ${otherTokenA === whsk ? whskSymbol : 'Other Token'}`);
      console.log(`${usdtSymbol} price in AMM B: ${ethers.utils.formatUnits(priceUsdtInAmmB, 18)} ${whskSymbol}`);
      
      // Calculate price difference percentage
      const priceDiffBps = priceUsdtInAmmA.gt(priceUsdtInAmmB) 
        ? priceUsdtInAmmA.sub(priceUsdtInAmmB).mul(10000).div(priceUsdtInAmmB) 
        : priceUsdtInAmmB.sub(priceUsdtInAmmA).mul(10000).div(priceUsdtInAmmA);
      
      console.log(`Price difference: ${priceDiffBps.toNumber() / 100}%`);
      
      // Check if arbitrage is possible (considering gas costs)
      const minProfitableDiffBps = 50; // 0.5% minimum difference to be profitable
      if (priceDiffBps.gt(minProfitableDiffBps)) {
        console.log('⚠️ ARBITRAGE OPPORTUNITY DETECTED ⚠️');



        
        // Determine direction of arbitrage
        if (priceUsdtInAmmA.gt(priceUsdtInAmmB)) {
          console.log(`Buy ${usdtSymbol} from AMM B, sell to AMM A for profit`);
          
          // Calculate potential profit for a sample trade
          const sampleTradeAmount = ethers.utils.parseUnits('1000', usdtDecimals); // Example: 1000 USDT
          const amountOutB = sampleTradeAmount.mul(priceUsdtInAmmB).div(ethers.BigNumber.from(10).pow(usdtDecimals));
          const amountOutA = amountOutB.mul(priceUsdtInAmmA).div(ethers.BigNumber.from(10).pow(18));
          const profit = amountOutA.sub(sampleTradeAmount);
          
          console.log(`Estimated profit for 1000 ${usdtSymbol}: ${ethers.utils.formatUnits(profit, usdtDecimals)} ${usdtSymbol} (${profit.mul(100).div(sampleTradeAmount)}%)`);
        } else {
          console.log(`Buy ${usdtSymbol} from AMM A, sell to AMM B for profit`);
          
          // Calculate potential profit for a sample trade
          const sampleTradeAmount = ethers.utils.parseUnits('1000', usdtDecimals); // Example: 1000 USDT
          const amountOutA = sampleTradeAmount.mul(priceUsdtInAmmA).div(ethers.BigNumber.from(10).pow(usdtDecimals));
          const amountOutB = amountOutA.mul(priceUsdtInAmmB).div(ethers.BigNumber.from(10).pow(18));
          const profit = amountOutB.sub(sampleTradeAmount);
          
          console.log(`Estimated profit for 1000 ${usdtSymbol}: ${ethers.utils.formatUnits(profit, usdtDecimals)} ${usdtSymbol} (${profit.mul(100).div(sampleTradeAmount)}%)`);
        }
      } else {
        console.log('No profitable arbitrage opportunity at the moment');
      }
      
    } catch (error) {
      console.error('Error detecting arbitrage opportunities:', error);
    }
  }
  
  // Set up a recurring check
  async function startArbitrageMonitoring(intervalMs = 10000) {
    console.log('Starting arbitrage opportunity monitoring...');
    console.log('---------------------------------------------');
    
    // Initial check
    await detectArbitrageOpportunities();
    
    // Set up recurring checks
    setInterval(async () => {
      console.log('\n--- Checking for arbitrage opportunities ---');
      await detectArbitrageOpportunities();
      console.log('---------------------------------------------');
    }, intervalMs);
  }


async function x(){


}
  
  // Start the monitoring
  startArbitrageMonitoring();