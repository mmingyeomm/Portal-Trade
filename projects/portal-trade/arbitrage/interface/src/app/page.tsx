"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import TransactionList from "@/components/TransactionList";
import { ArbitrageTransaction } from "@/types";

// Mock data for arbitrage transactions
const mockTransactions: ArbitrageTransaction[] = [
  {
    id: "1",
    dex: "Uniswap",
    coinPair: "ETH/USDT",
    profit: {
      amount: 0.0042,
      currency: "ETH",
    },
    timestamp: "2025-03-25T14:32:15Z",
  },
  {
    id: "2",
    dex: "SushiSwap",
    coinPair: "WBTC/USDC",
    profit: {
      amount: 0.00089,
      currency: "ETH",
    },
    timestamp: "2025-03-25T12:18:42Z",
  },
  {
    id: "3",
    dex: "PancakeSwap",
    coinPair: "BNB/BUSD",
    profit: {
      amount: 0.0031,
      currency: "ETH",
    },
    timestamp: "2025-03-25T10:05:33Z",
  },
  {
    id: "4",
    dex: "Curve",
    coinPair: "ETH/USDC",
    profit: {
      amount: 0.0056,
      currency: "ETH",
    },
    timestamp: "2025-03-24T22:47:11Z",
  },
  {
    id: "5",
    dex: "dYdX",
    coinPair: "ETH/DAI",
    profit: {
      amount: -0.0018,
      currency: "ETH",
    },
    timestamp: "2025-03-24T18:31:27Z",
  },
  {
    id: "6",
    dex: "Balancer",
    coinPair: "LINK/ETH",
    profit: {
      amount: 0.0027,
      currency: "ETH",
    },
    timestamp: "2025-03-24T15:22:09Z",
  },
  {
    id: "7",
    dex: "Uniswap",
    coinPair: "ARB/USDC",
    profit: {
      amount: 0.0038,
      currency: "ETH",
    },
    timestamp: "2025-03-24T12:11:54Z",
  },
  {
    id: "8",
    dex: "1inch",
    coinPair: "ETH/USDT",
    profit: {
      amount: -0.00095,
      currency: "ETH",
    },
    timestamp: "2025-03-23T23:48:37Z",
  },
];

export default function Home() {
  const [transactions] = useState<ArbitrageTransaction[]>(mockTransactions);

  return (
    <div className={styles.page}>
      <Header transactions={transactions} />
      <Dashboard transactions={transactions} />

      <main className={styles.main}>
        <TransactionList transactions={transactions} />
      </main>
    </div>
  );
}
