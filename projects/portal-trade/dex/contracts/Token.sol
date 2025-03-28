// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
//import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";


// contract USDT is ERC20 {
//     constructor(uint256 initialSupply) ERC20("USDT", "USDT") {
//         _mint(msg.sender, initialSupply);
//     }
// }
// contract HSK is ERC20 {
//     constructor(uint256 initialSupply) ERC20("HSK", "HSK") {
//         _mint(msg.sender, initialSupply);
//     }
// }


// CustomERC20 정의
contract CustomERC20 is ERC20 {

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply)
        ERC20(_name, _symbol)
    {
        _mint(msg.sender, _initialSupply);
    }

    // 추가 발행 
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}


// TokenFactory 정의
contract TokenFactory {
    address public owner;
    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    address[] public allTokens;

    event TokenCreated(address token, string name, string symbol, uint256 supply);
    function createToken(string memory name,string memory symbol,uint256 supply) external {
        CustomERC20 newToken = new CustomERC20(name, symbol, supply);
        allTokens.push(address(newToken));
        emit TokenCreated(address(newToken), name, symbol, supply);
    }

    event TokenMinted(address token, address to, uint256 amount);
    function mintToken(address token, address to, uint256 amount) external onlyOwner {
        CustomERC20(token).mint(to, amount);
        emit TokenMinted(token, to, amount);
    }

    event TokenWithdrawn(address token, address to, uint256 amount);
    function withdrawToken(address token, address to, uint256 amount) external onlyOwner {
        require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient balance");
        IERC20(token).transfer(to, amount);
        emit TokenWithdrawn(token, to, amount);
    }

    

    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    function getAllTokenInfos() external view returns (
        address[] memory tokens,
        string[] memory names,
        string[] memory symbols,
        uint256[] memory totalSupplies
    ) {
        uint length = allTokens.length;

        tokens = new address[](length);
        names = new string[](length);
        symbols = new string[](length);
        totalSupplies = new uint256[](length);

        for (uint i = 0; i < length; i++) {
            address token = allTokens[i];
            tokens[i] = token;
            names[i] = CustomERC20(token).name();
            symbols[i] = CustomERC20(token).symbol();
            totalSupplies[i] = CustomERC20(token).totalSupply();
        }
    }

}


//배포할 때 initialSupply = 1000000000000000000000000 -> 100만개임.