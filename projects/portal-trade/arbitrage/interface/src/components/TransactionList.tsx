import React from "react";
import { ArbitrageTransaction } from "../types";
import TransactionItem from "./TransactionItem";
import styles from "../app/page.module.css";

interface TransactionListProps {
  transactions: ArbitrageTransaction[][]; // 배열의 배열
}

export default function TransactionList({
  transactions,
}: TransactionListProps) {
  return (
    <div className="container">
      <div className={styles.tableHeader}>
        <div>Profit</div>
        <div>Percentage</div>
        <div>Pair</div>
        <div>DEX</div>
        <div>Time</div>
      </div>

      <div>
        {transactions.map((txGroup, idx) => (
          <TransactionItem key={idx} transactions={txGroup} />
        ))}

        {transactions.length === 0 && (
          <div
            className="card"
            style={{ marginTop: "1rem", textAlign: "center" }}
          >
            <p className="muted">No transactions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
