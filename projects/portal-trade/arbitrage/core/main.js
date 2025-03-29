"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const contractData_js_1 = require("./contractData.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    throw new Error('no private key in .env file');
}
const provider = new ethers_1.ethers.providers.JsonRpcProvider('https://hashkeychain-testnet.alt.technology');
const wallet = new ethers_1.ethers.Wallet(PRIVATE_KEY, provider);
// 최소 수익성 있는 가격 차이 (basis points, 1bp = 0.01%)
const MIN_PROFITABLE_DIFF_BPS = 50; // 0.5%
// 가스 비용 및 슬리피지를 고려한 최소 거래 금액
const MIN_TRADE_AMOUNT = ethers_1.ethers.utils.parseUnits('10', 18); // 예: 10 USDT
// 아비트라지 실행 중인지 확인하는 플래그
let isExecutingArbitrage = false;
function detectArbitrageOpportunities() {
    return __awaiter(this, void 0, void 0, function* () {
        if (isExecutingArbitrage) {
            console.log('이미 아비트라지 거래가 진행 중입니다.');
            return { hasOpportunity: false, isExecuting: true };
        }
        // 컨트랙트 인스턴스 초기화
        const ammAContract = new ethers_1.ethers.Contract(contractData_js_1.ammA, contractData_js_1.AMM_ABI, provider);
        const ammBContract = new ethers_1.ethers.Contract(contractData_js_1.ammB, contractData_js_1.AMM_ABI, provider);
        const usdtContract = new ethers_1.ethers.Contract(contractData_js_1.usdt, contractData_js_1.ERC20_ABI, provider);
        const whskContract = new ethers_1.ethers.Contract(contractData_js_1.whsk, contractData_js_1.ERC20_ABI, provider);
        try {
            // USDT 소수점 가져오기
            const usdtDecimals = yield usdtContract.decimals();
            const whskDecimals = yield whskContract.decimals();
            // AMM A에서 리저브 가져오기
            const reservesA = yield ammAContract.getReserves();
            // AMM A에서 USDT가 어떤 토큰인지 결정
            const isUsdtTokenAInAmmA = reservesA._tokenA.toLowerCase() === contractData_js_1.usdt.toLowerCase();
            const usdtReserveA = isUsdtTokenAInAmmA ? reservesA._reserveA : reservesA._reserveB;
            const otherReserveA = isUsdtTokenAInAmmA ? reservesA._reserveB : reservesA._reserveA;
            // AMM B에서 리저브 가져오기
            const reservesB = yield ammBContract.getReserves();
            // AMM B에서 USDT가 어떤 토큰인지 결정
            const isUsdtTokenAInAmmB = reservesB._tokenA.toLowerCase() === contractData_js_1.usdt.toLowerCase();
            const usdtReserveB = isUsdtTokenAInAmmB ? reservesB._reserveA : reservesB._reserveB;
            const whskReserveB = isUsdtTokenAInAmmB ? reservesB._reserveB : reservesB._reserveA;
            // 가격 계산 (리저브 비율)
            const priceUsdtInAmmA = otherReserveA.mul(ethers_1.ethers.BigNumber.from(10).pow(usdtDecimals)).div(usdtReserveA);
            const priceUsdtInAmmB = whskReserveB.mul(ethers_1.ethers.BigNumber.from(10).pow(usdtDecimals)).div(usdtReserveB);
            // BigNumber를 사람이 읽을 수 있는 형태로 변환
            const formattedPriceInAmmA = ethers_1.ethers.utils.formatUnits(priceUsdtInAmmA, whskDecimals);
            const formattedPriceInAmmB = ethers_1.ethers.utils.formatUnits(priceUsdtInAmmB, whskDecimals);
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
                console.log('\n🚨 ARBITRAGE OPPORTUNITY DETECTED 🚨');
                // 아비트라지 방향 결정
                const isAmmAHigher = priceUsdtInAmmA.gt(priceUsdtInAmmB);
                if (isAmmAHigher) {
                    console.log(`Direction: Buy USDT from AMM B, sell to AMM A`);
                }
                else {
                    console.log(`Direction: Buy USDT from AMM A, sell to AMM B`);
                }
                // 아비트라지 실행
                executeArbitrage(isAmmAHigher, ammAContract, ammBContract, usdtContract, whskContract, isUsdtTokenAInAmmA, isUsdtTokenAInAmmB);
                return {
                    hasOpportunity: true,
                    priceDiffPercent,
                    priceAmmA: formattedPriceInAmmA,
                    priceAmmB: formattedPriceInAmmB,
                    direction: isAmmAHigher ? 'B->A' : 'A->B'
                };
            }
            return {
                hasOpportunity: false,
                priceAmmA: formattedPriceInAmmA,
                priceAmmB: formattedPriceInAmmB,
                priceDiffPercent
            };
        }
        catch (error) {
            console.error('Error:', error);
            return { hasOpportunity: false, error };
        }
    });
}
function executeArbitrage(isAmmAHigher, ammAContract, ammBContract, usdtContract, whskContract, isUsdtTokenAInAmmA, isUsdtTokenAInAmmB) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            isExecutingArbitrage = true;
            console.log('\n--- EXECUTING ARBITRAGE ---');
            // 서명자로 컨트랙트 연결
            const ammAWithSigner = ammAContract.connect(wallet);
            const ammBWithSigner = ammBContract.connect(wallet);
            const usdtWithSigner = usdtContract.connect(wallet);
            const whskWithSigner = whskContract.connect(wallet);
            // 현재 잔액 확인
            const initialUsdtBalance = yield usdtContract.balanceOf(wallet.address);
            const initialWhskBalance = yield whskContract.balanceOf(wallet.address);
            console.log(initialUsdtBalance.toString(), "\~");
            //디버깅
            //이거 !!!! usdtContract.balanceOf(wallet.address).toString()
            const raw = yield usdtContract.balanceOf(wallet.address);
            console.log("📦 raw value (BigNumber):", raw.toString());
            console.log(`Current balances - USDT: ${initialUsdtBalance.toString()}, WHSK: ${initialWhskBalance.toString()}`);
            // 거래 금액 결정 (실제 구현에서는 최적의 금액을 계산해야 함)
            // 여기서는 간단히 MIN_TRADE_AMOUNT 또는 보유 잔액 중 작은 값을 사용
            let tradeAmount;
            let tokenToUse;
            if (isAmmAHigher) {
                // AMM B에서 USDT 구매 후 AMM A에 판매
                // WHSK로 시작하는 것이 좋음
                //min_trade_amount
                tradeAmount = initialWhskBalance.gt(MIN_TRADE_AMOUNT) ? initialWhskBalance : ethers_1.ethers.constants.Zero;
                tokenToUse = contractData_js_1.whsk;
                if (tradeAmount.isZero()) {
                    console.log('WHSK 잔액이 최소 거래 금액보다 부족합니다.');
                    isExecutingArbitrage = false;
                    return;
                }
                // 1. AMM B에 WHSK 승인
                console.log('Approving WHSK for AMM B...');
                const approvalTx1 = yield whskWithSigner.approve(contractData_js_1.ammB, tradeAmount);
                yield approvalTx1.wait();
                console.log(`Approval transaction: ${approvalTx1.hash}`);
                // 2. AMM B에서 WHSK를 USDT로 스왑
                console.log('Swapping WHSK to USDT in AMM B...');
                const swapTx1 = yield ammBWithSigner.swap(contractData_js_1.whsk, tradeAmount);
                yield swapTx1.wait();
                console.log(`Swap transaction: ${swapTx1.hash}`);
                // 3. 받은 USDT 확인
                const newUsdtBalance = yield usdtContract.balanceOf(wallet.address);
                const usdtReceived = newUsdtBalance.sub(initialUsdtBalance);
                console.log(`Received ${usdtReceived.toString()} USDT`);
                // 4. AMM A에 USDT 승인
                console.log('Approving USDT for AMM A...');
                const approvalTx2 = yield usdtWithSigner.approve(contractData_js_1.ammA, usdtReceived);
                yield approvalTx2.wait();
                console.log(`Approval transaction: ${approvalTx2.hash}`);
                // 5. AMM A에서 USDT를 WHSK로 스왑
                console.log('Swapping USDT to WHSK in AMM A...');
                const swapTx2 = yield ammAWithSigner.swap(contractData_js_1.usdt, usdtReceived);
                yield swapTx2.wait();
                console.log(`Swap transaction: ${swapTx2.hash}`);
            }
            else {
                // AMM A에서 USDT 구매 후 AMM B에 판매
                // WHSK로 시작하는 것이 좋음
                tradeAmount = initialWhskBalance.gt(MIN_TRADE_AMOUNT) ? initialWhskBalance : ethers_1.ethers.constants.Zero;
                tokenToUse = contractData_js_1.whsk;
                if (tradeAmount.isZero()) {
                    console.log('WHSK 잔액이 최소 거래 금액보다 부족합니다.');
                    isExecutingArbitrage = false;
                    return;
                }
                // 1. AMM A에 WHSK 승인
                console.log('Approving WHSK for AMM A...');
                const approvalTx1 = yield whskWithSigner.approve(contractData_js_1.ammA, tradeAmount);
                yield approvalTx1.wait();
                console.log(`Approval transaction: ${approvalTx1.hash}`);
                // 2. AMM A에서 WHSK를 USDT로 스왑
                console.log('Swapping WHSK to USDT in AMM A...');
                const swapTx1 = yield ammAWithSigner.swap(contractData_js_1.whsk, tradeAmount);
                yield swapTx1.wait();
                console.log(`Swap transaction: ${swapTx1.hash}`);
                // 3. 받은 USDT 확인
                const newUsdtBalance = yield usdtContract.balanceOf(wallet.address);
                const usdtReceived = newUsdtBalance.sub(initialUsdtBalance);
                console.log(`Received ${usdtReceived.toString()} USDT`);
                // 4. AMM B에 USDT 승인
                console.log('Approving USDT for AMM B...');
                const approvalTx2 = yield usdtWithSigner.approve(contractData_js_1.ammB, usdtReceived);
                yield approvalTx2.wait();
                console.log(`Approval transaction: ${approvalTx2.hash}`);
                // 5. AMM B에서 USDT를 WHSK로 스왑
                console.log('Swapping USDT to WHSK in AMM B...');
                const swapTx2 = yield ammBWithSigner.swap(contractData_js_1.usdt, usdtReceived);
                yield swapTx2.wait();
                console.log(`Swap transaction: ${swapTx2.hash}`);
            }
            // 최종 잔액 확인 및 수익 계산
            const finalUsdtBalance = yield usdtContract.balanceOf(wallet.address).toString();
            const finalWhskBalance = yield whskContract.balanceOf(wallet.address).toString();
            console.log('\n--- ARBITRAGE COMPLETED ---');
            console.log(`Initial balances - USDT: ${initialUsdtBalance.toString()}, WHSK: ${initialUsdtBalance.toString()}`);
            console.log(`Final balances - USDT: ${finalUsdtBalance.toString()}, WHSK: ${finalWhskBalance.toString()}`);
            const whskProfit = finalWhskBalance.sub(initialWhskBalance);
            console.log(`Profit: ${whskProfit.toStirng()} WHSK`);
        }
        catch (error) {
            console.error('Arbitrage execution error:', error);
        }
        finally {
            isExecutingArbitrage = false;
        }
    });
}
function startArbitrageMonitoring() {
    return __awaiter(this, arguments, void 0, function* (intervalMs = 10000) {
        // 초기 검사
        yield detectArbitrageOpportunities();
        // 주기적 검사 설정
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            yield detectArbitrageOpportunities();
        }), intervalMs);
    });
}
// 모니터링 시작
startArbitrageMonitoring();
