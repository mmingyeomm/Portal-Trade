// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Pair.sol"; // 나중에 만들 Pair.sol 사용 예정

contract Factory {
    mapping(address => mapping(address => address)) public getPair; //HSK-USDT & USDT-HSK 이 두 페어의 주소를 양방향 저장
    address[] public allPairs;

    event PairCreated(address tokenA, address tokenB, address pair); //토큰1, 토큰2의 pool 생성!

    //새로운 pool(pair) 생성
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "IDENTICAL_TOKENS"); // 두 토큰은 달라야지.
        require(tokenA != address(0) && tokenB != address(0), "ZERO_ADDRESS");
        require(getPair[tokenA][tokenB] == address(0), "PAIR_EXISTS");

        bytes memory bytecode = type(Pair).creationCode;  //pair 컨트랙트의 바이트코드 메모리로 가져옴.
        bytes32 salt = keccak256(abi.encodePacked(tokenA, tokenB));

        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt) //예측가능 주소+A-B 토큰들의 풀 중복생성 방지
        }

        Pair(pair).initialize(tokenA, tokenB);

        getPair[tokenA][tokenB] = pair;
        getPair[tokenB][tokenA] = pair; //양방향 저장.
        allPairs.push(pair);

        emit PairCreated(tokenA, tokenB, pair);
    }

    //모든 Pair Pool 주소 배열로 보기
    function getAllPairs() external view returns (address[] memory) {
        return allPairs;
    }
}
