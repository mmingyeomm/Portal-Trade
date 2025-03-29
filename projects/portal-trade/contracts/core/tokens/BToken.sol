// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../dependencies/openzeppelin/contracts/ERC20.sol";
import "../dependencies/openzeppelin/contracts/IERC20.sol";
import "../dependencies/openzeppelin/contracts/SafeERC20.sol";
import "../dependencies/openzeppelin/contracts/SafeMath.sol";
import "../interfaces/IBToken.sol";

/**
 * @title BToken
 * @dev Implementation of the arbitrage token for the lending protocol.
 */
contract BToken is ERC20, IBToken {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address private _underlyingAsset;
    address private _pool;
    address public owner;
    
    // Yield rate for BToken holders: 5.32% annual yield
    uint256 public constant YIELD_RATE = 532; // 5.32% represented as basis points
    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    uint256 public constant SECONDS_PER_YEAR = 31536000; // 365 days * 24 hours * 60 minutes * 60 seconds
    
    // Last timestamp when yield was calculated
    uint256 public lastYieldCalculationTimestamp;

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    /**
     * @dev Constructor.
     * @param underlyingAsset The address of the underlying asset
     * @param pool The address of the lending pool
     * @param name The name of the token
     * @param symbol The symbol of the token
     */
    constructor(
        address underlyingAsset,
        address pool,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        _underlyingAsset = underlyingAsset;
        _pool = pool;
        owner = msg.sender;
        lastYieldCalculationTimestamp = block.timestamp;
    }

    /**
     * @dev Transfers ownership of the contract to a new account.
     * @param newOwner The address of the new owner.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        owner = newOwner;
    }

    /**
     * @dev Only pool can call functions marked by this modifier.
     */
    modifier onlyPool() {
        require(msg.sender == _pool, "Caller must be the lending pool");
        _;
    }
    
    /**
     * @dev Updates the yield for all token holders
     * Called by the pool before any supply, borrow, withdrawal, or repayment
     */
    function updateYield() external override onlyPool {
        if (block.timestamp > lastYieldCalculationTimestamp && totalSupply() > 0) {
            uint256 timeElapsed = block.timestamp - lastYieldCalculationTimestamp;
            
            // Calculate yield: principal * rate * timeElapsed / secondsPerYear
            uint256 yieldAmount = totalSupply()
                .mul(YIELD_RATE)
                .mul(timeElapsed)
                .div(BASIS_POINTS)
                .div(SECONDS_PER_YEAR);
            
            if (yieldAmount > 0) {
                // Mint new tokens to this contract
                _mint(address(this), yieldAmount);
                
                lastYieldCalculationTimestamp = block.timestamp;
            }
        }
    }
    
    /**
     * @dev Claims yield for a specific user
     * @param user The address of the user claiming yield
     */
    function claimYield(address user) external override onlyPool {
        uint256 totalTokens = totalSupply();
        if (totalTokens == 0) return;
        
        uint256 contractBalance = balanceOf(address(this));
        if (contractBalance == 0) return;
        
        uint256 userBalance = balanceOf(user);
        if (userBalance == 0) return;
        
        // Calculate user's share of the yield
        uint256 userYield = contractBalance.mul(userBalance).div(totalTokens.sub(contractBalance));
        
        if (userYield > 0) {
            // Transfer the yield to the user
            _transfer(address(this), user, userYield);
        }
    }

    /**
     * @dev Mints bTokens to the user address
     * @param user The address receiving the minted tokens
     * @param amount The amount of tokens being minted
     */
    function mint(address user, uint256 amount) external override onlyPool {
        _mint(user, amount);
    }

    /**
     * @dev Burns bTokens from the user address
     * @param user The address of the user tokens are being burned from
     * @param amount The amount of tokens being burned
     * @return The amount of underlying asset that was redeemed
     */
    function burn(address user, uint256 amount) external override onlyPool returns (uint256) {
        _burn(user, amount);
        return amount;
    }

    /**
     * @dev Returns the address of the underlying asset
     * @return The underlying asset address
     */
    function getUnderlyingAsset() external view override returns (address) {
        return _underlyingAsset;
    }
}