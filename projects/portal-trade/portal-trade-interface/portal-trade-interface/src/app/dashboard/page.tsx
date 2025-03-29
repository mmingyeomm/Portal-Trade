'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';

// Mock data
const mockSuppliedAssets = [
  { id: 1, name: 'HashKey Token', symbol: 'WHSK', amount: '100.5', value: '$4,020', apy: '5.00%' },
  { id: 2, name: 'Tether', symbol: 'USDT', amount: '2,500', value: '$2,500', apy: '5.00%' },
];

const mockBorrowedAssets = [
  { id: 1, name: 'Tether', symbol: 'USDT', amount: '1,200', value: '$1,200', apr: '5.6%', health: '68%' },
];

// APY information
const apyInfo = {
  deposits: {
    WHSK: '5.00%',
    USDT: '5.00%'
  },
  arbitrage: {
    WHSK: '5.32%',
    USDT: '5.32%'
  }
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { walletState, connectWallet, account } = useWeb3();
  const [showApyDetails, setShowApyDetails] = useState(false);
  
  // Reflect wallet connection status in APY information
  const isWalletConnected = walletState === 'connected';

  // States for actual data replacement
  const [suppliedAssets, setSuppliedAssets] = useState(mockSuppliedAssets);
  const [borrowedAssets, setBorrowedAssets] = useState(mockBorrowedAssets);

  // Modal state
  const [isApyModalOpen, setIsApyModalOpen] = useState(false);

  // Effect to fetch data when wallet is connected
  useEffect(() => {
    if (isWalletConnected) {
      // Fetch real data when wallet is connected
      // API calls or contract data retrieval
      console.log('Wallet connected, account:', account);
      
      // Mock: Replace with actual implementation
      const updatedSupplied = [...mockSuppliedAssets];
      updatedSupplied.forEach(asset => {
        // Update APY information
        asset.apy = apyInfo.deposits[asset.symbol as keyof typeof apyInfo.deposits] || asset.apy;
      });
      setSuppliedAssets(updatedSupplied);
    }
  }, [isWalletConnected, account]);

  // Toggle APY modal
  const toggleApyModal = () => {
    setIsApyModalOpen(!isApyModalOpen);
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 fade-in">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <div className="flex items-center space-x-4">
          {!isWalletConnected ? (
            <button onClick={connectWallet} className="btn-primary shine">Connect Wallet</button>
          ) : (
            <>
              <button className="btn-primary shine">Add Assets</button>
              <button className="btn-secondary shine">Export</button>
            </>
          )}
        </div>
      </div>

      <div className="card p-8 bg-flow fade-in delay-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Account Overview</h2>
            <p className="opacity-70">Check your assets and collateral value</p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/supply" className="link-button shine">Supply</Link>
            <Link href="/borrow" className="link-button link-button-pink shine">Borrow</Link>
            {isWalletConnected && (
              <button onClick={toggleApyModal} className="link-button link-button-green shine">View APY</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[var(--pastel-blue)]/10 p-6 rounded-xl border border-[var(--pastel-blue)]/20 fade-in delay-300">
            <p className="opacity-70 mb-2">Total Supplied</p>
            <h3 className="text-3xl font-bold mb-4">$10,735</h3>
            <div className="text-sm opacity-70">Compared to 24h ago <span className="text-[var(--pastel-green)] font-medium">+1.8%</span></div>
          </div>
          <div className="bg-[var(--pastel-pink)]/10 p-6 rounded-xl border border-[var(--pastel-pink)]/20 fade-in delay-400">
            <p className="opacity-70 mb-2">Total Borrowed</p>
            <h3 className="text-3xl font-bold mb-4">$4,700</h3>
            <div className="text-sm opacity-70">Compared to 24h ago <span className="text-[var(--pastel-purple)] font-medium">-0.5%</span></div>
          </div>
          <div className="bg-[var(--pastel-green)]/10 p-6 rounded-xl border border-[var(--pastel-green)]/20 fade-in delay-500">
            <p className="opacity-70 mb-2">Collateral Health</p>
            <h3 className="text-3xl font-bold mb-4">71%</h3>
            <div className="text-sm opacity-70">Safe range: <span className="font-medium">60% or higher</span></div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[var(--card-border)] mb-6 fade-in">
        <button
          className={`py-3 px-6 font-medium ${
            activeTab === 'overview' 
              ? 'border-b-2 border-[var(--pastel-blue)] text-[var(--pastel-blue)]' 
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`py-3 px-6 font-medium ${
            activeTab === 'supplied' 
              ? 'border-b-2 border-[var(--pastel-blue)] text-[var(--pastel-blue)]' 
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('supplied')}
        >
          Supplied Assets
        </button>
        <button
          className={`py-3 px-6 font-medium ${
            activeTab === 'borrowed' 
              ? 'border-b-2 border-[var(--pastel-blue)] text-[var(--pastel-blue)]' 
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('borrowed')}
        >
          Borrowed Assets
        </button>
        <button
          className={`py-3 px-6 font-medium ${
            activeTab === 'history' 
              ? 'border-b-2 border-[var(--pastel-blue)] text-[var(--pastel-blue)]' 
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('history')}
        >
          Transaction History
        </button>
      </div>

      {/* Supplied Assets Section */}
      <div className="card p-6 fade-in delay-100">
        <h3 className="text-xl font-bold mb-6">Supplied Assets</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--card-border)]">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-opacity-70">Asset</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70">Amount</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70">USD Value</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70">APY</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {suppliedAssets.map((asset, idx) => (
                <tr key={asset.id} className={`fade-in delay-${(idx + 1) * 100}`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <Image 
                          src={`/${asset.symbol.toLowerCase() === 'whsk' ? 'hashkey' : 'tether'}.svg`} 
                          alt={asset.name} 
                          width={40} 
                          height={40}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-sm opacity-70">{asset.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">{asset.amount}</td>
                  <td className="px-4 py-4 text-right">{asset.value}</td>
                  <td className="px-4 py-4 text-right text-[var(--pastel-green)]">{asset.apy}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1 text-sm rounded-full bg-[var(--pastel-blue)]/10 text-[var(--pastel-blue)] hover:bg-[var(--pastel-blue)]/20 transition-colors shine">
                        Withdraw
                      </button>
                      <button className="px-3 py-1 text-sm rounded-full bg-[var(--pastel-pink)]/10 text-[var(--pastel-pink)] hover:bg-[var(--pastel-pink)]/20 transition-colors shine">
                        Add
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Borrowed Assets Section */}
      <div className="card p-6 fade-in delay-200">
        <h3 className="text-xl font-bold mb-6">Borrowed Assets</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--card-border)]">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-opacity-70">Asset</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70">Amount</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70">USD Value</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70">APR</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70">Health</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-opacity-70">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {borrowedAssets.map((asset, idx) => (
                <tr key={asset.id} className={`fade-in delay-${(idx + 3) * 100}`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <Image 
                          src={`/${asset.symbol.toLowerCase() === 'whsk' ? 'hashkey' : 'tether'}.svg`} 
                          alt={asset.name} 
                          width={40} 
                          height={40}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-sm opacity-70">{asset.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">{asset.amount}</td>
                  <td className="px-4 py-4 text-right">{asset.value}</td>
                  <td className="px-4 py-4 text-right text-[var(--pastel-pink)]">{asset.apr}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-2 overflow-hidden">
                        <div 
                          className="bg-[var(--pastel-green)] h-2 rounded-full" 
                          style={{ width: asset.health, animation: 'growWidth 1.5s ease-out forwards' }}
                        ></div>
                      </div>
                      <span>{asset.health}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1 text-sm rounded-full bg-[var(--pastel-blue)]/10 text-[var(--pastel-blue)] hover:bg-[var(--pastel-blue)]/20 transition-colors shine">
                        Repay
                      </button>
                      <button className="px-3 py-1 text-sm rounded-full bg-[var(--pastel-pink)]/10 text-[var(--pastel-pink)] hover:bg-[var(--pastel-pink)]/20 transition-colors shine">
                        Borrow More
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* APY Modal */}
      {isApyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 fade-in">
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">APY Information</h3>
              <button onClick={toggleApyModal} className="text-gray-500 hover:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="text-xl font-semibold mb-4">Deposit APY</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(apyInfo.deposits).map(([symbol, rate]) => (
                  <div key={symbol} className="bg-[var(--pastel-blue)]/10 p-4 rounded-xl border border-[var(--pastel-blue)]/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                          <Image 
                            src={`/${symbol.toLowerCase() === 'whsk' ? 'hashkey' : 'tether'}.svg`} 
                            alt={symbol} 
                            width={32} 
                            height={32}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="font-medium">{symbol}</span>
                      </div>
                      <span className="text-[var(--pastel-green)] font-semibold">{rate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-xl font-semibold mb-4">Arbitrage APY</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(apyInfo.arbitrage).map(([symbol, rate]) => (
                  <div key={symbol} className="bg-[var(--pastel-pink)]/10 p-4 rounded-xl border border-[var(--pastel-pink)]/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                          <Image 
                            src={`/${symbol.toLowerCase() === 'whsk' ? 'hashkey' : 'tether'}.svg`} 
                            alt={symbol} 
                            width={32} 
                            height={32}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="font-medium">{symbol}</span>
                      </div>
                      <span className="text-[var(--pastel-pink)] font-semibold">{rate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-[var(--card-border)]">
              <div className="text-sm opacity-80">
                <p>• Deposit APY: Annual yield rate that users can earn through standard deposits (AToken).</p>
                <p>• Arbitrage APY: Annual yield rate that the arbitrage wallet can earn through arbitrage deposits (BToken).</p>
                <p className="mt-2">APY rates may fluctuate depending on market conditions.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 