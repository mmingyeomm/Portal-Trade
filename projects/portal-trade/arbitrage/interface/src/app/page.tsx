"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import hskIcon from "../assets/hsk.svg";
import tethIcon from "../assets/teth.svg";
import Image from "next/image";
import type { StaticImageData } from "next/image";

interface TokenTransfer {
  token: {
    name: string;
    symbol: string;
  };
  total: {
    value: string;
  };
}

interface TransactionDetail {
  hash: string;
  token_transfers: TokenTransfer[];
  timestamp: string;
}

const targetAddress = "0x8EC3C8D7a81D8e808788fad3a6C56ba698f35626";

const tokenIcons: Record<string, StaticImageData> = {
  WHSK: hskIcon,
  USDT: tethIcon,
};

export default function Page() {
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);

  useEffect(() => {
    const fetchArbitrageTransactions = async () => {
      try {
        const listRes = await fetch(
          `https://hashkeychain-testnet-explorer.alt.technology/api/v2/addresses/${targetAddress}/transactions?filter=to%20%7C%20from`
        );
        const listData = await listRes.json();
        const hashes: string[] = listData.items
          .filter((tx: { method: string }) => tx.method === "0xd004f0f7")
          .map((tx: { hash: string }) => tx.hash);

        const detailed: TransactionDetail[] = await Promise.all(
          hashes.map(async (hash) => {
            const res = await fetch(
              `https://hashkeychain-testnet-explorer.alt.technology/api/v2/transactions/${hash}`
            );
            const data = await res.json();
            return {
              hash: data.hash,
              token_transfers: data.token_transfers || [],
              timestamp: data.timestamp,
            };
          })
        );

        setTransactions(detailed);
      } catch (error) {
        console.error("Error fetching arbitrage transactions:", error);
      }
    };

    fetchArbitrageTransactions();
  }, []);

  return (
    <div className={styles.container}>
      <h1>Arbitrage Scanner</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tx Hash</th>
            <th>Token</th>
            <th>Amount</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) =>
            tx.token_transfers.map((transfer, idx) => (
              <tr key={`${tx.hash}-${idx}`}>
                {idx === 0 && (
                  <td rowSpan={tx.token_transfers.length}>
                    <a
                      href={`https://hashkeychain-testnet-explorer.alt.technology/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {tx.hash.slice(0, 10)}...
                    </a>
                  </td>
                )}
                <td>
                  <div className={styles.tokenCell}>
                    {tokenIcons[transfer.token.symbol] && (
                      <Image
                        src={tokenIcons[transfer.token.symbol]}
                        alt={transfer.token.symbol}
                        width={16}
                        height={16}
                      />
                    )}
                    <span>{transfer.token.name}</span>
                  </div>
                </td>

                <td>{transfer.total.value}</td>
                {idx === 0 && (
                  <td rowSpan={tx.token_transfers.length}>
                    {new Date(tx.timestamp).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
