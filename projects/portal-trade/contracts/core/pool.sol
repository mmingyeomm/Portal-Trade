// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IPool.sol";
import "./interfaces/IAToken.sol";
import "./libraries/DataTypes.sol";

/**
 * @title Pool
 * @dev Main contract of the lending protocol, manages supplies and withdrawals.
 */
contract Pool is IPool, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Owner address that can perform admin operations
    address public owner;

    // Mapping of asset address => reserve data
    mapping(address => DataTypes.ReserveData) private _reserves;
    
    // List of all active reserve addresses
    address[] private _reservesList;

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    /**
     * @dev Constructor sets the original owner of the contract.
     */
    constructor() {
        owner = msg.sender;
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
     * @dev Initializes a new asset reserve in the lending pool
     * @param asset The address of the underlying asset
     * @param aTokenAddress The address of the corresponding aToken (tokenized deposit)
     */
    function initReserve(address asset, address aTokenAddress) external override onlyOwner {
        require(asset != address(0), "Asset cannot be zero address");
        require(aTokenAddress != address(0), "aToken cannot be zero address");
        require(_reserves[asset].aTokenAddress == address(0), "Reserve already initialized");

        _reserves[asset] = DataTypes.ReserveData({
            aTokenAddress: aTokenAddress,
            totalSupply: 0,
            isActive: true
        });

        _reservesList.push(asset);

        emit ReserveInitialized(asset, aTokenAddress);
    }

    /**
     * @notice Supplies an amount of underlying asset into the lending pool
     * @param asset The address of the underlying asset to supply
     * @param amount The amount to be supplied
     */
    function supply(address asset, uint256 amount) external override nonReentrant {
        require(_reserves[asset].isActive, "Reserve is not active");
        require(amount > 0, "Amount must be greater than 0");

        DataTypes.ReserveData storage reserve = _reserves[asset];

        // Transfer underlying asset from user to pool
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Mint aTokens to user
        IAToken(reserve.aTokenAddress).mint(msg.sender, amount);

        // Update reserve data
        reserve.totalSupply += amount;

        emit Supply(asset, msg.sender, amount);
    }

    /**
     * @notice Withdraws an amount of underlying asset from the lending pool
     * @param asset The address of the underlying asset to withdraw
     * @param amount The amount to be withdrawn
     * @return The actual amount withdrawn
     */
    function withdraw(address asset, uint256 amount) external override nonReentrant returns (uint256) {
        require(_reserves[asset].isActive, "Reserve is not active");
        require(amount > 0, "Amount must be greater than 0");

        DataTypes.ReserveData storage reserve = _reserves[asset];
        
        uint256 userBalance = IAToken(reserve.aTokenAddress).balanceOf(msg.sender);
        
        // If amount is type(uint256).max, withdraw everything
        uint256 amountToWithdraw = amount;
        if (amount == type(uint256).max) {
            amountToWithdraw = userBalance;
        }
        
        require(amountToWithdraw <= userBalance, "Not enough balance");
        require(amountToWithdraw <= reserve.totalSupply, "Not enough liquidity in reserve");

        // Burn aTokens from user
        IAToken(reserve.aTokenAddress).burn(msg.sender, amountToWithdraw);

        // Transfer underlying asset from pool to user
        IERC20(asset).safeTransfer(msg.sender, amountToWithdraw);

        // Update reserve data
        reserve.totalSupply -= amountToWithdraw;

        emit Withdraw(asset, msg.sender, amountToWithdraw);

        return amountToWithdraw;
    }

    /**
     * @notice Returns the total balance of an asset supplied by a user
     * @param asset The address of the underlying asset
     * @param user The user address
     * @return The total balance
     */
    function getUserAssetBalance(address asset, address user) external view override returns (uint256) {
        require(_reserves[asset].aTokenAddress != address(0), "Reserve does not exist");
        
        return IAToken(_reserves[asset].aTokenAddress).balanceOf(user);
    }

    /**
     * @notice Returns the address of the aToken for a given asset
     * @param asset The address of the underlying asset
     * @return The address of the corresponding aToken
     */
    function getReserveAToken(address asset) external view override returns (address) {
        return _reserves[asset].aTokenAddress;
    }

    /**
     * @notice Returns a list of all initialized reserve addresses
     * @return The addresses of all reserves
     */
    function getReservesList() external view returns (address[] memory) {
        return _reservesList;
    }

    /**
     * @notice Emitted when a new reserve is initialized
     * @param asset The address of the underlying asset
     * @param aToken The address of the aToken
     */
    event ReserveInitialized(address indexed asset, address indexed aToken);
}