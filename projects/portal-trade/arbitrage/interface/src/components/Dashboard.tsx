import React from "react";
import { ArbitrageTransaction } from "../types";
import styles from "../app/page.module.css";

interface DashboardProps {
  transactions: ArbitrageTransaction[][]; // 배열의 배열
}

export default function Dashboard({ transactions }: DashboardProps) {
  const getHourlyProfits = () => {
    const now = new Date();
    const hourlyData: { hour: string; profit: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const hourDate = new Date(now);
      hourDate.setHours(now.getHours() - i, 0, 0, 0);

      const hourLabel = hourDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        hour12: true,
      });

      hourlyData.push({ hour: hourLabel, profit: 0 });
    }

    transactions.forEach((group) => {
      if (group.length === 3) {
        const timestamp = new Date(group[2].timestamp);
        const hoursAgo = Math.floor(
          (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60)
        );

        if (hoursAgo >= 0 && hoursAgo < 7) {
          const index = 6 - hoursAgo;
          const profit = group[2].amount - group[0].amount;
          hourlyData[index].profit += profit;
        }
      }
    });

    return hourlyData;
  };

  const hourlyProfits = getHourlyProfits();
  const maxProfit = Math.max(
    ...hourlyProfits.map((d) => Math.abs(d.profit)),
    0.001
  );

  const flatten = transactions.filter((group) => group.length === 3);
  const topDexMap = flatten.reduce((acc, group) => {
    const dex = group[2].dex;
    const profit = group[2].amount - group[0].amount;
    acc[dex] = (acc[dex] || 0) + profit;
    return acc;
  }, {} as Record<string, number>);

  const topDex = Object.entries(topDexMap).sort((a, b) => b[1] - a[1])[0];

  const highestProfit = flatten.reduce((max, group) => {
    const profit = group[2].amount - group[0].amount;
    return profit > max ? profit : max;
  }, 0);

  const latestTimestamp = flatten.reduce((latest, group) => {
    const ts = new Date(group[2].timestamp).getTime();
    return ts > latest ? ts : latest;
  }, 0);

  return (
    <div className={styles.dashboard}>
      <div className="container">
        <div className={styles.dashboardGrid}>
          {/* Chart section */}
          <div className={`${styles.dashboardCard} ${styles.chart}`}>
            <h3>Last 7 Hours Profit Trend</h3>
            <div
              className={styles.barChart}
              style={{
                overflowX: "auto",
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-end",
              }}
            >
              {hourlyProfits.map((hour, i) => (
                <div
                  key={i}
                  className={styles.barContainer}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    className={`${styles.bar} ${
                      hour.profit >= 0 ? styles.barPositive : styles.barNegative
                    }`}
                    style={{
                      height: `${Math.min(
                        (Math.abs(hour.profit) / maxProfit) * 100,
                        100
                      )}%`,
                      width: "12px",
                    }}
                  ></div>
                  <div
                    className={styles.barLabel}
                    style={{
                      marginTop: "0.25rem",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hour.hour}
                  </div>
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
                  <span className={styles.statValue}>{flatten.length}</span>
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
                    {highestProfit.toFixed(6)}
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
                    {latestTimestamp
                      ? new Date(latestTimestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
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
