// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IAToken
 * @dev Interface for the aToken contract.
 */
interface IAToken is IERC20 {
    /**
     * @dev Mints aTokens to the user address
     * @param user The address receiving the minted tokens
     * @param amount The amount of tokens being minted
     */
    function mint(address user, uint256 amount) external;

    /**
     * @dev Burns aTokens from the user address
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
}