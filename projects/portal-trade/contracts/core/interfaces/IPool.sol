// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/DataTypes.sol";

/**
 * @title IPool
 * @dev Interface for the lending pool contract.
 */
interface IPool {
    /**
     * @dev Emitted when a user claims yield
     * @param asset The address of the asset for which yield is claimed
     * @param user The address of the user claiming the yield
     * @param supplyType The type of supply (0=deposit, 1=arbitrage)
     */
    event YieldClaimed(address indexed asset, address indexed user, DataTypes.SupplyType supplyType);
    
    /**
     * @dev Emitted when a user supplies an asset to the protocol
     * @param asset The address of the asset being supplied
     * @param user The address of the user supplying the asset
     * @param amount The amount of asset being supplied
     * @param supplyType The type of supply (0=deposit, 1=arbitrage)
     */
    event Supply(address indexed asset, address indexed user, uint256 amount, DataTypes.SupplyType supplyType);

    /**
     * @dev Emitted when a user withdraws an asset from the protocol
     * @param asset The address of the asset being withdrawn
     * @param user The address of the user withdrawing the asset
     * @param amount The amount of asset being withdrawn
     * @param supplyType The type of withdrawal (0=deposit, 1=arbitrage)
     */
    event Withdraw(address indexed asset, address indexed user, uint256 amount, DataTypes.SupplyType supplyType);

    /**
     * @dev Emitted when a user borrows an asset from the protocol
     * @param asset The address of the asset being borrowed
     * @param user The address of the user borrowing the asset
     * @param amount The amount of asset being borrowed
     */
    event Borrow(address indexed asset, address indexed user, uint256 amount);

    /**
     * @dev Emitted when a user repays a borrowed asset
     * @param asset The address of the asset being repaid
     * @param user The address of the user repaying the asset
     * @param amount The amount of asset being repaid
     */
    event Repay(address indexed asset, address indexed user, uint256 amount);

    /**
     * @notice Supplies an amount of underlying asset into the lending pool
     * @param asset The address of the underlying asset to supply
     * @param amount The amount to be supplied
     * @param supplyType The type of supply (deposit or arbitrage)
     */
    function supply(address asset, uint256 amount, DataTypes.SupplyType supplyType) external;

    /**
     * @notice Withdraws an amount of underlying asset from the lending pool
     * @param asset The address of the underlying asset to withdraw
     * @param amount The amount to be withdrawn
     * @param supplyType The type of withdrawal (from deposit or arbitrage)
     * @return The actual amount withdrawn
     */
    function withdraw(address asset, uint256 amount, DataTypes.SupplyType supplyType) external returns (uint256);

    /**
     * @notice Allows users to borrow a specific amount of an asset from the protocol
     * @param asset The address of the underlying asset to borrow
     * @param amount The amount to be borrowed
     */
    function borrow(address asset, uint256 amount) external;

    /**
     * @notice Repays a borrowed amount on a specific asset
     * @param asset The address of the underlying asset being repaid
     * @param amount The amount to be repaid
     * - Send type(uint256).max to repay the entire debt
     * @return The final amount repaid
     */
    function repay(address asset, uint256 amount) external returns (uint256);

    /**
     * @notice Returns the total balance of an asset supplied by a user
     * @param asset The address of the underlying asset
     * @param user The user address
     * @param supplyType The type of supply (deposit or arbitrage)
     * @return The total balance
     */
    function getUserAssetBalance(address asset, address user, DataTypes.SupplyType supplyType) external view returns (uint256);

    /**
     * @notice Returns the total amount of an asset borrowed by a user
     * @param asset The address of the underlying asset
     * @param user The user address
     * @return The borrowed amount
     */
    function getUserBorrowAmount(address asset, address user) external view returns (uint256);

    /**
     * @notice Initializes a new asset reserve in the lending pool
     * @param asset The address of the underlying asset
     * @param aTokenAddress The address of the corresponding aToken (tokenized deposit)
     * @param bTokenAddress The address of the corresponding bToken (tokenized arbitrage)
     */
    function initReserve(address asset, address aTokenAddress, address bTokenAddress) external;

    /**
     * @notice Sets the loan-to-value ratio for an asset
     * @param asset The address of the underlying asset
     * @param ltv The loan-to-value ratio (in basis points, e.g. 7500 for 75%)
     * @param liquidationThreshold The liquidation threshold (in basis points, e.g. 8000 for 80%)
     */
    function setAssetLtvAndThreshold(address asset, uint256 ltv, uint256 liquidationThreshold) external;

    /**
     * @notice Returns the address of the aToken for a given asset
     * @param asset The address of the underlying asset
     * @return The address of the corresponding aToken
     */
    function getReserveAToken(address asset) external view returns (address);

    /**
     * @notice Returns the address of the bToken for a given asset
     * @param asset The address of the underlying asset
     * @return The address of the corresponding bToken
     */
    function getReserveBToken(address asset) external view returns (address);

    /**
     * @notice Returns both A and B token addresses for a given asset
     * @param asset The address of the underlying asset
     * @return aToken The address of the corresponding aToken
     * @return bToken The address of the corresponding bToken
     */
    function getReserveTokens(address asset) external view returns (address aToken, address bToken);
    
    
    /**
     * @notice Claims yield for a user
     * @param asset The address of the asset
     * @param supplyType The type of supply (deposit or arbitrage)
     */
    function claimYield(address asset, DataTypes.SupplyType supplyType) external;

    /**
     * @notice Changes the arbitrage wallet address
     * @param newArbitrageWallet The address of the new arbitrage wallet
     */
    function changeArbitrageWallet(address newArbitrageWallet) external;
    
    /**
     * @notice Get the arbitrage wallet address
     * @return The address of the arbitrage wallet
     */
    function arbitrageWallet() external view returns (address);
    
    /**
     * @notice Transfers yield to the arbitrage wallet
     * @param asset The address of the underlying asset
     * @param amount The amount to be transferred
     */
    function transferToArbitrageWallet(address asset, uint256 amount) external;
}