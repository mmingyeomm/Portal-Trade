import React from "react";
import { ArbitrageTransaction } from "../types";
import styles from "../app/page.module.css";

interface TransactionItemProps {
  transaction: ArbitrageTransaction;
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  // Determine color based on profit amount
  const isProfitable = transaction.profit.amount > 0;
  const profitClass = isProfitable ? "positive" : "negative";

  // Format profit amount with currency symbol
  const formattedProfit = `${
    isProfitable ? "+" : ""
  }${transaction.profit.amount.toFixed(6)} ${transaction.profit.currency}`;

  // Format timestamp
  const date = new Date(transaction.timestamp);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Get first letter of DEX name for icon
  const dexInitial = transaction.dex.charAt(0).toUpperCase();

  return (
    <div className={styles.item}>
      <div className={styles.dex} data-label="DEX">
        <div className={styles.dexIcon}>{dexInitial}</div>
        {transaction.dex}
      </div>

      <div className={styles.coins} data-label="Pair">
        <span className={styles.coinPair}>{transaction.coinPair}</span>
      </div>

      <div className={`${styles.profit} ${profitClass}`} data-label="Profit">
        {formattedProfit}
      </div>

      <div className={styles.timestamp} data-label="Time">
        {formattedDate}, {formattedTime}
      </div>
    </div>
  );
}
