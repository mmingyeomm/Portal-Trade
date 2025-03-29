// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../dependencies/openzeppelin/contracts/IERC20.sol";

/**
 * @title IBToken
 * @dev Interface for the bToken contract (arbitrage token).
 */
interface IBToken is IERC20 {
    /**
     * @dev Mints bTokens to the user address
     * @param user The address receiving the minted tokens
     * @param amount The amount of tokens being minted
     */
    function mint(address user, uint256 amount) external;

    /**
     * @dev Burns bTokens from the user address
     * @param user The address of the user tokens are being burned from
     * @param amount The amount of tokens being burned
     * @return The amount of underlying asset that was redeemed
     */
    function burn(address user, uint256 amount) external returns (uint256);

    /**
     * @dev Returns the address of the underlying asset
     * @return The underlying asset address
     */
    function getUnderlyingAsset() external view returns (address);
    
    /**
     * @dev Updates the yield for all token holders
     * Called by the pool before any supply, borrow, withdrawal, or repayment
     */
    function updateYield() external;
    
    /**
     * @dev Claims yield for a specific user
     * @param user The address of the user claiming yield
     */
    function claimYield(address user) external;
}