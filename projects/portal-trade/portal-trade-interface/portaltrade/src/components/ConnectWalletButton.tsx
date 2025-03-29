'use client';

import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

export const ConnectWalletButton = () => {
  const { walletState, account, connectWallet, disconnectWallet } = useWeb3();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Render button based on connection state
  const renderButton = () => {
    switch (walletState) {
      case 'connecting':
        return (
          <button 
            className="btn-primary opacity-75"
            disabled
          >
            Connecting...
          </button>
        );
      
      case 'connected':
        return (
          <div className="relative">
            <button 
              className="btn-secondary flex items-center gap-2 shine"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="w-2 h-2 rounded-full bg-[var(--pastel-green)]"></span>
              {account && formatAddress(account)}
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg z-20 fade-in">
                <div className="p-4">
                  <p className="text-sm opacity-70 mb-2">Connected Account</p>
                  <p className="font-medium mb-4">
                    {account && formatAddress(account)}
                  </p>
                  <button 
                    className="w-full p-2 text-center border border-[var(--card-border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors"
                    onClick={() => {
                      disconnectWallet();
                      setIsDropdownOpen(false);
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <button 
            className="btn-primary shine"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        );
    }
  };

  return renderButton();
}; 