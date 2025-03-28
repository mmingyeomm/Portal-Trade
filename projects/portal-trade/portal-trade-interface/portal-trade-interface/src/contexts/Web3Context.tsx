'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { ethers } from 'ethers';
import { poolAbi, aTokenAbi, bTokenAbi, contractAddresses, Address, SupplyType } from '../utils/contracts';

// 월렛 연결 상태 타입 정의
type WalletState = 'disconnected' | 'connecting' | 'connected';

// Web3 컨텍스트 타입 정의
interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  walletState: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  poolContract: ethers.Contract | null;
  // 컨트랙트 함수들
  supplyAsset: (assetAddress: Address, amount: string, supplyType: SupplyType) => Promise<void>;
  borrowAsset: (assetAddress: Address, amount: string) => Promise<void>;
  repayAsset: (assetAddress: Address, amount: string) => Promise<void>;
  withdrawAsset: (assetAddress: Address, amount: string, supplyType: SupplyType) => Promise<void>;
  getUserAssetBalance: (assetAddress: Address, supplyType: SupplyType) => Promise<string>;
  getUserBorrowAmount: (assetAddress: Address) => Promise<string>;
  getSupportedAssets: () => { symbol: string; address: Address }[];
}

// 기본 컨텍스트 값 설정
const defaultContext: Web3ContextType = {
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  walletState: 'disconnected',
  connectWallet: async () => {},
  disconnectWallet: () => {},
  poolContract: null,
  supplyAsset: async () => {},
  borrowAsset: async () => {},
  repayAsset: async () => {},
  withdrawAsset: async () => {},
  getUserAssetBalance: async () => '0',
  getUserBorrowAmount: async () => '0',
  getSupportedAssets: () => [],
};

// Web3 컨텍스트 생성
const Web3Context = createContext<Web3ContextType>(defaultContext);

// 컨텍스트 프로바이더 컴포넌트
export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [walletState, setWalletState] = useState<WalletState>('disconnected');
  const [poolContract, setPoolContract] = useState<ethers.Contract | null>(null);

  // 지갑 연결 함수
  const connectWallet = async () => {
    try {
      console.log("지갑 연결 시작...");
      setWalletState('connecting');

      // 브라우저에 이더리움 객체가 있는지 확인
      if (typeof window !== 'undefined' && window.ethereum) {
        console.log("메타마스크 감지됨");
        // 메타마스크에 연결 요청
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send('eth_requestAccounts', []);
        console.log("연결된 계정:", accounts);
        
        if (accounts.length > 0) {
          const network = await browserProvider.getNetwork();
          console.log("연결된 네트워크:", network);
          const userSigner = await browserProvider.getSigner();
          console.log("사용자 서명자 생성됨");
          
          setProvider(browserProvider);
          setSigner(userSigner);
          setAccount(accounts[0]);
          setChainId(Number(network.chainId));
          setWalletState('connected');
          
          console.log("Pool 컨트랙트 주소:", contractAddresses.pool);
          console.log("Pool ABI:", poolAbi);
          
          try {
            // Pool 컨트랙트 인스턴스 생성
            const pool = new ethers.Contract(
              contractAddresses.pool,
              poolAbi,
              userSigner
            );
            console.log("Pool 컨트랙트 인스턴스 생성됨:", pool);
            
            setPoolContract(pool);
          } catch (error) {
            console.error("컨트랙트 인스턴스 생성 오류:", error);
            alert("컨트랙트 인스턴스 생성 중 오류가 발생했습니다.");
          }
        }
      } else {
        console.log("메타마스크가 설치되어 있지 않음");
        alert('메타마스크를 설치해주세요!');
        setWalletState('disconnected');
      }
    } catch (error) {
      console.error('지갑 연결 오류:', error);
      setWalletState('disconnected');
      alert('지갑 연결 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // 지갑 연결 해제 함수
  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setWalletState('disconnected');
    setPoolContract(null);
  };

  // 이더리움 공급 함수
  const supplyAsset = async (assetAddress: Address, amount: string, supplyType: SupplyType) => {
    console.log("supplyAsset 함수 호출됨:", { assetAddress, amount, supplyType });
    console.log("poolContract:", poolContract);
    console.log("signer:", signer);
    
    if (!poolContract || !signer) {
      console.error("Pool 컨트랙트 또는 서명자가 없음");
      alert('먼저 지갑을 연결해주세요.');
      return;
    }

    try {
      // 이더 단위를 wei로 변환
      const amountInWei = ethers.parseEther(amount);
      console.log("Wei로 변환된 금액:", amountInWei.toString());
      
      // ERC20 토큰인 경우 승인 필요
      if (assetAddress !== '0x0000000000000000000000000000000000000000') {
        console.log("토큰 승인 요청 시작");
        console.log("Asset 주소 유효성 확인:", assetAddress && typeof assetAddress === 'string' && assetAddress.startsWith('0x'));
        try {
          // 토큰 주소가 null 또는 undefined가 아닌지 확인
          if (!assetAddress) {
            throw new Error("토큰 주소가 유효하지 않습니다.");
          }
          
          const tokenContract = new ethers.Contract(
            assetAddress,
            ['function approve(address spender, uint256 amount) public returns (bool)'],
            signer
          );
          
          console.log("Token 컨트랙트:", tokenContract);
          console.log("승인 대상:", contractAddresses.pool);
          
          // Pool 컨트랙트에 토큰 사용 승인
          const approveTx = await tokenContract.approve(contractAddresses.pool, amountInWei);
          console.log("승인 트랜잭션:", approveTx);
          
          console.log("승인 트랜잭션 대기 중...");
          await approveTx.wait();
          console.log("승인 완료");
        } catch (error) {
          console.error("토큰 승인 실패:", error);
          throw new Error("토큰 승인 중 오류 발생: " + (error instanceof Error ? error.message : String(error)));
        }
      }
      
      try {
        // Pool 컨트랙트 함수 확인
        console.log("Pool 컨트랙트 interface 확인:");
        console.log("supply 함수 존재 여부:", !!poolContract.supply);
        
        // 컨트랙트 함수 확인
        const interface_ = poolContract.interface;
        console.log("사용 가능한 함수들:", Object.keys(interface_));
        
        // supply 함수 시그니처 확인
        if (poolContract.supply) {
          console.log("supply 함수 존재함");
        } else {
          console.error("supply 함수를 찾을 수 없음!");
        }
        
        // 자산 공급 트랜잭션 실행
        console.log("공급 트랜잭션 실행 준비", supplyType);
        console.log("자산 주소:", assetAddress);
        console.log("금액:", amountInWei.toString());
        console.log("예치 타입:", supplyType);
        
        // 새로운 컨트랙트 인스턴스 생성 시도
        const newPoolContract = new ethers.Contract(
          contractAddresses.pool,
          poolAbi,
          signer
        );
        
        console.log("새 Pool 컨트랙트 인스턴스:", newPoolContract);
        
        let tx;
        try {
          tx = await newPoolContract.supply(assetAddress, amountInWei, supplyType);
        } catch (error) {
          console.error("공급 트랜잭션 실패 (새 인스턴스):", error);
          console.log("원래 인스턴스로 시도...");
          tx = await poolContract.supply(assetAddress, amountInWei, supplyType, {
            value: assetAddress === '0x0000000000000000000000000000000000000000' ? amountInWei : 0
          });
        }
        
        console.log("공급 트랜잭션:", tx);
        console.log("트랜잭션 대기 중...");
        await tx.wait();
        console.log("트랜잭션 완료");
        
        alert(`${amount} 토큰을 성공적으로 공급했습니다. ${supplyType === SupplyType.DEPOSIT ? '예치 토큰(AToken)' : '아비트라지 토큰(BToken)'}을 받았습니다.`);
      } catch (error) {
        console.error("공급 트랜잭션 실패:", error);
        throw new Error("공급 트랜잭션 중 오류 발생: " + (error instanceof Error ? error.message : String(error)));
      }
    } catch (error) {
      console.error('공급 오류:', error);
      alert('자산 공급 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
      throw error;
    }
  };

  // 자산 대출 함수
  const borrowAsset = async (assetAddress: Address, amount: string) => {
    if (!poolContract || !signer) {
      alert('먼저 지갑을 연결해주세요.');
      return;
    }

    try {
      // 이더 단위를 wei로 변환
      const amountInWei = ethers.parseEther(amount);
      
      // 대출 트랜잭션 실행
      const tx = await poolContract.borrow(assetAddress, amountInWei);
      await tx.wait();
      
      alert(`${amount} 토큰을 성공적으로 대출했습니다.`);
    } catch (error) {
      console.error('대출 오류:', error);
      alert('자산 대출 중 오류가 발생했습니다.');
    }
  };

  // 자산 상환 함수
  const repayAsset = async (assetAddress: Address, amount: string) => {
    if (!poolContract || !signer) {
      alert('먼저 지갑을 연결해주세요.');
      return;
    }

    try {
      // 이더 단위를 wei로 변환
      const amountInWei = ethers.parseEther(amount);
      
      // ERC20 토큰인 경우 승인 필요
      if (assetAddress !== '0x0000000000000000000000000000000000000000') {
        const tokenContract = new ethers.Contract(
          assetAddress,
          ['function approve(address spender, uint256 amount) public returns (bool)'],
          signer
        );
        
        // Pool 컨트랙트에 토큰 사용 승인
        const approveTx = await tokenContract.approve(contractAddresses.pool, amountInWei);
        await approveTx.wait();
      }
      
      // 상환 트랜잭션 실행
      const tx = await poolContract.repay(assetAddress, amountInWei, {
        value: assetAddress === '0x0000000000000000000000000000000000000000' ? amountInWei : 0
      });
      
      await tx.wait();
      alert(`${amount} 토큰을 성공적으로 상환했습니다.`);
    } catch (error) {
      console.error('상환 오류:', error);
      alert('자산 상환 중 오류가 발생했습니다.');
    }
  };

  // 자산 인출 함수
  const withdrawAsset = async (assetAddress: Address, amount: string, supplyType: SupplyType) => {
    if (!poolContract || !signer) {
      alert('먼저 지갑을 연결해주세요.');
      return;
    }

    try {
      // 이더 단위를 wei로 변환
      const amountInWei = ethers.parseEther(amount);
      
      // 인출 트랜잭션 실행
      const tx = await poolContract.withdraw(assetAddress, amountInWei, supplyType);
      await tx.wait();
      
      alert(`${amount} 토큰을 성공적으로 인출했습니다.`);
    } catch (error) {
      console.error('인출 오류:', error);
      alert('자산 인출 중 오류가 발생했습니다.');
    }
  };

  // 사용자 자산 잔액 조회 함수
  const getUserAssetBalance = async (assetAddress: Address, supplyType: SupplyType): Promise<string> => {
    if (!poolContract || !account) {
      return '0';
    }

    try {
      const balanceWei = await poolContract.getUserAssetBalance(assetAddress, account, supplyType);
      return ethers.formatEther(balanceWei);
    } catch (error) {
      console.error('잔액 조회 오류:', error);
      return '0';
    }
  };

  // 사용자 대출 금액 조회 함수
  const getUserBorrowAmount = async (assetAddress: Address): Promise<string> => {
    if (!poolContract || !account) {
      return '0';
    }

    try {
      const borrowAmountWei = await poolContract.getUserBorrowAmount(assetAddress, account);
      return ethers.formatEther(borrowAmountWei);
    } catch (error) {
      console.error('대출 금액 조회 오류:', error);
      return '0';
    }
  };

  // 지원하는 자산 목록 반환 함수
  const getSupportedAssets = () => {
    return Object.entries(contractAddresses.assets).map(([symbol, address]) => ({
      symbol,
      address
    }));
  };

  // 이더리움 이벤트 리스너 설정
  useEffect(() => {
    // 초기 연결 상태 확인
    const checkInitialConnection = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await browserProvider.listAccounts();
          
          if (accounts.length > 0) {
            console.log("기존 연결된 계정 발견:", accounts[0].address);
            connectWallet(); // 자동으로 다시 연결
          }
        }
      } catch (error) {
        console.error("초기 연결 상태 확인 중 오류:", error);
      }
    };
    
    checkInitialConnection();
    
    if (typeof window !== 'undefined' && window.ethereum) {
      // 계정 변경 이벤트 처리
      const handleAccountsChanged = (accounts: string[]) => {
        console.log("계정 변경 감지:", accounts);
        if (accounts.length === 0) {
          // 연결 해제됨
          disconnectWallet();
        } else if (account !== accounts[0]) {
          // 새 계정으로 변경됨
          setAccount(accounts[0]);
        }
      };

      // 체인 변경 이벤트 처리
      const handleChainChanged = (_chainId: string) => {
        console.log("네트워크 변경 감지:", _chainId);
        window.location.reload();
      };

      // 이벤트 리스너 등록
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [account]);
  
  // 컨트랙트 연결 상태 확인
  useEffect(() => {
    if (poolContract && signer) {
      console.log("poolContract와 signer가 모두 설정됨");
      
      // 컨트랙트 연결 테스트
      const testConnection = async () => {
        try {
          // 소유자 주소 조회 등의 간단한 읽기 함수 호출
          const owner = await poolContract.owner();
          console.log("Pool 컨트랙트 소유자:", owner);
          console.log("컨트랙트 연결 성공");
        } catch (error) {
          console.error("컨트랙트 연결 테스트 실패:", error);
        }
      };
      
      testConnection();
    }
  }, [poolContract, signer]);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        walletState,
        connectWallet,
        disconnectWallet,
        poolContract,
        supplyAsset,
        borrowAsset,
        repayAsset,
        withdrawAsset,
        getUserAssetBalance,
        getUserBorrowAmount,
        getSupportedAssets
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

// Web3 컨텍스트 사용을 위한 훅
export const useWeb3 = () => useContext(Web3Context);

// 전역 Window 타입에 ethereum 추가
declare global {
  interface Window {
    ethereum?: any;
  }
} 