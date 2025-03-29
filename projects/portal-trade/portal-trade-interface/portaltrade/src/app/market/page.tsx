'use client';

import { useState } from 'react';
import Link from 'next/link';

// Market item type definition
interface Market {
  id: number;
  name: string;
  symbol: string;
  totalSupply: string;
  totalBorrow: string;
  liquidityRate: string;
  supplyAPY: string;
  borrowAPY: string;
  price: string;
}

// Sortable column type definition
type SortableColumn = keyof Omit<Market, 'id'>;

// Mock data
const mockMarkets: Market[] = [
  { 
    id: 1, 
    name: 'Ethereum', 
    symbol: 'ETH', 
    totalSupply: '$58.2M', 
    totalBorrow: '$32.4M',
    liquidityRate: '78%',
    supplyAPY: '3.2%',
    borrowAPY: '4.5%',
    price: '$2,198.45',
  },
  { 
    id: 2, 
    name: 'Bitcoin', 
    symbol: 'BTC', 
    totalSupply: '$124.7M', 
    totalBorrow: '$78.3M',
    liquidityRate: '63%',
    supplyAPY: '2.8%',
    borrowAPY: '4.1%',
    price: '$61,250.72',
  },
  { 
    id: 3, 
    name: 'Solana', 
    symbol: 'SOL', 
    totalSupply: '$22.6M', 
    totalBorrow: '$14.5M',
    liquidityRate: '64%',
    supplyAPY: '4.1%',
    borrowAPY: '5.6%',
    price: '$88.35',
  },
  { 
    id: 4, 
    name: 'Tether', 
    symbol: 'USDT', 
    totalSupply: '$142.8M', 
    totalBorrow: '$96.5M',
    liquidityRate: '68%',
    supplyAPY: '3.8%',
    borrowAPY: '5.3%',
    price: '$1.00',
  },
  { 
    id: 5, 
    name: 'USD Coin', 
    symbol: 'USDC', 
    totalSupply: '$134.2M', 
    totalBorrow: '$89.7M',
    liquidityRate: '67%',
    supplyAPY: '3.7%',
    borrowAPY: '5.2%',
    price: '$1.00',
  },
  { 
    id: 6, 
    name: 'Cardano', 
    symbol: 'ADA', 
    totalSupply: '$18.5M', 
    totalBorrow: '$9.8M',
    liquidityRate: '53%',
    supplyAPY: '4.3%',
    borrowAPY: '5.8%',
    price: '$0.56',
  },
  { 
    id: 7, 
    name: 'Polygon', 
    symbol: 'MATIC', 
    totalSupply: '$14.7M', 
    totalBorrow: '$8.3M',
    liquidityRate: '56%',
    supplyAPY: '4.5%',
    borrowAPY: '6.1%',
    price: '$0.82',
  },
  { 
    id: 8, 
    name: 'Dogecoin', 
    symbol: 'DOGE', 
    totalSupply: '$12.4M', 
    totalBorrow: '$6.2M',
    liquidityRate: '50%',
    supplyAPY: '4.8%',
    borrowAPY: '6.4%',
    price: '$0.14',
  }
];

export default function Market() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortableColumn>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sort and search functionality
  const filteredMarkets = mockMarkets
    .filter(market => 
      market.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      market.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (column: SortableColumn) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 fade-in">
        <h1 className="text-3xl font-bold">Markets</h1>
        <div className="w-full md:w-auto fade-in delay-100">
          <input
            type="text"
            placeholder="Search assets..."
            className="px-4 py-2 border border-[var(--card-border)] rounded-full w-full md:w-64 bg-transparent shine"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card p-6 overflow-hidden fade-in delay-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--card-border)]">
            <thead>
              <tr className="fade-in delay-300">
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-opacity-70 cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Asset 
                  {sortBy === 'name' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70 cursor-pointer"
                   onClick={() => handleSort('price')}
                >
                  Price
                  {sortBy === 'price' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70 cursor-pointer"
                   onClick={() => handleSort('totalSupply')}
                >
                  Total Supply
                  {sortBy === 'totalSupply' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70 cursor-pointer"
                   onClick={() => handleSort('totalBorrow')}
                >
                  Total Borrowed
                  {sortBy === 'totalBorrow' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70 cursor-pointer"
                   onClick={() => handleSort('liquidityRate')}
                >
                  Utilization
                  {sortBy === 'liquidityRate' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70 cursor-pointer"
                   onClick={() => handleSort('supplyAPY')}
                >
                  Supply APY
                  {sortBy === 'supplyAPY' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70 cursor-pointer"
                   onClick={() => handleSort('borrowAPY')}
                >
                  Borrow APY
                  {sortBy === 'borrowAPY' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filteredMarkets.map((market, idx) => (
                <tr key={market.id} className={`hover:bg-[var(--card-border)]/5 transition-colors fade-in delay-${(idx + 4) * 100}`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--pastel-blue)] pulse"></div>
                      <div>
                        <div className="font-medium">{market.name}</div>
                        <div className="text-sm opacity-70">{market.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-medium">{market.price}</td>
                  <td className="px-4 py-4 text-right">{market.totalSupply}</td>
                  <td className="px-4 py-4 text-right">{market.totalBorrow}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end">
                      <div className="w-16 bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.05)] rounded-full h-2 mr-2 overflow-hidden">
                        <div 
                          className="bg-[var(--pastel-green)] h-2 rounded-full" 
                          style={{ width: market.liquidityRate, animation: 'growWidth 1.5s ease-out forwards' }}
                        ></div>
                      </div>
                      <span>{market.liquidityRate}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-[var(--pastel-green)]">{market.supplyAPY}</td>
                  <td className="px-4 py-4 text-right text-[var(--pastel-pink)]">{market.borrowAPY}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/supply?asset=${market.symbol}`} className="px-3 py-1 text-sm rounded-full bg-[var(--pastel-blue)]/10 text-[var(--pastel-blue)] hover:bg-[var(--pastel-blue)]/20 transition-colors shine">
                        Supply
                      </Link>
                      <Link href={`/borrow?asset=${market.symbol}`} className="px-3 py-1 text-sm rounded-full bg-[var(--pastel-pink)]/10 text-[var(--pastel-pink)] hover:bg-[var(--pastel-pink)]/20 transition-colors shine">
                        Borrow
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[var(--pastel-blue)]/10 to-[var(--pastel-pink)]/10 p-8 rounded-2xl border border-[var(--card-border)] fade-in delay-300">
        <h2 className="text-xl font-bold mb-4">Market Information</h2>
        <p className="opacity-80 mb-6">
          Portal Trade provides liquidity for various crypto assets. You can supply assets to earn interest or borrow against your collateral.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-4 bg-white/50 dark:bg-black/30 backdrop-blur-sm">
            <p className="text-sm opacity-70 mb-1">Assets Supported</p>
            <p className="text-xl font-bold">12</p>
          </div>
          <div className="card p-4 bg-white/50 dark:bg-black/30 backdrop-blur-sm">
            <p className="text-sm opacity-70 mb-1">Total Value Locked</p>
            <p className="text-xl font-bold">$528.1M</p>
          </div>
          <div className="card p-4 bg-white/50 dark:bg-black/30 backdrop-blur-sm">
            <p className="text-sm opacity-70 mb-1">Average Supply APY</p>
            <p className="text-xl font-bold text-[var(--pastel-green)]">3.9%</p>
          </div>
          <div className="card p-4 bg-white/50 dark:bg-black/30 backdrop-blur-sm">
            <p className="text-sm opacity-70 mb-1">Average Borrow APY</p>
            <p className="text-xl font-bold text-[var(--pastel-pink)]">5.4%</p>
          </div>
        </div>
      </div>
    </div>
  );
} 