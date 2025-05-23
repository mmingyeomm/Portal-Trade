"use client";

import React, { useEffect, useState } from "react";

import { ethers, Signer } from "ethers";
import { SourceTextModule } from "vm";

const tokenABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_symbol",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_initialSupply",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "allowance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "ERC20InsufficientAllowance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "ERC20InsufficientBalance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "ERC20InvalidApprover",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "ERC20InvalidReceiver",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "ERC20InvalidSender",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "ERC20InvalidSpender",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const ammABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "provider",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountA",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountB",
        type: "uint256",
      },
    ],
    name: "LiquidityAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "tokenIn",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountIn",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "tokenOut",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountOut",
        type: "uint256",
      },
    ],
    name: "Swapped",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_tokenA",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amountA",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_tokenB",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amountB",
        type: "uint256",
      },
    ],
    name: "addLiquidity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "tokenIn",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountIn",
        type: "uint256",
      },
    ],
    name: "getAmountOut",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getReserves",
    outputs: [
      {
        internalType: "address",
        name: "_tokenA",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_reserveA",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_tokenB",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_reserveB",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_tokenA",
        type: "address",
      },
      {
        internalType: "address",
        name: "_tokenB",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "initialized",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "reserveA",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "reserveB",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "tokenIn",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountIn",
        type: "uint256",
      },
    ],
    name: "swap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenA",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenB",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const tokenA_Address = "0xC9Fa092cC3788E34f1a56031d536d25897F0F242"; //USDT
const tokenB_Address = "0xb424976B6776e373f3F3163076B4351EC06453F5"; //WHSK
const ammAddress = "0xc4ccB11F9E4D6a90D5769B0a6f8a4193D4C12D02"; //dexB

interface SwapIconProps {
  className?: string;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

const SwapIcon: React.FC<SwapIconProps> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l4 4 4-4" />
    <path d="M12 8v8" />
  </svg>
);

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2 text-center rounded-lg font-medium transition-colors
      ${
        active
          ? "bg-yellow-500 text-white"
          : "text-gray-800 hover:text-white hover:bg-yellow-700"
      }`}
  >
    {children}
  </button>
);

const TokenInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  tokenSymbol: string;
}> = ({ label, value, onChange, tokenSymbol }) => (
  <div className="bg-yellow-100 rounded-xl p-4 mb-2">
    <div className="flex justify-between mb-2">
      <label className="text-gray-800 text-sm">{label}</label>
    </div>
    <div className="flex gap-4">
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onWheel={(e) => e.currentTarget.blur()}
        placeholder="0.0"
        className="bg-transparent text-2xl text-black outline-none w-full"
      />
      <button className="bg-yellow-500 hover:bg-yellow-700 text-white px-4 py-2 rounded-xl font-medium">
        {tokenSymbol}
      </button>
    </div>
  </div>
);

export default function DexPage() {
  const [activeTab, setActiveTab] = useState<"swap" | "liquidity">("swap");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [signer, setSigner] = useState<Signer | null>(null);
  const [token1Amount, setToken1Amount] = useState("");
  const [token2Amount, setToken2Amount] = useState("");
  const [reserve0, setReserve0] = useState<string>("0");
  const [reserve1, setReserve1] = useState<string>("0");
  const [x, setX] = useState("");

  let provider: any;

  useEffect(() => {
    const initializeEthereum = async () => {
      if (window.ethereum == null) {
        console.log("MetaMask not installed; using read-only defaults");
        provider = ethers.getDefaultProvider();
      } else {
        provider = new ethers.BrowserProvider(window.ethereum);
        setSigner(await provider.getSigner());

        fetchReserves();
      }
    };

    initializeEthereum();
  }, []);

  const fetchReserves = async () => {
    try {
      if (!provider) {
        provider = new ethers.BrowserProvider(window.ethereum);
      }

      const contract = new ethers.Contract(ammAddress, ammABI, provider);

      const [res0, res1] = await Promise.all([
        contract.reserveA(),
        contract.reserveB(),
      ]);

      console.log(res0, res1);

      setReserve0(res0);
      setReserve1(res1);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!fromAmount || isNaN(Number(fromAmount))) {
      setX("");
      return;
    }

    const a = parseFloat(fromAmount);
    const r0 = parseFloat(reserve0);
    const r1 = parseFloat(reserve1);

    if (r0 > 0 && r1 > 0) {
      const outAmount = (a * r0) / r1;
      setX(outAmount.toFixed(4));
    }
  }, [fromAmount, reserve0, reserve1]);
  const handleSwap = async () => {
    try {
      if (!signer) {
        console.log("wallet not connected");
        return;
      }
      const contract = new ethers.Contract(ammAddress, ammABI, provider);

      const tokenAContract = new ethers.Contract(
        tokenA_Address,
        tokenABI,
        signer
      );
      const ammContract = new ethers.Contract(ammAddress, ammABI, signer);

      const tx1 = await tokenAContract.approve(ammAddress, fromAmount);

      await tx1.wait();

      console.log("tx1 complete");

      const tx2 = await ammContract.swap(tokenA_Address, fromAmount);

      await tx2.wait();

      console.log("tx2 complete");
    } catch (error) {
      console.log("error swapping tokens");
    }
  };

  const handleAddLiquidity = async () => {};
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-white flex items-center justify-center p-4">
      <div className="bg-yellow-50 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-yellow-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-yellow-900 mb-4">DEX B</h1>

          {/* Tab Buttons */}
          <div className="flex gap-2 bg-yellow-100 p-1 rounded-lg mb-6">
            <TabButton
              active={activeTab === "swap"}
              onClick={() => setActiveTab("swap")}
            >
              Swap
            </TabButton>
            <TabButton
              active={activeTab === "liquidity"}
              onClick={() => setActiveTab("liquidity")}
            >
              Add Liquidity
            </TabButton>
          </div>

          {activeTab === "swap" ? (
            /* Swap Interface */
            <>
              <TokenInput
                label="From"
                value={fromAmount}
                onChange={setFromAmount}
                tokenSymbol="USDT"
              />

              <div className="flex justify-center -my-2 relative z-10">
                <button className="bg-yellow-50 rounded-full p-1 border border-yellow-200 hover:border-yellow-400 transition-colors">
                  <SwapIcon className="text-yellow-500" />
                </button>
              </div>

              <TokenInput
                label="To"
                value={x}
                onChange={setToAmount}
                tokenSymbol="WHSK"
              />

              <button
                onClick={handleSwap}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-xl font-bold text-lg transition-colors mt-4"
              >
                Swap
              </button>
            </>
          ) : (
            /* Add Liquidity Interface */
            <>
              <TokenInput
                label="USDT"
                value={token1Amount}
                onChange={setToken1Amount}
                tokenSymbol="USDT"
              />

              <TokenInput
                label="WHSK"
                value={token2Amount}
                onChange={setToken2Amount}
                tokenSymbol="WHSK"
              />

              {/* <div className="bg-yellow-100 rounded-xl p-4 mb-6">
                <h3 className="text-yellow-900 font-medium mb-2">
                  Pool Information
                </h3>
                <div className="text-yellow-700 text-sm space-y-1">
                  <p>
                    Pool Share: {token1Amount && token2Amount ? "0.001%" : "-"}
                  </p>
                  <p>HSK per USDT: 1.3</p>
                  <p>USDT per WHSK: 0.7</p>
                </div>
              </div> */}

              <button
                onClick={handleAddLiquidity}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-xl font-bold text-lg transition-colors"
              >
                Add Liquidity
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
