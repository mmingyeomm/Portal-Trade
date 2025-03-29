import { ethers } from 'ethers';
import { ERC20_ABI, AMM_ABI, ammA, ammB, usdt, whsk } from './contractData.js';
import dotenv from 'dotenv';
import { BigNumber } from 'ethers';


dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    throw new Error('no private key in .env file');
}

const provider = new ethers.providers.JsonRpcProvider('https://hashkeychain-testnet.alt.technology');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// 최소 수익성 있는 가격 차이 (basis points, 1bp = 0.01%)
const MIN_PROFITABLE_DIFF_BPS = 50; // 0.5%

// 가스 비용 및 슬리피지를 고려한 최소 거래 금액

const MIN_TRADE_AMOUNT = ethers.utils.parseUnits('997', 0); // amm pool 0.5% 최소거래금액. (10000000hsk있다면 50000hsk가 최소거래금액)
const TRADE_AMOUNT=ethers.utils.parseUnits('1000', 0);

// 아비트라지 실행 중인지 확인하는 플래그
let isExecutingArbitrage = false;

async function detectArbitrageOpportunities() {
    if (isExecutingArbitrage) {
        console.log('이미 아비트라지 거래가 진행 중입니다.');
        return { hasOpportunity: false, isExecuting: true };
    }
    
    // 컨트랙트 인스턴스 초기화
    const ammAContract = new ethers.Contract(ammA, AMM_ABI, provider);
    const ammBContract = new ethers.Contract(ammB, AMM_ABI, provider);
    const usdtContract = new ethers.Contract(usdt, ERC20_ABI, provider);
    const whskContract = new ethers.Contract(whsk, ERC20_ABI, provider);

    try {

        
        // USDT 소수점 가져오기
        const usdtDecimals = await usdtContract.decimals();
        const whskDecimals = await whskContract.decimals();
        
        // AMM A에서 리저브 가져오기
        const reservesA = await ammAContract.getReserves();
        
        // AMM A에서 USDT가 어떤 토큰인지 결정
        const isUsdtTokenAInAmmA = reservesA._tokenA.toLowerCase() === usdt.toLowerCase();
        const usdtReserveA = isUsdtTokenAInAmmA ? reservesA._reserveA : reservesA._reserveB;
        const otherReserveA = isUsdtTokenAInAmmA ? reservesA._reserveB : reservesA._reserveA;
        
        // AMM B에서 리저브 가져오기
        const reservesB = await ammBContract.getReserves();
        
        // AMM B에서 USDT가 어떤 토큰인지 결정
        const isUsdtTokenAInAmmB = reservesB._tokenA.toLowerCase() === usdt.toLowerCase();
        const usdtReserveB = isUsdtTokenAInAmmB ? reservesB._reserveA : reservesB._reserveB;
        const whskReserveB = isUsdtTokenAInAmmB ? reservesB._reserveB : reservesB._reserveA;
        
        // 가격 계산 (리저브 비율)
        const priceUsdtInAmmA = otherReserveA.mul(ethers.BigNumber.from(10).pow(usdtDecimals)).div(usdtReserveA);
        const priceUsdtInAmmB = whskReserveB.mul(ethers.BigNumber.from(10).pow(usdtDecimals)).div(usdtReserveB);
        
        // BigNumber를 사람이 읽을 수 있는 형태로 변환
        const formattedPriceInAmmA = ethers.utils.formatUnits(priceUsdtInAmmA, whskDecimals);
        const formattedPriceInAmmB = ethers.utils.formatUnits(priceUsdtInAmmB, whskDecimals);
        
        // 항상 현재 가격 표시
        console.log(`\n--- Current Prices (${new Date().toLocaleTimeString()}) ---`);
        console.log(`USDT/WHSK price in AMM A: ${formattedPriceInAmmA}`);
        console.log(`USDT/WHSK price in AMM B: ${formattedPriceInAmmB}`);
        
        // 가격 차이 백분율 계산
        const priceDiffBps = priceUsdtInAmmA.gt(priceUsdtInAmmB) 
            ? priceUsdtInAmmA.sub(priceUsdtInAmmB).mul(10000).div(priceUsdtInAmmB) 
            : priceUsdtInAmmB.sub(priceUsdtInAmmA).mul(10000).div(priceUsdtInAmmA);
        
        // 가격 차이 백분율 표시
        const priceDiffPercent = priceDiffBps.toNumber() / 100;
        console.log(`Price difference: ${priceDiffPercent.toFixed(2)}%`);
        
        // 아비트라지 가능성 확인 (가스 비용 고려)
        if (priceDiffBps.gt(MIN_PROFITABLE_DIFF_BPS)) {
            //const expectedProfit = calculateExpectedProfit(TRADE_AMOUNT, );
            //if(expectedProfit.gt(0)){
            if(true){
                console.log('\n🚨 ARBITRAGE OPPORTUNITY DETECTED 🚨');

                // 아비트라지 방향 결정
                const isAmmAHigher: boolean = priceUsdtInAmmA.gt(priceUsdtInAmmB);
                if (isAmmAHigher) {
                    console.log(`Direction: Buy USDT from AMM B, sell to AMM A`);
                } else {
                    console.log(`Direction: Buy USDT from AMM A, sell to AMM B`);
                }

                // 아비트라지 실행
                executeArbitrage(
                    isAmmAHigher, 
                    ammAContract, 
                    ammBContract, 
                    usdtContract, 
                    whskContract,
                    isUsdtTokenAInAmmA,
                    isUsdtTokenAInAmmB
                );
            
                return {
                    hasOpportunity: true,
                    priceDiffPercent,
                    priceAmmA: formattedPriceInAmmA,
                    priceAmmB: formattedPriceInAmmB,
                    direction: isAmmAHigher ? 'B->A' : 'A->B'
                };
            }
            
        }
        return { 
            hasOpportunity: false,
            priceAmmA: formattedPriceInAmmA,
            priceAmmB: formattedPriceInAmmB,
            priceDiffPercent
        };
        
    } catch (error) {
        console.error('Error:', error);
        return { hasOpportunity: false, error };
    }
}

async function executeArbitrage(
    isAmmAHigher: boolean, 
    ammAContract: ethers.Contract, 
    ammBContract: ethers.Contract, 
    usdtContract: ethers.Contract, 
    whskContract: ethers.Contract,
    isUsdtTokenAInAmmA: boolean,
    isUsdtTokenAInAmmB: boolean
) {
    try {
        isExecutingArbitrage = true;
        console.log('\n--- EXECUTING ARBITRAGE ---');
        
        // 서명자로 컨트랙트 연결
        const ammAWithSigner = ammAContract.connect(wallet);
        const ammBWithSigner = ammBContract.connect(wallet);
        const usdtWithSigner = usdtContract.connect(wallet);
        const whskWithSigner = whskContract.connect(wallet);
        
        // 현재 잔액 확인
        const initialUsdtBalance = await usdtContract.balanceOf(wallet.address);
        console.log("처음 USDT : ",initialUsdtBalance.toString())
        const initialWhskBalance = await whskContract.balanceOf(wallet.address);
        console.log("처음 WHSK",initialWhskBalance.toString())
        
        // 거래 금액 결정 (실제 구현에서는 최적의 금액을 계산해야 함)
        // 여기서는 간단히 MIN_TRADE_AMOUNT 또는 보유 잔액 중 작은 값을 사용
        let tradeAmount;
        let tokenToUse: string;
        
        if (isAmmAHigher) {

            // AMM B에서 USDT 구매 후 AMM A에 판매
            // WHSK로 시작하는 것이 좋음
            //min_trade_amount
            tradeAmount = initialWhskBalance.gt(MIN_TRADE_AMOUNT) ? TRADE_AMOUNT : ethers.constants.Zero;
            tokenToUse = whsk;
            
            if (tradeAmount.isZero()) {
                console.log('my whsk : ',initialWhskBalance.toString())
                console.log("min_trade_amount",MIN_TRADE_AMOUNT.toString())
                console.log('WHSK 잔액이 최소 거래 금액보다 부족합니다.');
                isExecutingArbitrage = false;
                return;
            }

            // 1. AMM B에 WHSK 승인
            console.log('Approving WHSK for AMM B...');
            const approvalTx1 = await whskWithSigner.approve(ammB, tradeAmount);
            await approvalTx1.wait();
            console.log(`Approval transaction: ${approvalTx1.hash}`);
            
            // 2. AMM B에서 WHSK를 USDT로 스왑
            console.log('Swapping WHSK to USDT in AMM B...');
            console.log(`\n WHSK ${tradeAmount.toString()}만큼 스왑 시도`)
            const swapTx1 = await ammBWithSigner.swap(whsk, tradeAmount);
            await swapTx1.wait();
            console.log(`Swap transaction: ${swapTx1.hash}`);

            new Promise(resolve => setTimeout(resolve, 1000))
            
            // 3. 받은 USDT 확인
            
            const newUsdtBalance = await usdtContract.balanceOf(wallet.address);
            console.log("\n아까 지갑 잔액 USDT ",initialUsdtBalance.toString())
            console.log("\n지금 !!!! 지갑 잔액 USDT ",newUsdtBalance.toString())
            const usdtReceived = await newUsdtBalance.sub(initialUsdtBalance);
            console.log(`Received ${usdtReceived.toString()} USDT`);

            
            // 4. AMM A에 USDT 승인
            console.log('Approving USDT for AMM A...');
            const approvalTx2 = await usdtWithSigner.approve(ammA, usdtReceived);
            await approvalTx2.wait();
            console.log(`Approval transaction: ${approvalTx2.hash}`);
            
            // 5. AMM A에서 USDT를 WHSK로 스왑
            console.log('Swapping USDT to WHSK in AMM A...');
            const swapTx2 = await ammAWithSigner.swap(usdt, usdtReceived);
            await swapTx2.wait();
            console.log(`Swap transaction: ${swapTx2.hash}`);

            // 6. 늘어난 WHSK 확인
            const finalWhskBalance = await whskContract.balanceOf(wallet.address);
            const newWhskReceived = await finalWhskBalance.sub(initialWhskBalance);
            console.log(`Received ${newWhskReceived.toString()} WHSK`);
            
        } else {
            // AMM A에서 USDT 구매 후 AMM B에 판매
            // WHSK로 시작하는 것이 좋음
            tradeAmount = initialWhskBalance.gt(MIN_TRADE_AMOUNT) ? TRADE_AMOUNT: ethers.constants.Zero;
            tokenToUse = whsk;
            
            if (tradeAmount.isZero()) {
                console.log('my whsk : ',initialWhskBalance.toString())
                console.log("min_trade_amount",MIN_TRADE_AMOUNT.toString())
                console.log('WHSK 잔액이 최소 거래 금액보다 부족합니다.');
                isExecutingArbitrage = false;
                return;
            }
            
            // 1. AMM A에 WHSK 승인
            console.log('Approving WHSK for AMM A...');
            const approvalTx1 = await whskWithSigner.approve(ammA, tradeAmount);
            await approvalTx1.wait();
            console.log(`Approval transaction: ${approvalTx1.hash}`);
            
            // 2. AMM A에서 WHSK를 USDT로 스왑
            console.log('Swapping WHSK to USDT in AMM A...');
            console.log(`\n WHSK ${tradeAmount.toString()}만큼 스왑 시도`)
            const swapTx1 = await ammAWithSigner.swap(whsk, tradeAmount);
            await swapTx1.wait();
            console.log(`Swap transaction: ${swapTx1.hash}`);
            
            new Promise(resolve => setTimeout(resolve, 1000))
            // 3. 받은 USDT 확인
            const newUsdtBalance = await usdtContract.balanceOf(wallet.address);
            console.log("\n아까 지갑 잔액 USDT ",initialUsdtBalance.toString())
            console.log("\n지금 지갑 잔액 USDT ",newUsdtBalance.toString())
            const usdtReceived = await newUsdtBalance.sub(initialUsdtBalance);
            console.log(`Received ${usdtReceived.toString()} USDT`);
            
            // 4. AMM B에 USDT 승인
            console.log('Approving USDT for AMM B...');
            const approvalTx2 = await usdtWithSigner.approve(ammB, usdtReceived);
            await approvalTx2.wait();
            console.log(`Approval transaction: ${approvalTx2.hash}`);
            
            // 5. AMM B에서 USDT를 WHSK로 스왑
            console.log('Swapping USDT to WHSK in AMM B...');
            const swapTx2 = await ammBWithSigner.swap(usdt, usdtReceived);
            await swapTx2.wait();
            console.log(`Swap transaction: ${swapTx2.hash}`);

            // 6. 늘어난 WHSK 확인
            const finalWhskBalance = await whskContract.balanceOf(wallet.address);
            const newWhskReceived = await finalWhskBalance.sub(initialWhskBalance);
            console.log(`Received ${newWhskReceived.toString()} WHSK`);
        }
        
        // 최종 잔액 확인 및 수익 계산
        const finalUsdtBalance = await usdtContract.balanceOf(wallet.address)
        const finalWhskBalance = await whskContract.balanceOf(wallet.address)
        
        console.log('\n--- ARBITRAGE COMPLETED ---');
        console.log(`Initial balances - USDT: ${initialUsdtBalance.toString()}, WHSK: ${initialWhskBalance.toString()}`);
        console.log(`Final balances - USDT: ${finalUsdtBalance.toString()}, WHSK: ${finalWhskBalance.toString()}`);
        
        const whskProfit = finalWhskBalance.sub(initialWhskBalance);
        console.log(`Profit: ${whskProfit.toString()} WHSK`);
        
    } catch (error) {
        console.error('Arbitrage execution error:', error);
    } finally {
        isExecutingArbitrage = false;
    }
}

// async function calculateExpectedProfit(
//     tradeAmount: BigNumber,
//     hskReserveFrom: BigNumber,
//     usdtReserveFrom: BigNumber,
//     hskReserveTo: BigNumber,
//     usdtReserveTo: BigNumber
//     ):Promise<BigNumber> {
//     const amountInWithFee = tradeAmount.mul(997);
//     const numeratorB = amountInWithFee.mul(usdtReserveFrom);
//     const denominatorB = hskReserveFrom.mul(1000).add(amountInWithFee);
//     const usdtOut = numeratorB.div(denominatorB); // 1단계: HSK → USDT (from pool)

//     const amountInWithFee2 = usdtOut.mul(997);
//     const numeratorA = amountInWithFee2.mul(hskReserveTo);
//     const denominatorA = usdtReserveTo.mul(1000).add(amountInWithFee2);
//     const hskOut = numeratorA.div(denominatorA); // 2단계: USDT → HSK (to pool)

//     const profit = hskOut.sub(tradeAmount);
//     return profit;
//     }

async function startArbitrageMonitoring(intervalMs = 10000) {
    // 초기 검사
    await detectArbitrageOpportunities();
    
    // 주기적 검사 설정
    setInterval(async () => {
        await detectArbitrageOpportunities();
    }, intervalMs);
}

// 모니터링 시작
startArbitrageMonitoring();
function delay(arg0: number) {
    throw new Error('Function not implemented.');
}

