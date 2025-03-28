import React from "react";
import { ArbitrageTransaction } from "../types/index";
import styles from "../app/page.module.css";

interface DashboardProps {
  transactions: ArbitrageTransaction[];
}

export default function Dashboard({ transactions }: DashboardProps) {
  // Calculate statistics for each strategy

  // Get daily profit data for the last 7 days
  const getDailyProfits = () => {
    const today = new Date();
    const dailyData: { day: string; profit: number }[] = [];

    // Create last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const dayStr = date.toLocaleDateString("en-US", { weekday: "short" });
      dailyData.push({ day: dayStr, profit: 0 });
    }

    // Fill in profits
    transactions.forEach((tx) => {
      const txDate = new Date(tx.timestamp);
      const dayIndex =
        6 -
        Math.floor(
          (today.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24)
        );

      if (dayIndex >= 0 && dayIndex < 7) {
        dailyData[dayIndex].profit += tx.profit.amount;
      }
    });

    return dailyData;
  };

  const dailyProfits = getDailyProfits();
  const maxProfit = Math.max(
    ...dailyProfits.map((d) => Math.abs(d.profit)),
    0.001
  );

  // Get most profitable DEX
  const dexProfits = transactions.reduce((acc, tx) => {
    const { dex, profit } = tx;
    acc[dex] = (acc[dex] || 0) + profit.amount;
    return acc;
  }, {} as Record<string, number>);

  const topDex = Object.entries(dexProfits).sort((a, b) => b[1] - a[1])[0];

  // Calculate the currency for display
  //const currency =
  //transactions.length > 0 ? transactions[0].profit.currency : "ETH";

  return (
    <div className={styles.dashboard}>
      <div className="container">
        <div className={styles.dashboardGrid}>
          {/* Chart section */}
          <div className={`${styles.dashboardCard} ${styles.chart}`}>
            <h3>7-Day Profit Trend</h3>
            <div className={styles.barChart}>
              {dailyProfits.map((day, i) => (
                <div key={i} className={styles.barContainer}>
                  <div
                    className={`${styles.bar} ${
                      day.profit >= 0 ? styles.barPositive : styles.barNegative
                    }`}
                    style={{
                      height: `${Math.min(
                        (Math.abs(day.profit) / maxProfit) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                  <div className={styles.barLabel}>{day.day}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className={`${styles.dashboardCard} ${styles.quickStats}`}>
            <h3>Quick Stats</h3>
            <div className={styles.statGrid}>
              <div className={styles.quickStat}>
                <div className={styles.statCircle}>
                  <span className={styles.statIcon}>⚡</span>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {transactions.length}
                  </span>
                  <span className={styles.statName}>Total Trades</span>
                </div>
              </div>

              <div className={styles.quickStat}>
                <div className={styles.statCircle}>
                  <span className={styles.statIcon}>🔄</span>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {topDex ? topDex[0] : "N/A"}
                  </span>
                  <span className={styles.statName}>Top DEX</span>
                </div>
              </div>

              <div className={styles.quickStat}>
                <div className={styles.statCircle}>
                  <span className={styles.statIcon}>📈</span>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {transactions
                      .filter((tx) => tx.profit.amount > 0)
                      .reduce(
                        (max, tx) =>
                          tx.profit.amount > max ? tx.profit.amount : max,
                        0
                      )
                      .toFixed(6)}
                  </span>
                  <span className={styles.statName}>Highest Profit</span>
                </div>
              </div>

              <div className={styles.quickStat}>
                <div className={styles.statCircle}>
                  <span className={styles.statIcon}>⏱️</span>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {transactions.length > 0
                      ? new Date(
                          Math.max(
                            ...transactions.map((tx) =>
                              new Date(tx.timestamp).getTime()
                            )
                          )
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </span>
                  <span className={styles.statName}>Latest Trade</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
