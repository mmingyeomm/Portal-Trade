// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IPool
 * @dev Interface for the lending pool contract.
 */
interface IPool {
    /**
     * @dev Emitted when a user supplies an asset to the protocol
     * @param asset The address of the asset being supplied
     * @param user The address of the user supplying the asset
     * @param amount The amount of asset being supplied
     */
    event Supply(address indexed asset, address indexed user, uint256 amount);

    /**
     * @dev Emitted when a user withdraws an asset from the protocol
     * @param asset The address of the asset being withdrawn
     * @param user The address of the user withdrawing the asset
     * @param amount The amount of asset being withdrawn
     */
    event Withdraw(address indexed asset, address indexed user, uint256 amount);

    /**
     * @notice Supplies an amount of underlying asset into the lending pool
     * @param asset The address of the underlying asset to supply
     * @param amount The amount to be supplied
     */
    function supply(address asset, uint256 amount) external;

    /**
     * @notice Withdraws an amount of underlying asset from the lending pool
     * @param asset The address of the underlying asset to withdraw
     * @param amount The amount to be withdrawn
     * @return The actual amount withdrawn
     */
    function withdraw(address asset, uint256 amount) external returns (uint256);

    /**
     * @notice Returns the total balance of an asset supplied by a user
     * @param asset The address of the underlying asset
     * @param user The user address
     * @return The total balance
     */
    function getUserAssetBalance(address asset, address user) external view returns (uint256);

    /**
     * @notice Initializes a new asset reserve in the lending pool
     * @param asset The address of the underlying asset
     * @param aTokenAddress The address of the corresponding aToken (tokenized deposit)
     */
    function initReserve(address asset, address aTokenAddress) external;

    /**
     * @notice Returns the address of the aToken for a given asset
     * @param asset The address of the underlying asset
     * @return The address of the corresponding aToken
     */
    function getReserveAToken(address asset) external view returns (address);
}