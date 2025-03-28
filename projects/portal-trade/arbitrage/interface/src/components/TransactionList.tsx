import React from "react";
import { ArbitrageTransaction } from "../types";
import ArbitrageCard from "./ArbitrageCard";
import styles from "../app/page.module.css";

interface TransactionListProps {
  transactions: ArbitrageTransaction[];
}

export default function TransactionList({
  transactions,
}: TransactionListProps) {
  return (
    <div className="container">
      <div className={styles.tableHeader}>
        <div>DEX</div>
        <div>Pair</div>
        <div>Profit</div>
        <div>Time</div>
      </div>

      <div>
        {transactions.map((transaction) => (
          <ArbitrageCard key={transaction.id} transaction={transaction} />
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
