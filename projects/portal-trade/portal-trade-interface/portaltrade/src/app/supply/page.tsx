'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useWeb3 } from '../../contexts/Web3Context';
import { contractAddresses, Address, SupplyType } from '../../utils/contracts';
import { ethers } from 'ethers';

// Mock asset data
const assets = [
  { id: 1, name: 'HashKey Token', symbol: 'WHSK', price: '$40.20', apy: '5.00%', balance: '0' },
  { id: 2, name: 'Tether', symbol: 'USDT', price: '$1.00', apy: '5.00%', balance: '0' },
];

// ERC20 토큰 ABI (balanceOf 함수만 필요)
const erc20Abi = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  }
];

export default function Supply() {
  const searchParams = useSearchParams();
  const assetParam = searchParams.get('asset');
  const { walletState, supplyAsset, account, provider, signer } = useWeb3();
  
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);
  const [amount, setAmount] = useState('');
  const [amountUSD, setAmountUSD] = useState('0.00');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSupplyType, setSelectedSupplyType] = useState<SupplyType>(SupplyType.DEPOSIT);
  const [balances, setBalances] = useState<{[key: string]: string}>({
    WHSK: '0',
    USDT: '0'
  });
  const [rawBalances, setRawBalances] = useState<{[key: string]: string}>({
    WHSK: '0',
    USDT: '0'
  });
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Select asset from URL parameters
  useEffect(() => {
    if (assetParam) {
      const asset = assets.find(a => a.symbol === assetParam);
      if (asset) {
        setSelectedAsset(asset);
      }
    }
  }, [assetParam]);

  // 잔액 조회 함수
  const fetchBalances = async () => {
    if (!account || !provider || !signer) {
      console.log("지갑이 연결되지 않았거나 provider/signer가 없음");
      return;
    }

    setIsLoadingBalances(true);
    try {
      console.log("토큰 잔액 조회 시작...");
      const newBalances: {[key: string]: string} = {};
      const newRawBalances: {[key: string]: string} = {};
      
      // WHSK 잔액 조회
      try {
        console.log("WHSK 잔액 조회 중...");
        const whskContract = new ethers.Contract(
          contractAddresses.assets.WHSK,
          erc20Abi,
          provider
        );
        const whskBalance = await whskContract.balanceOf(account);
        console.log("WHSK 원시 잔액:", whskBalance.toString());
        const formattedBalance = ethers.formatEther(whskBalance);
        console.log("WHSK 포맷된 잔액:", formattedBalance);
        newBalances.WHSK = formattedBalance;
        newRawBalances.WHSK = whskBalance.toString();
      } catch (error) {
        console.error("WHSK 잔액 조회 오류:", error);
        newBalances.WHSK = '0';
        newRawBalances.WHSK = '0';
      }
      
      // USDT 잔액 조회
      try {
        console.log("USDT 잔액 조회 중...");
        const usdtContract = new ethers.Contract(
          contractAddresses.assets.USDT,
          erc20Abi,
          provider
        );
        const usdtBalance = await usdtContract.balanceOf(account);
        console.log("USDT 원시 잔액:", usdtBalance.toString());
        const formattedBalance = ethers.formatEther(usdtBalance);
        console.log("USDT 포맷된 잔액:", formattedBalance);
        newBalances.USDT = formattedBalance;
        newRawBalances.USDT = usdtBalance.toString();
      } catch (error) {
        console.error("USDT 잔액 조회 오류:", error);
        newBalances.USDT = '0';
        newRawBalances.USDT = '0';
      }
      
      setBalances(newBalances);
      setRawBalances(newRawBalances);
      console.log("모든 잔액 조회 완료:", newBalances);
      console.log("모든 원시 잔액 조회 완료:", newRawBalances);
      
      // 자산 목록 업데이트 (원시 단위 사용)
      const updatedAssets = assets.map(asset => ({
        ...asset,
        balance: newRawBalances[asset.symbol] || '0',
        formattedBalance: newBalances[asset.symbol] || '0'
      }));
      
      // 선택된 자산 업데이트
      const updatedSelectedAsset = updatedAssets.find(a => a.id === selectedAsset.id);
      if (updatedSelectedAsset) {
        setSelectedAsset(updatedSelectedAsset);
      }
    } catch (error) {
      console.error("잔액 조회 중 오류 발생:", error);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // 지갑이 연결되면 잔액 조회
  useEffect(() => {
    if (walletState === 'connected' && account) {
      fetchBalances();
    }
  }, [walletState, account, provider, signer]);

  // Convert input amount to USD
  const calculateUSD = (value: string) => {
    if (!value || isNaN(Number(value))) return '0.00';
    
    // Remove $ symbol and commas from price
    const price = parseFloat(selectedAsset.price.replace('$', '').replace(',', ''));
    // 원시 단위에서 이더 단위로 변환 후 USD 계산
    const ethAmount = parseFloat(ethers.formatEther(value || '0'));
    const usdAmount = ethAmount * price;
    return usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 양의 정수만 허용
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
      setAmountUSD(calculateUSD(value));
    }
  };

  const handleMaxClick = () => {
    setAmount(selectedAsset.balance);
    setAmountUSD(calculateUSD(selectedAsset.balance));
  };

  const handleSupply = () => {
    if (walletState !== 'connected') {
      alert('Wallet is not connected. Please connect your wallet first.');
      return;
    }
    
    if (!amount || parseInt(amount) <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }
    
    if (parseInt(amount) > parseInt(selectedAsset.balance)) {
      alert('Insufficient balance. You cannot supply more than you have.');
      return;
    }
    
    console.log("Supply button clicked: Showing modal");
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
      console.log("Supply asset address:", assetAddress);
      console.log("Supply amount (raw):", amount);
      console.log("Supply type:", selectedSupplyType);
      
      // Check if asset address is valid
      if (!assetAddress) {
        alert(`Cannot find contract address for the selected asset ${selectedAsset.symbol}.`);
        setIsProcessing(false);
        return;
      }
      
      // 원시 단위를 이더 단위로 변환
      console.log("Just before contract call");
      // 원시 단위 값을 ethers.formatEther로 변환하여 전달
      const formattedAmount = ethers.formatEther(amount);
      console.log("Formatted amount for contract call:", formattedAmount);
      await supplyAsset(assetAddress, formattedAmount, selectedSupplyType);
      console.log("Contract call completed");
      
      setShowConfirmation(false);
      setAmount('');
      setAmountUSD('0.00');
      
      // 공급 후 잔액 다시 조회
      await fetchBalances();
    } catch (error) {
      console.error('Error during supply:', error);
      alert('An error occurred while processing the supply transaction: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 fade-in">
        <h1 className="text-3xl font-bold">Supply Assets</h1>
        <Link href="/dashboard" className="text-[var(--pastel-blue)] hover:underline shine">
          Return to My Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left - Supply Form */}
        <div className="card p-8 fade-in delay-100">
          <h2 className="text-xl font-bold mb-6">Supply Assets</h2>
          
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
                    // 업데이트된 잔액으로 에셋 정보 업데이트
                    const updatedAsset = {
                      ...asset,
                      balance: rawBalances[asset.symbol] || '0',
                      formattedBalance: balances[asset.symbol] || '0'
                    };
                    setSelectedAsset(updatedAsset);
                    setAmount('');
                    setAmountUSD('0.00');
                  }
                }}
              >
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.symbol})
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
          
          {/* Supply Type Selection */}
          <div className="mb-6 fade-in delay-250">
            <label className="block text-sm opacity-70 mb-2">Select Supply Type</label>
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
              <label className="block text-sm opacity-70">Supply Amount (Raw Units)</label>
              <div className="text-sm opacity-70">
                {isLoadingBalances ? (
                  <span>Loading balance...</span>
                ) : (
                  <span>Balance: {selectedAsset.balance} {selectedAsset.symbol}</span>
                )}
              </div>
            </div>
            <div className="relative">
              <input 
                type="text" 
                className="w-full p-4 border border-[var(--card-border)] rounded-lg bg-transparent shine"
                placeholder="0"
                value={amount}
                onChange={handleAmountChange}
                disabled={isProcessing}
              />
              <button 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--pastel-blue)] text-sm font-medium shine"
                onClick={handleMaxClick}
                disabled={isProcessing || isLoadingBalances}
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sm opacity-70">≈ ${amountUSD} USD</p>
            </div>
          </div>
          
          {/* Summary Information */}
          <div className="bg-[var(--pastel-blue)]/10 p-4 rounded-lg mb-6 fade-in delay-400">
            <div className="flex justify-between mb-2">
              <span className="text-sm opacity-70">APY</span>
              <span className="text-sm font-medium text-[var(--pastel-green)]">{selectedAsset.apy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm opacity-70">Can be used as collateral</span>
              <span className="text-sm font-medium">{selectedSupplyType === SupplyType.DEPOSIT ? 'Yes' : 'No'}</span>
            </div>
          </div>
          
          {/* Button */}
          <button 
            className="btn-primary w-full py-3 shine fade-in delay-500"
            onClick={handleSupply}
            disabled={!amount || parseInt(amount) <= 0 || isProcessing || isLoadingBalances}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
                Processing...
              </span>
            ) : (
              "Supply"
            )}
          </button>
        </div>
        
        {/* Right - Information and Help */}
        <div className="flex flex-col gap-6">
          <div className="card p-6 fade-in delay-200">
            <h3 className="text-lg font-bold mb-4">About Supplying Assets</h3>
            <ul className="space-y-3">
              <li className="flex gap-3 fade-in delay-300">
                <div className="flex-none">
                  <div className="w-8 h-8 rounded-full bg-[var(--pastel-blue)]/20 flex items-center justify-center text-[var(--pastel-blue)] pulse">1</div>
                </div>
                <div>
                  <p className="opacity-80">When you supply assets, interest accrues in real-time.</p>
                </div>
              </li>
              <li className="flex gap-3 fade-in delay-400">
                <div className="flex-none">
                  <div className="w-8 h-8 rounded-full bg-[var(--pastel-blue)]/20 flex items-center justify-center text-[var(--pastel-blue)] pulse">2</div>
                </div>
                <div>
                  <p className="opacity-80">Standard deposited assets can be used as collateral to borrow other assets.</p>
                </div>
              </li>
              <li className="flex gap-3 fade-in delay-500">
                <div className="flex-none">
                  <div className="w-8 h-8 rounded-full bg-[var(--pastel-blue)]/20 flex items-center justify-center text-[var(--pastel-blue)] pulse">3</div>
                </div>
                <div>
                  <p className="opacity-80">You can withdraw your assets at any time, subject to protocol liquidity.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="card p-6 fade-in delay-300">
            <h3 className="text-lg font-bold mb-4">Supply Types</h3>
            <div className="space-y-4">
              <div className="p-4 bg-[var(--pastel-blue)]/10 rounded-lg fade-in delay-400">
                <h4 className="font-medium mb-2">Standard Deposit (AToken)</h4>
                <p className="text-sm opacity-80">Earn a base APY of 5.00%. Your assets can be used as collateral for borrowing.</p>
              </div>
              <div className="p-4 bg-[var(--pastel-pink)]/10 rounded-lg fade-in delay-500">
                <h4 className="font-medium mb-2">Arbitrage (BToken)</h4>
                <p className="text-sm opacity-80">Higher APY of 5.32% but cannot be used as collateral. Ideal for optimizing yield.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 fade-in">
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 max-w-md w-full fade-in">
            <h3 className="text-xl font-bold mb-4">Confirm Supply</h3>
            
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image 
                      src={`/${selectedAsset.symbol.toLowerCase() === 'whsk' ? 'hashkey' : 'tether'}.svg`} 
                      alt={selectedAsset.name} 
                      width={40} 
                      height={40} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{amount} {selectedAsset.symbol} <span className="text-xs">(Raw Units)</span></p>
                    <p className="text-sm opacity-70">≈ ${amountUSD} USD</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-[var(--pastel-blue)]/10 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>APY:</span>
                  <span className="font-medium text-[var(--pastel-green)]">{selectedAsset.apy}</span>
                </div>
                <div className="flex justify-between">
                  <span>Supply Type:</span>
                  <span className="font-medium">{selectedSupplyType === SupplyType.DEPOSIT ? 'Standard Deposit' : 'Arbitrage'}</span>
                </div>
              </div>
              
              <p className="text-sm">
                You are about to supply {amount} {selectedAsset.symbol} (raw units) to the lending pool. 
                {selectedSupplyType === SupplyType.DEPOSIT 
                  ? ' You will receive ATokens which can be used as collateral for borrowing.' 
                  : ' You will receive BTokens which cannot be used as collateral but earn a higher yield.'}
              </p>
            </div>
            
            <div className="flex gap-4">
              <button 
                className="flex-1 py-3 border border-[var(--card-border)] rounded-lg font-medium shine"
                onClick={() => setShowConfirmation(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className="flex-1 py-3 bg-gradient-to-r from-[var(--pastel-blue)] to-[var(--pastel-green)] text-white rounded-lg font-medium shine"
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
                    Processing...
                  </span>
                ) : (
                  "Confirm Supply"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 