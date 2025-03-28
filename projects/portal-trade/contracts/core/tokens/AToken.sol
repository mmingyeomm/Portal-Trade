// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IAToken.sol";

/**
 * @title AToken
 * @dev Implementation of the interest bearing token for the lending protocol.
 */
contract AToken is ERC20, IAToken {
    using SafeERC20 for IERC20;

    address private _underlyingAsset;
    address private _pool;
    address public owner;

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
     * @dev Mints aTokens to the user address
     * @param user The address receiving the minted tokens
     * @param amount The amount of tokens being minted
     */
    function mint(address user, uint256 amount) external override onlyPool {
        _mint(user, amount);
    }

    /**
     * @dev Burns aTokens from the user address
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