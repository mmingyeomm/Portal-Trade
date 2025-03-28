import React from "react";
import { ArbitrageTransaction } from "../types";
import styles from "../app/page.module.css";

interface HeaderProps {
  transactions: ArbitrageTransaction[];
}

export default function Header({ transactions }: HeaderProps) {
  // Calculate total profit
  const totalProfit = transactions.reduce(
    (sum, tx) => sum + tx.profit.amount,
    0
  );
  const profitCurrency =
    transactions.length > 0 ? transactions[0].profit.currency : "ETH";

  // Calculate success rate
  const successfulTrades = transactions.filter(
    (tx) => tx.profit.amount > 0
  ).length;
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
