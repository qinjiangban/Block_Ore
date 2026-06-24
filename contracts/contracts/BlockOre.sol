// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {OreNFT} from "./OreNFT.sol";

contract BlockOre is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum OreType {
        STONE,
        IRON,
        SILVER,
        GOLD,
        DIAMOND,
        GENESIS
    }

    struct UserData {
        uint256 points;
        uint64 totalMines;
        uint64 remainingFreeMines;
        uint64 remainingPaidMines;
        uint64 lastResetDay;
        uint256[6] oreCounts;
    }

    struct UserStatsView {
        uint256 points;
        uint256 totalMines;
        uint256 remainingFreeMines;
        uint256 remainingPaidMines;
        uint256[6] oreCounts;
    }

    struct PendingMine {
        uint64 requestBlock;
        bool revealed;
    }

    error InvalidPassTier();
    error InvalidPayment();
    error InsufficientMineAttempts();
    error PendingMineNotReady();
    error PendingMineMissing();
    error PendingMineRevealed();
    error InvalidTreasuryAddress();
    error InvalidPaymentTokenAddress();
    error DailyPaidLimitExceeded();

    uint256 public constant FREE_MINES_PER_DAY = 10;
    uint256 public constant MAX_DAILY_PAID_MINES = 100;
    uint256 public constant BASIC_PASS_PRICE_USDC = 1_990_000;
    uint256 public constant ADVANCED_PASS_PRICE_USDC = 8_990_000;
    uint256 public constant DIAMOND_PASS_PRICE_USDC = 16_990_000;
    uint256 public constant MAX_GENESIS_SUPPLY = 1000;
    uint256 public constant REVEAL_DELAY_BLOCKS = 3;

    address payable public treasury;
    OreNFT public immutable oreNft;
    IERC20 public immutable usdc;

    uint256 public usdcTreasuryBalance;
    uint256 public totalGenesisMined;

    mapping(address => UserData) private users;
    mapping(address => uint256) public latestNonce;
    mapping(address => mapping(uint256 => PendingMine)) public pendingMines;

    event MineRequested(
        address indexed user,
        uint256 indexed nonce,
        uint256 requestBlock
    );
    event MineRevealed(
        address indexed user,
        uint256 indexed nonce,
        OreType oreType,
        uint256 pointsAwarded,
        bool mintedNft
    );
    event MiningPassPurchased(
        address indexed user,
        uint8 indexed tier,
        uint256 minesAdded,
        uint256 pricePaid
    );
    event TreasuryWithdrawn(address indexed recipient, uint256 amount);
    event NativeBalanceWithdrawn(address indexed recipient, uint256 amount);

    constructor(
        address initialOwner,
        address payable treasury_,
        OreNFT oreNft_,
        IERC20 usdc_
    ) Ownable(initialOwner) {
        if (treasury_ == address(0)) revert InvalidTreasuryAddress();
        if (address(usdc_) == address(0)) revert InvalidPaymentTokenAddress();

        treasury = treasury_;
        oreNft = oreNft_;
        usdc = usdc_;
    }

    function mine() external returns (uint256 nonce, uint256 requestBlock) {
        UserData storage user = users[msg.sender];
        _syncDailyState(user);

        if (user.remainingFreeMines + user.remainingPaidMines == 0)
            revert InsufficientMineAttempts();

        if (user.remainingFreeMines > 0) {
            user.remainingFreeMines -= 1;
        } else {
            user.remainingPaidMines -= 1;
        }

        nonce = ++latestNonce[msg.sender];
        requestBlock = block.number;
        // forge-lint: disable-next-line(unsafe-typecast)
        pendingMines[msg.sender][nonce] = PendingMine({
            requestBlock: uint64(requestBlock),
            revealed: false
        });

        emit MineRequested(msg.sender, nonce, requestBlock);
    }

    function reveal(
        uint256 nonce
    )
        external
        nonReentrant
        returns (OreType oreType, uint256 pointsAwarded, bool mintedNft)
    {
        return _reveal(msg.sender, nonce);
    }

    function claimReward(
        uint256 nonce
    )
        external
        nonReentrant
        returns (OreType oreType, uint256 pointsAwarded, bool mintedNft)
    {
        return _reveal(msg.sender, nonce);
    }

    function buyMiningPass(uint8 tier) external nonReentrant {
        UserData storage user = users[msg.sender];
        _syncDailyState(user);

        (uint256 price, uint256 minesAdded) = _passTierConfig(tier);
        if (user.remainingPaidMines + minesAdded > MAX_DAILY_PAID_MINES)
            revert DailyPaidLimitExceeded();

        usdc.safeTransferFrom(msg.sender, address(this), price);

        // forge-lint: disable-next-line(unsafe-typecast)
        user.remainingPaidMines += uint64(minesAdded);
        usdcTreasuryBalance += price;

        emit MiningPassPurchased(msg.sender, tier, minesAdded, price);
    }

    function withdrawTreasury(uint256 amount) external onlyOwner nonReentrant {
        if (amount > usdcTreasuryBalance) revert InvalidPayment();

        usdcTreasuryBalance -= amount;
        usdc.safeTransfer(treasury, amount);

        emit TreasuryWithdrawn(treasury, amount);
    }

    function withdrawNativeBalance(
        uint256 amount
    ) external onlyOwner nonReentrant {
        if (amount > address(this).balance) revert InvalidPayment();

        (bool success, ) = treasury.call{value: amount}("");
        require(success, "TREASURY_TRANSFER_FAILED");

        emit NativeBalanceWithdrawn(treasury, amount);
    }

    function setTreasury(address payable treasury_) external onlyOwner {
        if (treasury_ == address(0)) revert InvalidTreasuryAddress();
        treasury = treasury_;
    }

    function getUserStats(
        address user
    ) external view returns (UserStatsView memory viewData) {
        UserData memory snapshot = users[user];
        uint256 today = block.timestamp / 1 days;
        if (_shouldRefreshDailyState(snapshot, today)) {
            // forge-lint: disable-next-line(unsafe-typecast)
            snapshot.remainingFreeMines = uint64(FREE_MINES_PER_DAY);
            snapshot.remainingPaidMines = 0;
        }

        viewData = UserStatsView({
            points: snapshot.points,
            totalMines: snapshot.totalMines,
            remainingFreeMines: snapshot.remainingFreeMines,
            remainingPaidMines: snapshot.remainingPaidMines,
            oreCounts: snapshot.oreCounts
        });
    }

    function getPendingMine(
        address user,
        uint256 nonce
    ) external view returns (PendingMine memory) {
        return pendingMines[user][nonce];
    }

    function _reveal(
        address userAddress,
        uint256 nonce
    )
        internal
        returns (OreType oreType, uint256 pointsAwarded, bool mintedNft)
    {
        PendingMine storage pending = pendingMines[userAddress][nonce];
        if (pending.requestBlock == 0) revert PendingMineMissing();
        if (pending.revealed) revert PendingMineRevealed();
        if (block.number <= pending.requestBlock + REVEAL_DELAY_BLOCKS)
            revert PendingMineNotReady();

        bytes32 revealBlockHash = blockhash(
            uint256(pending.requestBlock) + REVEAL_DELAY_BLOCKS
        );
        require(revealBlockHash != bytes32(0), "REVEAL_BLOCK_UNAVAILABLE");

        uint256 random = uint256(
            keccak256(abi.encodePacked(userAddress, nonce, revealBlockHash))
        );
        oreType = _resolveOreType(random);
        if (
            oreType == OreType.GENESIS &&
            totalGenesisMined >= MAX_GENESIS_SUPPLY
        ) {
            oreType = OreType.DIAMOND;
        }

        pointsAwarded = _pointsForOre(oreType);

        UserData storage user = users[userAddress];
        user.points += pointsAwarded;
        user.totalMines += 1;
        user.oreCounts[uint8(oreType)] += 1;

        pending.revealed = true;

        if (oreType == OreType.GENESIS) {
            totalGenesisMined += 1;
        }

        if (oreType == OreType.DIAMOND || oreType == OreType.GENESIS) {
            mintedNft = true;
            oreNft.mintTo(
                userAddress,
                oreType == OreType.DIAMOND
                    ? OreNFT.OreKind.Diamond
                    : OreNFT.OreKind.Genesis
            );
        }

        emit MineRevealed(
            userAddress,
            nonce,
            oreType,
            pointsAwarded,
            mintedNft
        );
    }

    function _syncDailyState(UserData storage user) internal {
        uint64 today = uint64(block.timestamp / 1 days);
        if (_shouldRefreshDailyState(user, today)) {
            user.lastResetDay = today;
            // forge-lint: disable-next-line(unsafe-typecast)
            user.remainingFreeMines = uint64(FREE_MINES_PER_DAY);
            user.remainingPaidMines = 0;
        }
    }

    function _shouldRefreshDailyState(
        UserData memory user,
        uint256 today
    ) internal pure returns (bool) {
        if (user.lastResetDay < today) {
            return true;
        }

        return
            user.lastResetDay == 0 &&
            user.totalMines == 0 &&
            user.points == 0 &&
            user.remainingFreeMines == 0 &&
            user.remainingPaidMines == 0;
    }

    function _resolveOreType(
        uint256 random
    ) internal pure returns (OreType oreType) {
        uint256 roll = random % 1000;

        if (roll < 600) return OreType.STONE;
        if (roll < 850) return OreType.IRON;
        if (roll < 950) return OreType.SILVER;
        if (roll < 990) return OreType.GOLD;
        if (roll < 999) return OreType.DIAMOND;
        return OreType.GENESIS;
    }

    function _pointsForOre(OreType oreType) internal pure returns (uint256) {
        if (oreType == OreType.STONE) return 1;
        if (oreType == OreType.IRON) return 5;
        if (oreType == OreType.SILVER) return 20;
        if (oreType == OreType.GOLD) return 100;
        if (oreType == OreType.DIAMOND) return 500;
        return 2000;
    }

    function _passTierConfig(
        uint8 tier
    ) internal pure returns (uint256 price, uint256 minesAdded) {
        if (tier == 0) return (BASIC_PASS_PRICE_USDC, 10);
        if (tier == 1) return (ADVANCED_PASS_PRICE_USDC, 50);
        if (tier == 2) return (DIAMOND_PASS_PRICE_USDC, 100);
        revert InvalidPassTier();
    }

    receive() external payable {}
}
