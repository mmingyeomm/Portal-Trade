import React from "react";
import { ArbitrageTransaction } from "@/types";
import styles from "../app/page.module.css";

interface TransactionItemProps {
  transactions: ArbitrageTransaction[]; // length: 3
}

export default function TransactionItem({
  transactions,
}: TransactionItemProps) {
  if (transactions.length < 3) return null;

  const [tx1, tx2, tx3] = transactions;

  // 계산
  const profitRaw = tx3.amount - tx1.amount;
  const profit = parseFloat(profitRaw.toFixed(6));
  const percentage = parseFloat(((profitRaw / tx1.amount) * 100).toFixed(2));
  const isProfitable = profit > 0;
  const profitClass = isProfitable ? "positive" : "negative";

  const tokenPair = `${tx1.tokenName} / ${tx2.tokenName}`;
  const dexPair = `${tx1.dex} / ${tx2.dex}`;

  const date = new Date(tx3.timestamp);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={styles.item}>
      <div className={`${styles.profit} ${profitClass}`} data-label="Profit">
        {`${isProfitable ? "+" : ""}${profit} ${tx1.tokenName.split("/")[0]}`}
      </div>

      <div
        className={`${styles.percentage} ${profitClass}`}
        data-label="Percentage"
      >
        {`${isProfitable ? "+" : ""}${percentage}%`}
      </div>

      <div className={styles.coins} data-label="Pair">
        <span className={styles.coinPair}>{tokenPair}</span>
      </div>

      <div className={styles.dex} data-label="DEX">
        {dexPair}
      </div>

      <div className={styles.timestamp} data-label="Time">
        {formattedDate}, {formattedTime}
      </div>
    </div>
  );
}
