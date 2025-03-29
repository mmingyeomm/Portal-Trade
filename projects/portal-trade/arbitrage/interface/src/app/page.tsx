"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Header from "../components/Header";
import Dashboard from "../components/Dashboard";
import TransactionList from "../components/TransactionList";
import { ArbitrageTransaction } from "../types";
import { mockTransactions } from "@/mocks/mockTransactions";

export default function Home() {
  const [transactions] = useState<ArbitrageTransaction[][]>(mockTransactions);

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
