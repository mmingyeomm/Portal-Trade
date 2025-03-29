import React from "react";
import { ArbitrageTransaction } from "../types";
import styles from "../app/page.module.css";

interface HeaderProps {
  transactions: ArbitrageTransaction[][]; // 배열의 배열
}

export default function Header({ transactions }: HeaderProps) {
  // 총 수익 계산
  const totalProfit = transactions.reduce((sum, group) => {
    if (group.length === 3) {
      const profit = group[2].amount - group[0].amount;
      return sum + profit;
    }
    return sum;
  }, 0);

  const profitCurrency =
    transactions.length > 0
      ? transactions[0][0].tokenName.split("/")[0]
      : "ETH";

  // 성공 거래 수 계산
  const successfulTrades = transactions.filter((group) => {
    if (group.length === 3) {
      const profit = group[2].amount - group[0].amount;
      return profit > 0;
    }
    return false;
  }).length;

  const successRate =
    transactions.length > 0
      ? ((successfulTrades / transactions.length) * 100).toFixed(1)
      : "0";

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Arbitrage Profit History</h1>

          <div className={styles.headerStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Profit</span>
              <span
                className={`${styles.statValue} ${
                  totalProfit > 0 ? "positive" : "negative"
                }`}
              >
                {totalProfit.toFixed(6)} {profitCurrency}
              </span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Success Rate</span>
              <span className={styles.statValue}>{successRate}%</span>
            </div>

            <div className={styles.statItem}></div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Transactions</span>
              <span className={styles.statValue}>{transactions.length}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
