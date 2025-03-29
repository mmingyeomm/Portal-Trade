export interface ArbitrageTransaction {
  txhash: string;
  tokenName: string;
  dex: string; //e.g., DexA (해당 tx에서 arbitrage 주소가 거래한 dex)
  amount: number;
  timestamp: string;
}
