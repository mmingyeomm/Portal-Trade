export interface ArbitrageTransaction {
  id: string;
  dex: string;
  coinPair: string;
  profit: {
    amount: number;
    currency: string;
  };
  timestamp: string;
}
