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
        // The address of the aToken contract
        address aTokenAddress;
        // The total amount of the asset that is supplied to the lending pool
        uint256 totalSupply;
        // Whether the reserve is active
        bool isActive;
    }
}