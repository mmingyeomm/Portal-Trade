'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useWeb3 } from '../../contexts/Web3Context';
import { contractAddresses, Address, SupplyType } from '../../utils/contracts';

// Mock asset data
const assets = [
  { id: 1, name: 'Ethereum', symbol: 'ETH', balance: '1.2', value: '$2,638.14', apy: '3.2%' },
  { id: 2, name: 'Bitcoin', symbol: 'BTC', balance: '0.05', value: '$3,062.54', apy: '2.8%' },
  { id: 3, name: 'Solana', symbol: 'SOL', balance: '25.0', value: '$2,208.75', apy: '4.1%' },
  { id: 4, name: 'Tether', symbol: 'USDT', balance: '3,000', value: '$3,000.00', apy: '3.8%' },
  { id: 5, name: 'USD Coin', symbol: 'USDC', balance: '2,000', value: '$2,000.00', apy: '3.7%' },
];

// Price information
const prices = {
  ETH: 2198.45,
  BTC: 61250.72,
  SOL: 88.35,
  USDT: 1.00,
  USDC: 1.00,
};

export default function Withdraw() {
  const searchParams = useSearchParams();
  const assetParam = searchParams.get('asset');
  const { walletState, withdrawAsset, getUserAssetBalance } = useWeb3();
  
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);
  const [amount, setAmount] = useState('');
  const [amountUSD, setAmountUSD] = useState('0.00');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSupplyType, setSelectedSupplyType] = useState<SupplyType>(SupplyType.DEPOSIT);

  // Select asset from URL parameters
  useEffect(() => {
    if (assetParam) {
      const asset = assets.find(a => a.symbol === assetParam);
      if (asset) {
        setSelectedAsset(asset);
      }
    }
  }, [assetParam]);

  // Get asset balance (uncomment below code for actual integration)
  // useEffect(() => {
  //   const fetchBalance = async () => {
  //     if (walletState === 'connected') {
  //       const assetAddress = contractAddresses.assets[selectedAsset.symbol as keyof typeof contractAddresses.assets];
  //       const balance = await getUserAssetBalance(assetAddress, selectedSupplyType);
  //       // Logic to update balance
  //     }
  //   };
  //   fetchBalance();
  // }, [selectedAsset.symbol, walletState, selectedSupplyType]);

  // Convert input amount to USD
  const calculateUSD = (value: string) => {
    if (!value || isNaN(Number(value))) return '0.00';
    
    const price = prices[selectedAsset.symbol as keyof typeof prices] || 0;
    const usdAmount = parseFloat(value) * price;
    return usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    setAmountUSD(calculateUSD(value));
  };

  const handleMaxClick = () => {
    setAmount(selectedAsset.balance);
    setAmountUSD(calculateUSD(selectedAsset.balance));
  };

  const handleWithdraw = () => {
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (walletState !== 'connected') {
      alert('Please connect your wallet first.');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Get asset address
      const assetAddress = contractAddresses.assets[selectedAsset.symbol as keyof typeof contractAddresses.assets];
      
      // Call contract
      await withdrawAsset(assetAddress, amount, selectedSupplyType);
      
      setShowConfirmation(false);
      setAmount('');
      setAmountUSD('0.00');
    } catch (error) {
      console.error('Error during withdrawal:', error);
      alert('An error occurred while processing the withdrawal transaction.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 fade-in">
        <h1 className="text-3xl font-bold">Withdraw Assets</h1>
        <Link href="/dashboard" className="text-[var(--pastel-blue)] hover:underline shine">
          Return to My Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left - Withdraw Form */}
        <div className="card p-8 fade-in delay-100">
          <h2 className="text-xl font-bold mb-6">Withdraw Assets</h2>
          
          {/* Asset Selection */}
          <div className="mb-6 fade-in delay-200">
            <label className="block text-sm opacity-70 mb-2">Select Asset</label>
            <div className="relative">
              <select 
                className="w-full p-4 border border-[var(--card-border)] rounded-lg bg-transparent appearance-none pr-10 shine"
                value={selectedAsset.id}
                onChange={(e) => {
                  const asset = assets.find(a => a.id === parseInt(e.target.value));
                  if (asset) {
                    setSelectedAsset(asset);
                    setAmount('');
                    setAmountUSD('0.00');
                  }
                }}
              >
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.symbol}) - Balance: {asset.balance}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Withdrawal Type Selection */}
          <div className="mb-6 fade-in delay-250">
            <label className="block text-sm opacity-70 mb-2">Select Withdrawal Type</label>
            <div className="flex gap-3">
              <button 
                className={`flex-1 p-3 border border-[var(--card-border)] rounded-lg bg-transparent text-center ${selectedSupplyType === SupplyType.DEPOSIT ? 'bg-[var(--pastel-blue)]/20 border-[var(--pastel-blue)]' : ''} shine`}
                onClick={() => setSelectedSupplyType(SupplyType.DEPOSIT)}
              >
                Standard Deposit (AToken)
              </button>
              <button 
                className={`flex-1 p-3 border border-[var(--card-border)] rounded-lg bg-transparent text-center ${selectedSupplyType === SupplyType.ARBITRAGE ? 'bg-[var(--pastel-pink)]/20 border-[var(--pastel-pink)]' : ''} shine`}
                onClick={() => setSelectedSupplyType(SupplyType.ARBITRAGE)}
              >
                Arbitrage (BToken)
              </button>
            </div>
          </div>
          
          {/* Amount Input */}
          <div className="mb-6 fade-in delay-300">
            <div className="flex justify-between mb-2">
              <label className="block text-sm opacity-70">Withdrawal Amount</label>
              <span className="text-sm opacity-70">Balance: {selectedAsset.balance} {selectedAsset.symbol}</span>
            </div>
            <div className="relative">
              <input 
                type="text" 
                className="w-full p-4 border border-[var(--card-border)] rounded-lg bg-transparent shine"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
              />
              <button 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--pastel-blue)] text-sm font-medium shine"
                onClick={handleMaxClick}
              >
                MAX
              </button>
            </div>
            <p className="text-sm opacity-70 mt-2">≈ ${amountUSD} USD</p>
          </div>
          
          {/* Summary Information */}
          <div className="bg-[var(--pastel-blue)]/10 p-4 rounded-lg mb-6 fade-in delay-400">
            <div className="flex justify-between mb-2">
              <span className="text-sm opacity-70">Current APY</span>
              <span className="text-sm font-medium text-[var(--pastel-green)]">{selectedAsset.apy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm opacity-70">Token Type</span>
              <span className="text-sm font-medium">
                {selectedSupplyType === SupplyType.DEPOSIT ? 'AToken' : 'BToken'}
              </span>
            </div>
          </div>
          
          {/* Button */}
          <button 
            className="btn-primary w-full py-3 shine fade-in delay-500"
            onClick={handleWithdraw}
            disabled={!amount || parseFloat(amount) === 0}
          >
            Withdraw
          </button>
        </div>
        
        {/* Right - Information and Help */}
        <div className="flex flex-col gap-6">
          <div className="card p-6 fade-in delay-200">
            <h3 className="text-lg font-bold mb-4">About Withdrawing Assets</h3>
            <ul className="space-y-3">
              <li className="flex gap-3 fade-in delay-300">
                <div className="flex-none">
                  <div className="w-8 h-8 rounded-full bg-[var(--pastel-blue)]/20 flex items-center justify-center text-[var(--pastel-blue)] pulse">1</div>
                </div>
                <div>
                  <p className="opacity-80">When you withdraw, you receive both your deposited assets and accrued interest.</p>
                </div>
              </li>
              <li className="flex gap-3 fade-in delay-400">
                <div className="flex-none">
                  <div className="w-8 h-8 rounded-full bg-[var(--pastel-blue)]/20 flex items-center justify-center text-[var(--pastel-blue)] pulse">2</div>
                </div>
                <div>
                  <p className="opacity-80">Assets used as collateral must be repaid before they can be withdrawn.</p>
                </div>
              </li>
              <li className="flex gap-3 fade-in delay-500">
                <div className="flex-none">
                  <div className="w-8 h-8 rounded-full bg-[var(--pastel-blue)]/20 flex items-center justify-center text-[var(--pastel-blue)] pulse">3</div>
                </div>
                <div>
                  <p className="opacity-80">You must select the correct token type (AToken or BToken) for withdrawal.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="card p-6 bg-[var(--pastel-blue)]/10 fade-in delay-300">
            <h3 className="text-lg font-bold mb-2">Health Factor Impact</h3>
            <p className="opacity-80 mb-4">
              Withdrawing assets that serve as collateral will reduce your health factor and could affect your borrowing capacity.
            </p>
            <div className="bg-white/50 dark:bg-black/30 p-4 rounded-lg backdrop-blur-sm">
              <div className="flex justify-between mb-2">
                <span>Total Deposited Assets</span>
                <span className="font-medium">${parseFloat(assets.reduce((sum, asset) => sum + parseFloat(asset.value.replace('$', '').replace(',', '')), 0).toFixed(2)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Interest Earned (Est.)</span>
                <span className="font-medium text-[var(--pastel-green)]">$328.51</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 fade-in">
          <div className="card p-6 max-w-md w-full md:p-8 bg-flow">
            <h3 className="text-xl font-bold mb-4">Confirm Withdrawal</h3>
            <p className="opacity-80 mb-6">
              You are about to withdraw {amount} {selectedAsset.symbol} (≈ ${amountUSD}).
            </p>
            
            <div className="bg-[var(--pastel-blue)]/10 p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm opacity-70">Asset</span>
                <span className="text-sm font-medium">{selectedAsset.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm opacity-70">Amount</span>
                <span className="text-sm font-medium">{amount} {selectedAsset.symbol}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm opacity-70">Token Type</span>
                <span className="text-sm font-medium">{selectedSupplyType === SupplyType.DEPOSIT ? 'AToken' : 'BToken'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm opacity-70">Receiving Address</span>
                <span className="text-sm font-medium">Your connected wallet</span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button 
                className="flex-1 btn-secondary py-3 shine"
                onClick={() => setShowConfirmation(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className="flex-1 btn-primary py-3 shine"
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 