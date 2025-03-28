// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./openzeppelin-contracts-master/contracts/token/ERC20/IERC20.sol";

contract Pair {
    address public tokenA; 
    address public tokenB;

    uint public reserveA; //A 보유량
    uint public reserveB; //B 보유량

    bool public initialized; //factory에서 호출 토큰 쌍이 세팅 되었는가!

    event LiquidityAdded(address indexed provider, uint amountA, uint amountB);
    event Swapped(address indexed user, address tokenIn, uint amountIn, address tokenOut, uint amountOut);

    //Factory에서의 양방향 저장이랑 합이 맞는지 검토 바람.
    function initialize(address _tokenA, address _tokenB) external {
        require(!initialized, "Already initialized");
        (tokenA, tokenB) = _tokenA < _tokenB ? (_tokenA, _tokenB) : (_tokenB, _tokenA);
        initialized = true;
    }

    //유동성 추가
    function addLiquidity(address _tokenA, uint _amountA, address _tokenB, uint _amountB) external {
        IERC20(_tokenA).transferFrom(msg.sender, address(this), _amountA);
        IERC20(_tokenB).transferFrom(msg.sender, address(this), _amountB);

        reserveA += _amountA;
        reserveB += _amountB;

        emit LiquidityAdded(msg.sender, _amountA, _amountB);
    }

    function swap(address tokenIn, uint amountIn) external {
        require(tokenIn == tokenA || tokenIn == tokenB, "not token of this pool");

        address tokenOut = tokenIn == tokenA ? tokenB : tokenA; //넣은게 A면 out은 B로 

        (uint reserveIn, uint reserveOut) = tokenIn == tokenA ? (reserveA, reserveB) : (reserveB, reserveA);

        // 0.3% 수수료, x*y=k 방식 적용
        uint amountInWithFee = amountIn * 997 / 1000;
        uint amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);

        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);

        // reserve 업데이트
        if (tokenIn == tokenA) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }

        emit Swapped(msg.sender, tokenIn, amountIn, tokenOut, amountOut);
    }

    //유동성 풀 보기 
    function getReserves() external view returns (address _tokenA, uint _reserveA, address _tokenB, uint _reserveB) {
        return (tokenA, reserveA, tokenB, reserveB);
    }

    //tokenIn 기준으로 tokenOut 수량 계산
    function getAmountOut(address tokenIn, uint amountIn) external view returns (uint) {
        require(reserveA > 0 && reserveB > 0, "No liquidity");
        require(tokenIn == tokenA || tokenIn == tokenB, "Invalid token");

        if (tokenIn == tokenA) {
            return (amountIn * reserveB) / reserveA;
        } else {
            return (amountIn * reserveA) / reserveB;
        }
    }
}
