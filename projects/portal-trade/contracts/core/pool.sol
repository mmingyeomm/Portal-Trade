// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./dependencies/openzeppelin/contracts/IERC20.sol";
import "./dependencies/openzeppelin/contracts/SafeERC20.sol"; 
import "./dependencies/openzeppelin/contracts/ReentrancyGuard.sol";

import "./interfaces/IPool.sol";
import "./interfaces/IAToken.sol";
import "./interfaces/IBToken.sol";
import "./libraries/DataTypes.sol";

/**
 * @title Pool
 * @dev Main contract of the lending protocol, manages supplies, withdrawals, borrows, and repayments.
 */
contract Pool is IPool, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Owner address that can perform admin operations
    address public owner;

    // Default arbitrage wallet
    address public arbitrageWallet;

    // Mapping of asset address => reserve data
    mapping(address => DataTypes.ReserveData) private _reserves;
    
    // List of all active reserve addresses
    address[] private _reservesList;

    // Mapping of user address => asset address => borrow data
    mapping(address => mapping(address => DataTypes.UserBorrowData)) private _userBorrows;

    // Basis points divisor (100% = 10000)
    uint256 constant PERCENTAGE_FACTOR = 10000;
    
    /**
     * @dev Emitted when the arbitrage wallet is changed
     * @param oldArbitrageWallet The previous arbitrage wallet address
     * @param newArbitrageWallet The new arbitrage wallet address
     */
    event ArbitrageWalletChanged(address indexed oldArbitrageWallet, address indexed newArbitrageWallet);

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
    constructor(address _arbitrageWallet) {
        owner = msg.sender;
        arbitrageWallet = _arbitrageWallet; 
    }

    /**
     * @notice Changes the arbitrage wallet address
     * @param newArbitrageWallet The address of the new arbitrage wallet
     */
    function changeArbitrageWallet(address newArbitrageWallet) external override onlyOwner {
        require(newArbitrageWallet != address(0), "New arbitrage wallet cannot be the zero address");
        
        address oldArbitrageWallet = arbitrageWallet;
        arbitrageWallet = newArbitrageWallet;
        
        // Update the arbitrage wallet for all reserves
        for (uint256 i = 0; i < _reservesList.length; i++) {
            address asset = _reservesList[i];
            _reserves[asset].arbitrageWallet = newArbitrageWallet;
        }
        
        emit ArbitrageWalletChanged(oldArbitrageWallet, newArbitrageWallet);
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
     * @param bTokenAddress The address of the corresponding bToken (tokenized arbitrage)
     */
    function initReserve(
        address asset, 
        address aTokenAddress, 
        address bTokenAddress
    ) external override onlyOwner {
        require(asset != address(0), "Asset cannot be zero address");
        require(aTokenAddress != address(0), "aToken cannot be zero address");
        require(bTokenAddress != address(0), "bToken cannot be zero address");
        require(_reserves[asset].aTokenAddress == address(0), "Reserve already initialized");

        _reserves[asset] = DataTypes.ReserveData({
            aTokenAddress: aTokenAddress,
            bTokenAddress: bTokenAddress,
            totalSupply: 0,
            totalBorrowed: 0,
            isActive: true,
            ltv: 7500, // Default 75% LTV
            liquidationThreshold: 8000, // Default 80% liquidation threshold
            arbitrageWallet: arbitrageWallet
        });

        _reservesList.push(asset);

        emit ReserveInitialized(asset, aTokenAddress, bTokenAddress);
    }

    /**
     * @notice Sets the loan-to-value ratio for an asset
     * @param asset The address of the underlying asset
     * @param ltv The loan-to-value ratio (in basis points, e.g. 7500 for 75%)
     * @param liquidationThreshold The liquidation threshold (in basis points, e.g. 8000 for 80%)
     */
    function setAssetLtvAndThreshold(
        address asset, 
        uint256 ltv, 
        uint256 liquidationThreshold
    ) external override onlyOwner {
        require(_reserves[asset].aTokenAddress != address(0), "Reserve does not exist");
        require(ltv <= 9000, "LTV too high"); // Max 90% LTV
        require(liquidationThreshold > ltv, "Liquidation threshold must be higher than LTV");
        require(liquidationThreshold <= 9500, "Liquidation threshold too high"); // Max 95%

        DataTypes.ReserveData storage reserve = _reserves[asset];
        reserve.ltv = ltv;
        reserve.liquidationThreshold = liquidationThreshold;
    }

    /**
     * @notice Supplies an amount of underlying asset into the lending pool
     * @param asset The address of the underlying asset to supply
     * @param amount The amount to be supplied
     * @param supplyType The type of supply (deposit or arbitrage)
     */
    function supply(
        address asset, 
        uint256 amount, 
        DataTypes.SupplyType supplyType
    ) external override nonReentrant {
        require(_reserves[asset].isActive, "Reserve is not active");
        require(amount > 0, "Amount must be greater than 0");

        DataTypes.ReserveData storage reserve = _reserves[asset];

        // Update yields before any state changes
        if (supplyType == DataTypes.SupplyType.DEPOSIT) {
            IAToken(reserve.aTokenAddress).updateYield();
        } else if (supplyType == DataTypes.SupplyType.ARBITRAGE) {
            IBToken(reserve.bTokenAddress).updateYield();
        }

        // Transfer underlying asset from user to pool
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        if (supplyType == DataTypes.SupplyType.DEPOSIT) {
            // Mint aTokens to user for deposit
            IAToken(reserve.aTokenAddress).mint(msg.sender, amount);
        } else if (supplyType == DataTypes.SupplyType.ARBITRAGE) {
            // Verify user is the arbitrage wallet or owner
            require(
                msg.sender == reserve.arbitrageWallet || msg.sender == owner,
                "Only arbitrage wallet or owner can perform arbitrage operations"
            );
            // Mint bTokens to user for arbitrage
            IBToken(reserve.bTokenAddress).mint(msg.sender, amount);
        } else {
            revert("Invalid supply type");
        }

        // Update reserve data
        reserve.totalSupply += amount;

        emit Supply(asset, msg.sender, amount, supplyType);
    }

    /**
     * @notice Withdraws an amount of underlying asset from the lending pool
     * @param asset The address of the underlying asset to withdraw
     * @param amount The amount to be withdrawn
     * @param supplyType The type of withdrawal (from deposit or arbitrage)
     * @return The actual amount withdrawn
     */
    function withdraw(
        address asset, 
        uint256 amount, 
        DataTypes.SupplyType supplyType
    ) external override nonReentrant returns (uint256) {
        require(_reserves[asset].isActive, "Reserve is not active");
        require(amount > 0, "Amount must be greater than 0");

        DataTypes.ReserveData storage reserve = _reserves[asset];
        
        address tokenAddress;
        
        // Update yields and claim yield for the user before any state changes
        if (supplyType == DataTypes.SupplyType.DEPOSIT) {
            tokenAddress = reserve.aTokenAddress;
            IAToken(tokenAddress).updateYield();
            IAToken(tokenAddress).claimYield(msg.sender);
        } else if (supplyType == DataTypes.SupplyType.ARBITRAGE) {
            // Verify user is the arbitrage wallet or owner
            require(
                msg.sender == reserve.arbitrageWallet || msg.sender == owner,
                "Only arbitrage wallet or owner can perform arbitrage operations"
            );
            tokenAddress = reserve.bTokenAddress;
            IBToken(tokenAddress).updateYield();
            IBToken(tokenAddress).claimYield(msg.sender);
        } else {
            revert("Invalid supply type");
        }
        
        uint256 userBalance;
        
        if (supplyType == DataTypes.SupplyType.DEPOSIT) {
            userBalance = IAToken(tokenAddress).balanceOf(msg.sender);
        } else if (supplyType == DataTypes.SupplyType.ARBITRAGE) {
            userBalance = IBToken(tokenAddress).balanceOf(msg.sender);
        }
        
        // If amount is type(uint256).max, withdraw everything
        uint256 amountToWithdraw = amount;
        if (amount == type(uint256).max) {
            amountToWithdraw = userBalance;
        }
        
        require(amountToWithdraw <= userBalance, "Not enough balance");
        require(amountToWithdraw <= reserve.totalSupply, "Not enough liquidity in reserve");

        // Check if the withdrawal would bring the user's collateral below their borrow position
        // Only for deposit tokens (aTokens) as they are used as collateral
        if (supplyType == DataTypes.SupplyType.DEPOSIT) {
            require(_checkCollateralAfterWithdraw(asset, msg.sender, amountToWithdraw), 
                "Health factor would drop below 1");
        }

        // Burn tokens from user
        if (supplyType == DataTypes.SupplyType.DEPOSIT) {
            IAToken(tokenAddress).burn(msg.sender, amountToWithdraw);
        } else {
            IBToken(tokenAddress).burn(msg.sender, amountToWithdraw);
        }

        // Transfer underlying asset from pool to user
        IERC20(asset).safeTransfer(msg.sender, amountToWithdraw);

        // Update reserve data
        reserve.totalSupply -= amountToWithdraw;

        emit Withdraw(asset, msg.sender, amountToWithdraw, supplyType);

        return amountToWithdraw;
    }

    /**
     * @notice Allows users to borrow a specific amount of an asset from the protocol
     * @param asset The address of the underlying asset to borrow
     * @param amount The amount to be borrowed
     */
    function borrow(address asset, uint256 amount) external override nonReentrant {
        require(_reserves[asset].isActive, "Reserve is not active");
        require(amount > 0, "Amount must be greater than 0");

        DataTypes.ReserveData storage reserve = _reserves[asset];
        
        // Update yields for both token types before any state changes
        IAToken(reserve.aTokenAddress).updateYield();
        IBToken(reserve.bTokenAddress).updateYield();
        
        // Check available liquidity
        uint256 availableLiquidity = reserve.totalSupply - reserve.totalBorrowed;
        require(amount <= availableLiquidity, "Not enough liquidity in reserve");

        // Check user's borrow capacity based on their collateral
        require(_checkUserBorrowAllowance(asset, msg.sender, amount), "Not enough collateral");

        // Update user's borrow data
        DataTypes.UserBorrowData storage userData = _userBorrows[msg.sender][asset];
        userData.borrowedAmount += amount;
        userData.lastUpdateTimestamp = uint40(block.timestamp);

        // Update reserve data
        reserve.totalBorrowed += amount;

        // Transfer assets to the user
        IERC20(asset).safeTransfer(msg.sender, amount);

        emit Borrow(asset, msg.sender, amount);
    }

    /**
     * @notice Repays a borrowed amount on a specific asset
     * @param asset The address of the underlying asset being repaid
     * @param amount The amount to be repaid
     * - Send type(uint256).max to repay the entire debt
     * @return The final amount repaid
     */
    function repay(address asset, uint256 amount) external override nonReentrant returns (uint256) {
        require(_reserves[asset].isActive, "Reserve is not active");
        require(amount > 0, "Amount must be greater than 0");

        DataTypes.ReserveData storage reserve = _reserves[asset];
        DataTypes.UserBorrowData storage userData = _userBorrows[msg.sender][asset];
        
        require(userData.borrowedAmount > 0, "No debt to repay");

        // Update yields for both token types before any state changes
        IAToken(reserve.aTokenAddress).updateYield();
        IBToken(reserve.bTokenAddress).updateYield();

        // If amount is type(uint256).max, repay the entire debt
        uint256 amountToRepay = amount;
        if (amount == type(uint256).max) {
            amountToRepay = userData.borrowedAmount;
        }
        
        // Cap the repayment to the actual debt
        if (amountToRepay > userData.borrowedAmount) {
            amountToRepay = userData.borrowedAmount;
        }

        // Transfer the asset from the user to the pool
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amountToRepay);

        // Update user's borrow data
        userData.borrowedAmount -= amountToRepay;
        userData.lastUpdateTimestamp = uint40(block.timestamp);

        // Update reserve data
        reserve.totalBorrowed -= amountToRepay;

        emit Repay(asset, msg.sender, amountToRepay);

        return amountToRepay;
    }

    /**
     * @notice Claims yield for a user
     * @param asset The address of the asset 
     * @param supplyType The type of supply (deposit or arbitrage)
     */
    function claimYield(address asset, DataTypes.SupplyType supplyType) external nonReentrant {
        require(_reserves[asset].isActive, "Reserve is not active");
        
        DataTypes.ReserveData storage reserve = _reserves[asset];
        
        if (supplyType == DataTypes.SupplyType.DEPOSIT) {
            IAToken(reserve.aTokenAddress).updateYield();
            IAToken(reserve.aTokenAddress).claimYield(msg.sender);
        } else if (supplyType == DataTypes.SupplyType.ARBITRAGE) {
            // Verify user is the arbitrage wallet or owner
            require(
                msg.sender == reserve.arbitrageWallet || msg.sender == owner,
                "Only arbitrage wallet or owner can perform arbitrage operations"
            );
            IBToken(reserve.bTokenAddress).updateYield();
            IBToken(reserve.bTokenAddress).claimYield(msg.sender);
        } else {
            revert("Invalid supply type");
        }
        
        emit YieldClaimed(asset, msg.sender, supplyType);
    }

    /**
     * @notice Returns the total balance of an asset supplied by a user
     * @param asset The address of the underlying asset
     * @param user The user address
     * @param supplyType The type of supply (deposit or arbitrage)
     * @return The total balance
     */
    function getUserAssetBalance(
        address asset, 
        address user,
        DataTypes.SupplyType supplyType
    ) external view override returns (uint256) {
        require(_reserves[asset].aTokenAddress != address(0), "Reserve does not exist");
        
        if (supplyType == DataTypes.SupplyType.DEPOSIT) {
            return IAToken(_reserves[asset].aTokenAddress).balanceOf(user);
        } else if (supplyType == DataTypes.SupplyType.ARBITRAGE) {
            return IBToken(_reserves[asset].bTokenAddress).balanceOf(user);
        } else {
            revert("Invalid supply type");
        }
    }

    /**
     * @notice Returns the total amount of an asset borrowed by a user
     * @param asset The address of the underlying asset
     * @param user The user address
     * @return The borrowed amount
     */
    function getUserBorrowAmount(address asset, address user) external view override returns (uint256) {
        return _userBorrows[user][asset].borrowedAmount;
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
     * @notice Returns the address of the bToken for a given asset
     * @param asset The address of the underlying asset
     * @return The address of the corresponding bToken
     */
    function getReserveBToken(address asset) external view override returns (address) {
        return _reserves[asset].bTokenAddress;
    }

    /**
     * @notice Returns a list of all initialized reserve addresses
     * @return The addresses of all reserves
     */
    function getReservesList() external view returns (address[] memory) {
        return _reservesList;
    }


    /**
     * @notice Returns both A and B token addresses for a given asset
     * @param asset The address of the underlying asset
     * @return aToken The address of the corresponding aToken
     * @return bToken The address of the corresponding bToken
     */
    function getReserveTokens(address asset) external view override returns (address aToken, address bToken) {
        aToken = _reserves[asset].aTokenAddress;
        bToken = _reserves[asset].bTokenAddress;
        return (aToken, bToken);
    }

    /**
     * @notice Calculates the total value of a user's collateral in terms of a specific base asset
     * @param user The user address
     * @return totalCollateralValue The total value of the user's collateral
     */
    function _calculateUserCollateral(address user) internal view returns (uint256 totalCollateralValue) {
        totalCollateralValue = 0;
        
        for (uint256 i = 0; i < _reservesList.length; i++) {
            address asset = _reservesList[i];
            if (_reserves[asset].isActive) {
                // Only aToken (deposit) balances count as collateral
                uint256 userBalance = IAToken(_reserves[asset].aTokenAddress).balanceOf(user);
                if (userBalance > 0) {
                    // For simplicity, we're assuming 1:1 price ratio between all assets
                    // In a real implementation, you would use price oracles here
                    totalCollateralValue += userBalance;
                }
            }
        }
        
        return totalCollateralValue;
    }

    /**
     * @notice Calculates the total value of a user's debt
     * @param user The user address
     * @return totalDebtValue The total value of the user's debt
     */
    function _calculateUserDebt(address user) internal view returns (uint256 totalDebtValue) {
        totalDebtValue = 0;
        
        for (uint256 i = 0; i < _reservesList.length; i++) {
            address asset = _reservesList[i];
            if (_reserves[asset].isActive) {
                uint256 userDebt = _userBorrows[user][asset].borrowedAmount;
                if (userDebt > 0) {
                    // For simplicity, we're assuming 1:1 price ratio between all assets
                    // In a real implementation, you would use price oracles here
                    totalDebtValue += userDebt;
                }
            }
        }
        
        return totalDebtValue;
    }

    /**
     * @notice Checks if a user can borrow a specific amount of an asset
     * @param asset The address of the asset to borrow
     * @param user The user address
     * @param amountToBorrow The amount the user wants to borrow
     * @return True if the user can borrow the requested amount
     */
    function _checkUserBorrowAllowance(
        address asset,
        address user,
        uint256 amountToBorrow
    ) internal view returns (bool) {
        // Calculate total collateral value and existing debt
        uint256 totalCollateralValue = _calculateUserCollateral(user);
        uint256 currentDebt = _calculateUserDebt(user);
        
        // Add the new borrow to the current debt
        uint256 totalDebtAfterBorrow = currentDebt + amountToBorrow;
        
        // If user has no debt yet, they can borrow as long as they have collateral
        if (totalCollateralValue == 0) {
            return false;
        }
        
        // Calculate the maximum amount the user can borrow based on their collateral
        uint256 borrowableAmount = (totalCollateralValue * _reserves[asset].ltv) / PERCENTAGE_FACTOR;
        
        // Check if the total debt after the borrow is within the borrowable amount
        return totalDebtAfterBorrow <= borrowableAmount;
    }

    /**
     * @notice Checks if a withdrawal would bring the user's health factor below 1
     * @param asset The address of the asset to withdraw
     * @param user The user address
     * @param amountToWithdraw The amount the user wants to withdraw
     * @return True if the withdrawal is safe
     */
    function _checkCollateralAfterWithdraw(
        address asset,
        address user,
        uint256 amountToWithdraw
    ) internal view returns (bool) {
        // Get the current total debt
        uint256 totalDebt = _calculateUserDebt(user);
        
        // If there's no debt, withdrawal is always allowed
        if (totalDebt == 0) {
            return true;
        }
        
        // Calculate total collateral value before withdrawal
        uint256 totalCollateralValue = _calculateUserCollateral(user);
        
        // Calculate collateral value after withdrawal
        uint256 collateralAfterWithdraw = totalCollateralValue > amountToWithdraw 
            ? totalCollateralValue - amountToWithdraw 
            : 0;
        
        if (collateralAfterWithdraw == 0) {
            return totalDebt == 0; // Allow only if there's no debt
        }
        
        // Calculate the available collateral based on liquidation threshold
        uint256 availableCollateral = 0;
        uint256 userBalance = IAToken(_reserves[asset].aTokenAddress).balanceOf(user);
        uint256 remainingBalance = userBalance - amountToWithdraw;
        
        // Only count the remaining balance of the specific asset being withdrawn
        if (remainingBalance > 0) {
            availableCollateral += remainingBalance;
        }
        
        // Add other assets as collateral
        for (uint256 i = 0; i < _reservesList.length; i++) {
            address currentAsset = _reservesList[i];
            if (currentAsset != asset && _reserves[currentAsset].isActive) {
                uint256 currentBalance = IAToken(_reserves[currentAsset].aTokenAddress).balanceOf(user);
                if (currentBalance > 0) {
                    availableCollateral += currentBalance;
                }
            }
        }
        
        // The minimum collateral required based on liquidation thresholds
        uint256 requiredCollateral = (totalDebt * PERCENTAGE_FACTOR) / _reserves[asset].liquidationThreshold;
        
        // Check if available collateral is sufficient
        return availableCollateral >= requiredCollateral;
    }

    /**
     * @notice Emitted when a new reserve is initialized
     * @param asset The address of the underlying asset
     * @param aToken The address of the aToken
     * @param bToken The address of the bToken
     */
    event ReserveInitialized(address indexed asset, address indexed aToken, address indexed bToken);
}