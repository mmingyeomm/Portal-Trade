'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useWeb3 } from '../../contexts/Web3Context';
import { contractAddresses, Address, SupplyType } from '../../utils/contracts';
import { ethers } from 'ethers';

// Asset data for the supported tokens
const assets = [
  { id: 1, name: 'Whiskey Token', symbol: 'WHSK', price: '$40.20', apr: '5.6%', available: '$0' },
  { id: 2, name: 'Tether', symbol: 'USDT', price: '$1.00', apr: '5.3%', available: '$0' },
];

export default function Borrow() {
  const searchParams = useSearchParams();
  const assetParam = searchParams.get('asset');
  const { walletState, borrowAsset, repayAsset, connectWallet, account, getUserAssetBalance, getUserBorrowAmount } = useWeb3();
  
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);
  const [amount, setAmount] = useState('');
  const [amountUSD, setAmountUSD] = useState('0.00');
  const [health, setHealth] = useState(100);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [collaterals, setCollaterals] = useState<{
    id: number;
    name: string;
    symbol: string;
    amount: string;
    formattedAmount: string;
    value: string;
    ltv: string;
  }[]>([]);
  const [borrowedAssets, setBorrowedAssets] = useState<{
    id: number;
    name: string;
    symbol: string;
    amount: string;
    formattedAmount: string;
    value: string;
  }[]>([]);
  const [totalCollateralValue, setTotalCollateralValue] = useState(0);
  const [availableBorrowLimit, setAvailableBorrowLimit] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  
  // Repay modal state
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayAssetSelected, setRepayAssetSelected] = useState<{
    id: number;
    name: string;
    symbol: string;
    amount: string;
    formattedAmount: string;
    value: string;
  } | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [isRepaying, setIsRepaying] = useState(false);

  // Select asset from URL parameters
  useEffect(() => {
    if (assetParam) {
      const asset = assets.find(a => a.symbol === assetParam);
      if (asset) {
        setSelectedAsset(asset);
      }
    }
  }, [assetParam]);

  // Fetch user's collateral and borrow data when wallet is connected
  useEffect(() => {
    const fetchUserData = async () => {
      if (walletState === 'connected' && account) {
        setLoadingData(true);
        try {
          console.log('=== 담보 자산 조회 시작 ===');
          console.log('계정 주소:', account);
          console.log('WHSK 컨트랙트 주소:', contractAddresses.assets.WHSK);
          console.log('USDT 컨트랙트 주소:', contractAddresses.assets.USDT);
          
          const userCollaterals = [];
          let totalValue = 0;
          
          // Fetch WHSK collateral
          console.log('WHSK 담보 조회 시작...');
          try {
            const whskBalance = await getUserAssetBalance(contractAddresses.assets.WHSK, SupplyType.DEPOSIT);
            console.log('WHSK 잔액 원본값:', whskBalance);
            
            if (parseFloat(whskBalance) > 0) {
              // 원시값으로 변환 (웨이)
              const whskBalanceWei = ethers.parseEther(whskBalance).toString();
              console.log('WHSK 잔액 Wei 값:', whskBalanceWei);
              
              const whskPrice = 40.20; // Example price in USD
              const whskValue = parseFloat(whskBalance) * whskPrice;
              totalValue += whskValue;
              userCollaterals.push({
                id: 1,
                name: 'Whiskey Token',
                symbol: 'WHSK',
                amount: whskBalanceWei,
                formattedAmount: parseFloat(whskBalance).toFixed(2),
                value: `$${whskValue.toFixed(2)}`,
                ltv: '75%'
              });
              console.log('WHSK 담보로 추가됨:', whskBalanceWei, 'WHSK (원시 단위)');
            } else {
              console.log('WHSK 잔액이 0이거나 0보다 작아서 담보로 추가되지 않음');
            }
          } catch (error) {
            console.error('WHSK 잔액 조회 오류:', error);
          }
          
          // Fetch USDT collateral
          console.log('USDT 담보 조회 시작...');
          try {
            const usdtBalance = await getUserAssetBalance(contractAddresses.assets.USDT, SupplyType.DEPOSIT);
            console.log('USDT 잔액 원본값:', usdtBalance);
            
            if (parseFloat(usdtBalance) > 0) {
              // 원시값으로 변환 (웨이)
              const usdtBalanceWei = ethers.parseEther(usdtBalance).toString();
              console.log('USDT 잔액 Wei 값:', usdtBalanceWei);
              
              const usdtPrice = 1.00; // Stablecoin
              const usdtValue = parseFloat(usdtBalance) * usdtPrice;
              totalValue += usdtValue;
              userCollaterals.push({
                id: 2,
                name: 'Tether',
                symbol: 'USDT',
                amount: usdtBalanceWei,
                formattedAmount: parseFloat(usdtBalance).toFixed(2),
                value: `$${usdtValue.toFixed(2)}`,
                ltv: '80%'
              });
              console.log('USDT 담보로 추가됨:', usdtBalanceWei, 'USDT (원시 단위)');
            } else {
              console.log('USDT 잔액이 0이거나 0보다 작아서 담보로 추가되지 않음');
            }
          } catch (error) {
            console.error('USDT 잔액 조회 오류:', error);
          }
          
          console.log('담보 자산 목록:', userCollaterals);
          setCollaterals(userCollaterals);
          console.log('총 담보 가치:', totalValue);
          setTotalCollateralValue(totalValue);
          
          // Calculate available borrow limit (75% of collateral value)
          const borrowLimit = totalValue * 0.75;
          console.log('대출 가능 한도:', borrowLimit);
          setAvailableBorrowLimit(borrowLimit);
          
          // Update 'available' in assets
          const updatedAssets = [...assets];
          updatedAssets.forEach(asset => {
            asset.available = `$${borrowLimit.toFixed(2)}`;
          });
          
          // Fetch user's borrowed assets
          console.log('=== 대출 자산 조회 시작 ===');
          const userBorrows = [];
          
          // Check WHSK borrow
          console.log('WHSK 대출 조회 시작...');
          try {
            const whskBorrow = await getUserBorrowAmount(contractAddresses.assets.WHSK);
            console.log('WHSK 대출 원본값:', whskBorrow);
            
            if (parseFloat(whskBorrow) > 0) {
              // 원시값으로 변환 (웨이)
              const whskBorrowWei = ethers.parseEther(whskBorrow).toString();
              console.log('WHSK 대출 Wei 값:', whskBorrowWei);
              
              userBorrows.push({
                id: 1,
                name: 'Whiskey Token',
                symbol: 'WHSK',
                amount: whskBorrowWei,
                formattedAmount: parseFloat(whskBorrow).toFixed(2),
                value: `$${(parseFloat(whskBorrow) * 40.20).toFixed(2)}`
              });
              console.log('WHSK 대출로 추가됨:', whskBorrowWei, 'WHSK (원시 단위)');
            } else {
              console.log('WHSK 대출이 0이거나 0보다 작아서 추가되지 않음');
            }
          } catch (error) {
            console.error('WHSK 대출 조회 오류:', error);
          }
          
          // Check USDT borrow
          console.log('USDT 대출 조회 시작...');
          try {
            const usdtBorrow = await getUserBorrowAmount(contractAddresses.assets.USDT);
            console.log('USDT 대출 원본값:', usdtBorrow);
            
            if (parseFloat(usdtBorrow) > 0) {
              // 원시값으로 변환 (웨이)
              const usdtBorrowWei = ethers.parseEther(usdtBorrow).toString();
              console.log('USDT 대출 Wei 값:', usdtBorrowWei);
              
              userBorrows.push({
                id: 2,
                name: 'Tether',
                symbol: 'USDT',
                amount: usdtBorrowWei,
                formattedAmount: parseFloat(usdtBorrow).toFixed(2),
                value: `$${parseFloat(usdtBorrow).toFixed(2)}`
              });
              console.log('USDT 대출로 추가됨:', usdtBorrowWei, 'USDT (원시 단위)');
            } else {
              console.log('USDT 대출이 0이거나 0보다 작아서 추가되지 않음');
            }
          } catch (error) {
            console.error('USDT 대출 조회 오류:', error);
          }
          
          console.log('대출 자산 목록:', userBorrows);
          setBorrowedAssets(userBorrows);
          
          // Calculate health factor
          if (totalValue > 0 && userBorrows.length > 0) {
            // Get the total borrowed value
            let totalBorrowed = 0;
            userBorrows.forEach(borrow => {
              totalBorrowed += parseFloat(borrow.value.replace('$', ''));
            });
            
            // Calculate health factor (totalCollateral / totalBorrowed * 100)
            const healthFactor = Math.min(100, Math.floor((totalValue / totalBorrowed) * 100));
            setHealth(healthFactor);
          } else {
            setHealth(100); // If no borrows, health is perfect
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoadingData(false);
        }
      }
    };
    
    fetchUserData();
  }, [walletState, account, getUserAssetBalance, getUserBorrowAmount]);

  // Calculate available borrow limit in token units (raw)
  const calculateMaxBorrowableAmount = (symbol: string) => {
    if (availableBorrowLimit <= 0) return '0';
    
    // Convert USD limit to token amount
    let tokenPrice = 1.0; // USDT price
    if (symbol === 'WHSK') {
      tokenPrice = 40.20; // WHSK price
    }
    
    // Convert to token amount
    const tokenAmount = availableBorrowLimit / tokenPrice;
    
    // 값이 너무 작으면(과학적 표기법으로 표시될 수 있는 경우) 0 반환
    if (tokenAmount < 0.000001) return '0';
    
    // Convert to raw units (wei)
    try {
      // 과학적 표기법 처리를 위해 숫자를 일반 형식 문자열로 변환
      const normalizedAmount = tokenAmount.toFixed(18);
      console.log("정규화된 토큰 금액:", normalizedAmount);
      
      const rawAmount = ethers.parseEther(normalizedAmount).toString();
      return rawAmount;
    } catch (error) {
      console.error('Error converting to raw units:', error);
      return '0';
    }
  };

  // Convert input amount to USD and calculate health
  const calculateValues = (value: string) => {
    // Calculate USD value
    let usdValue = '0.00';
    if (value && !isNaN(Number(value))) {
      // Convert from raw units to ether
      const etherValue = ethers.formatEther(value);
      const price = selectedAsset.symbol === 'USDT' ? 1 : 40.20; // WHSK price
      
      const usdAmount = parseFloat(etherValue) * price;
      usdValue = usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
      // Calculate health (borrowing more reduces health)
      const borrowAmount = parseFloat(etherValue) * price;
      const existingBorrow = borrowedAssets.reduce(
        (total, asset) => total + parseFloat(asset.value.replace('$', '')), 0
      );
      const totalBorrow = existingBorrow + borrowAmount;
      
      if (totalCollateralValue > 0) {
        const newHealth = Math.max(0, Math.min(100, 100 - (totalBorrow / totalCollateralValue * 100)));
        setHealth(newHealth);
      }
    } else {
      // Reset health to current level
      const totalBorrowValue = borrowedAssets.reduce(
        (total, asset) => total + parseFloat(asset.value.replace('$', '')), 0
      );
      
      if (totalCollateralValue > 0) {
        const currentHealth = Math.max(0, Math.min(100, 100 - (totalBorrowValue / totalCollateralValue * 100)));
        setHealth(currentHealth);
      } else {
        setHealth(100);
      }
    }
    
    return usdValue;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 양의 정수만 허용
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
      setAmountUSD(calculateValues(value));
    }
  };

  const handleMaxClick = () => {
    // 최대 대출 가능 금액 계산 (원시 단위)
    const maxBorrowableRaw = calculateMaxBorrowableAmount(selectedAsset.symbol);
    setAmount(maxBorrowableRaw);
    setAmountUSD(calculateValues(maxBorrowableRaw));
  };

  const handleBorrow = () => {
    if (!amount || parseInt(amount) <= 0) {
      alert('Please enter a valid amount to borrow.');
      return;
    }
    
    // Check if the borrow would exceed limits
    const borrowAmountUSD = parseFloat(amountUSD.replace(/,/g, ''));
    if (borrowAmountUSD > availableBorrowLimit) {
      alert('Borrow amount exceeds your available borrow limit.');
      return;
    }
    
    // Check health factor after borrow
    if (health < 10) {
      alert('This borrow would bring your health factor to a dangerous level.');
      return;
    }
    
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
      console.log("Borrow asset address:", assetAddress);
      console.log("Borrow amount (raw):", amount);
      
      // Call contract with formatted amount (from Wei to Ether)
      const formattedAmount = ethers.formatEther(amount);
      console.log("Formatted amount for contract call:", formattedAmount);
      await borrowAsset(assetAddress, formattedAmount);
      
      setShowConfirmation(false);
      setAmount('');
      setAmountUSD('0.00');
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error during borrowing:', error);
      alert('An error occurred while processing the borrow transaction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenRepayModal = (asset: {
    id: number;
    name: string;
    symbol: string;
    amount: string;
    formattedAmount: string;
    value: string;
  }) => {
    setRepayAssetSelected(asset);
    setRepayAmount('');
    setShowRepayModal(true);
  };

  const handleRepayAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 양의 정수만 허용
    if (value === '' || /^\d+$/.test(value)) {
      setRepayAmount(value);
    }
  };

  const handleRepayMaxClick = () => {
    if (repayAssetSelected) {
      // Set the max amount to the full borrowed amount
      setRepayAmount(repayAssetSelected.amount);
    }
  };

  const handleRepayConfirm = async () => {
    if (!repayAssetSelected || !repayAmount || parseInt(repayAmount) <= 0) {
      alert('Please enter a valid amount to repay.');
      return;
    }

    if (parseInt(repayAmount) > parseInt(repayAssetSelected.amount)) {
      alert('You cannot repay more than you borrowed.');
      return;
    }

    try {
      setIsRepaying(true);
      
      // Get asset address
      const assetAddress = contractAddresses.assets[repayAssetSelected.symbol as keyof typeof contractAddresses.assets];
      console.log("Repay asset address:", assetAddress);
      console.log("Repay amount (raw):", repayAmount);
      
      // Call contract with formatted amount (from Wei to Ether)
      const formattedAmount = ethers.formatEther(repayAmount);
      console.log("Formatted amount for contract call:", formattedAmount);
      await repayAsset(assetAddress, formattedAmount);
      
      setShowRepayModal(false);
      setRepayAmount('');
      setRepayAssetSelected(null);
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error during repaying:', error);
      alert('An error occurred while processing the repay transaction.');
    } finally {
      setIsRepaying(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 fade-in">
        <h1 className="text-3xl font-bold">Borrow Assets</h1>
        <Link href="/dashboard" className="text-[var(--pastel-blue)] hover:underline shine">
          Return to My Dashboard
        </Link>
      </div>

      {walletState !== 'connected' ? (
        <div className="card p-8 text-center fade-in">
          <h2 className="text-xl font-bold mb-4">Wallet Connection Required</h2>
          <p className="mb-6">Please connect your wallet to access the borrow feature.</p>
          <button 
            onClick={connectWallet}
            className="btn-primary shine px-8 py-3"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left - Collateral Info and Borrow Form */}
        <div className="space-y-6 fade-in delay-100">
          {/* Collateral Information */}
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">My Collateral Assets</h2>
            
              {loadingData ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--pastel-blue)]"></div>
                </div>
              ) : collaterals.length > 0 ? (
            <div className="space-y-4">
              {collaterals.map((collateral, idx) => (
                <div key={collateral.id} className={`flex items-center justify-between p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg fade-in delay-${(idx + 2) * 100}`}>
                  <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <Image 
                            src={`/${collateral.symbol.toLowerCase() === 'whsk' ? 'hashkey' : 'tether'}.svg`} 
                            alt={collateral.name} 
                            width={40} 
                            height={40}
                            className="w-full h-full object-contain"
                          />
                        </div>
                    <div>
                      <p className="font-medium">{collateral.name}</p>
                      <p className="text-sm opacity-70">{collateral.amount} {collateral.symbol} <span className="text-xs">(Raw Units)</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{collateral.value}</p>
                    <p className="text-sm opacity-70">LTV: {collateral.ltv}</p>
                  </div>
                </div>
              ))}
            </div>
              ) : (
                <div className="text-center py-4">
                  <p className="opacity-70 mb-4">You don't have any collateral assets yet.</p>
                  <Link href="/supply" className="btn-primary shine px-6 py-2">
                    Supply Collateral
                  </Link>
                </div>
              )}
              
              {collaterals.length > 0 && (
            <div className="mt-4 p-4 bg-[var(--pastel-blue)]/10 rounded-lg fade-in delay-400">
              <div className="flex justify-between mb-2">
                <span>Total Collateral Value</span>
                    <span className="font-bold">${totalCollateralValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Available Borrow Limit</span>
                    <span className="font-bold">${availableBorrowLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
              )}
            
            <Link href="/supply" className="block text-center text-[var(--pastel-blue)] mt-4 hover:underline shine fade-in delay-500">
              Add More Collateral
            </Link>
          </div>
          
            {/* Current Borrowed Assets */}
            <div className="card p-6 fade-in delay-600">
              <h3 className="text-lg font-bold mb-4">Current Borrowed Assets</h3>
              
              {loadingData ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--pastel-pink)]"></div>
                </div>
              ) : borrowedAssets.length > 0 ? (
                <div className="space-y-3">
                  {borrowedAssets.map((asset, idx) => (
                    <div key={asset.id} className="flex justify-between items-center p-3 bg-[var(--pastel-pink)]/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <Image 
                            src={`/${asset.symbol.toLowerCase() === 'whsk' ? 'hashkey' : 'tether'}.svg`} 
                            alt={asset.name} 
                            width={32} 
                            height={32}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span>{asset.amount} {asset.symbol} <span className="text-xs">(Raw Units)</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{asset.value}</span>
                        <button 
                          onClick={() => handleOpenRepayModal(asset)}
                          className="px-3 py-1 text-sm rounded-full bg-[var(--pastel-blue)]/10 text-[var(--pastel-blue)] hover:bg-[var(--pastel-blue)]/20 transition-colors shine"
                        >
                          Repay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center opacity-70 py-2">You don't have any borrowed assets.</p>
              )}
              
              {/* Current Loan Health */}
              <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
                <h4 className="text-md font-medium mb-2">Current Health Factor</h4>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1 h-2 bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    health > 60 ? 'bg-[var(--pastel-green)]' : 
                    health > 30 ? 'bg-[var(--warning)]' : 
                    'bg-[var(--pastel-pink)]'
                  }`}
                  style={{ width: `${health}%`, animation: 'growWidth 1.5s ease-out forwards' }}
                ></div>
              </div>
              <span className="text-lg font-bold">{health.toFixed(0)}%</span>
            </div>
            <p className="text-sm opacity-70">
              {health > 60 
                    ? 'Your position is in a healthy state.' 
                : health > 30 
                    ? 'Your position requires attention.' 
                    : 'Your position is at risk of liquidation.'}
            </p>
              </div>
          </div>
        </div>
        
        {/* Right - Borrow Application Form */}
        <div className="card p-8 fade-in delay-200">
          <h2 className="text-xl font-bold mb-6">Borrow Request</h2>
          
          {/* Asset Selection */}
          <div className="mb-6 fade-in delay-300">
            <label className="block text-sm opacity-70 mb-2">Select Asset to Borrow</label>
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
                    calculateValues('');
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
          
          {/* Amount Input */}
          <div className="mb-6 fade-in delay-400">
            <div className="flex justify-between mb-2">
              <label className="block text-sm opacity-70">Borrow Amount (Raw Units)</label>
              <span className="text-sm opacity-70">
                Max available: {calculateMaxBorrowableAmount(selectedAsset.symbol)} {selectedAsset.symbol}
              </span>
            </div>
            <div className="relative">
              <input 
                type="text" 
                className="w-full p-4 border border-[var(--card-border)] rounded-lg bg-transparent shine"
                placeholder="0"
                value={amount}
                onChange={handleAmountChange}
                disabled={isProcessing || collaterals.length === 0}
              />
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-[var(--pastel-blue)]/10 text-[var(--pastel-blue)] rounded hover:bg-[var(--pastel-blue)]/20 transition-colors"
                onClick={handleMaxClick}
                disabled={isProcessing || collaterals.length === 0}
              >
                MAX
              </button>
            </div>
            <div className="mt-2 text-right text-sm">
              ≈ ${amountUSD} USD
            </div>
          </div>
            
            {/* Asset Details */}
            <div className="mb-6 space-y-3 py-4 border-y border-[var(--card-border)] fade-in delay-500">
              <div className="flex justify-between">
                <span className="opacity-70">Borrow APR:</span>
                <span className="font-medium">{selectedAsset.apr}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Collateral Required:</span>
                <span className="font-medium">Yes</span>
            </div>
            <div className="flex justify-between">
                <span className="opacity-70">Health Factor After Borrow:</span>
                <span className={`font-medium ${
                health > 60 ? 'text-[var(--pastel-green)]' : 
                health > 30 ? 'text-[var(--warning)]' : 
                'text-[var(--pastel-pink)]'
              }`}>
                  {health.toFixed(0)}%
              </span>
            </div>
          </div>
          
            {/* Borrow Button */}
          <button 
              className="w-full py-4 bg-gradient-to-r from-[var(--pastel-pink)] to-[var(--pastel-purple)] text-white rounded-lg font-medium shine fade-in delay-600"
            onClick={handleBorrow}
              disabled={isProcessing || !amount || parseInt(amount) <= 0 || collaterals.length === 0}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
                  Processing...
                </span>
              ) : collaterals.length === 0 ? (
                "Supply Collateral First"
              ) : (
                "Borrow Now"
              )}
          </button>
            
            {/* Information Note */}
            <p className="text-sm opacity-70 mt-4 text-center fade-in delay-700">
              Be sure to maintain a healthy collateral ratio to avoid liquidation.
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 fade-in">
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 max-w-md w-full fade-in">
            <h3 className="text-xl font-bold mb-4">Confirm Borrow</h3>
            
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
                  <span>Borrow APR:</span>
                  <span className="font-medium">{selectedAsset.apr}</span>
              </div>
              <div className="flex justify-between">
                  <span>Health Factor After Borrow:</span>
                  <span className={`font-medium ${
                  health > 60 ? 'text-[var(--pastel-green)]' : 
                  health > 30 ? 'text-[var(--warning)]' : 
                  'text-[var(--pastel-pink)]'
                  }`}>
                    {health.toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <p className="text-sm">
                You are about to borrow {amount} {selectedAsset.symbol} (raw units). The borrowed amount will be sent to your wallet. You can repay this loan at any time.
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
                className="flex-1 py-3 bg-gradient-to-r from-[var(--pastel-pink)] to-[var(--pastel-purple)] text-white rounded-lg font-medium shine"
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
                    Processing...
                  </span>
                ) : (
                  "Confirm Borrow"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repay Modal */}
      {showRepayModal && repayAssetSelected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 fade-in">
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 max-w-md w-full fade-in">
            <h3 className="text-xl font-bold mb-4">Repay Loan</h3>
            
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image 
                      src={`/${repayAssetSelected.symbol.toLowerCase() === 'whsk' ? 'hashkey' : 'tether'}.svg`} 
                      alt={repayAssetSelected.name} 
                      width={40} 
                      height={40}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{repayAssetSelected.name}</p>
                    <p className="text-sm opacity-70">Borrowed: {repayAssetSelected.amount} {repayAssetSelected.symbol} <span className="text-xs">(Raw Units)</span></p>
                  </div>
                </div>
              </div>
              
              {/* Repay Amount Input */}
              <div className="space-y-2">
                <label className="block text-sm opacity-70">Repay Amount (Raw Units)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full p-4 border border-[var(--card-border)] rounded-lg bg-transparent shine"
                    placeholder="0"
                    value={repayAmount}
                    onChange={handleRepayAmountChange}
                    disabled={isRepaying}
                  />
                  <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-[var(--pastel-blue)]/10 text-[var(--pastel-blue)] rounded hover:bg-[var(--pastel-blue)]/20 transition-colors"
                    onClick={handleRepayMaxClick}
                    disabled={isRepaying}
                  >
                    MAX
                  </button>
                </div>
                <p className="text-sm text-right opacity-70">
                  Balance: {repayAssetSelected.amount} {repayAssetSelected.symbol} (Raw Units)
                </p>
              </div>
              
              <p className="text-sm">
                You are about to repay {repayAmount || '0'} {repayAssetSelected.symbol} (raw units) of your loan. 
                This will decrease your debt and improve your health factor.
              </p>
            </div>
            
            <div className="flex gap-4">
              <button 
                className="flex-1 py-3 border border-[var(--card-border)] rounded-lg font-medium shine"
                onClick={() => setShowRepayModal(false)}
                disabled={isRepaying}
              >
                Cancel
              </button>
              <button 
                className="flex-1 py-3 bg-gradient-to-r from-[var(--pastel-blue)] to-[var(--pastel-green)] text-white rounded-lg font-medium shine"
                onClick={handleRepayConfirm}
                disabled={isRepaying || !repayAmount || parseInt(repayAmount) <= 0}
              >
                {isRepaying ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
                    Processing...
                  </span>
                ) : (
                  "Confirm Repay"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 