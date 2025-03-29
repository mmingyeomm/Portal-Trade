// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DataTypes
 * @dev Library with the data structures used in the protocol.
 */
library DataTypes {
    /**
     * @dev Represents the state of a reserve.
     */
    struct ReserveData {
        // The address of the aToken contract (deposit token)
        address aTokenAddress;
        // The address of the bToken contract (arbitrage token)
        address bTokenAddress;
        // The total amount of the asset that is supplied to the lending pool
        uint256 totalSupply;
        // The total amount of the asset that is borrowed from the lending pool
        uint256 totalBorrowed;
        // Whether the reserve is active
        bool isActive;
        // The loan to value ratio for this asset (e.g., 75% = 7500)
        uint256 ltv;
        // The liquidation threshold for this asset (e.g., 80% = 8000)
        uint256 liquidationThreshold;
        // The wallet that manages arbitrage operations
        address arbitrageWallet;
    }

    /**
     * @dev Represents a user's borrow position for a specific asset.
     */
    struct UserBorrowData {
        // The total amount borrowed
        uint256 borrowedAmount;
        // Timestamp of last update
        uint40 lastUpdateTimestamp;
    }
    
    /**
     * @dev Defines the types of supply
     */
    enum SupplyType {
        DEPOSIT,     // Regular deposit, represented by aTokens
        ARBITRAGE    // Arbitrage supply, represented by bTokens
    }
}