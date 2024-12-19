
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract staking_contract_01 is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    IERC20 public rewardToken;

    uint256 public constant REWARD_RATE = 10; // 10 tokens per day per 1000 staked tokens
    uint256 public constant REWARD_PRECISION = 1e18;

    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
    }

    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 reward);

    constructor() Ownable() {
        // For demonstration purposes, we're using the same token for staking and rewards
        // In a real-world scenario, you might want to set these to actual token addresses
        stakingToken = IERC20(address(0x1234567890123456789012345678901234567890));
        rewardToken = IERC20(address(0x1234567890123456789012345678901234567890));
    }

    function stake(uint256 _amount) external {
        require(_amount > 0, "Cannot stake 0 tokens");
        
        if (stakes[msg.sender].amount > 0) {
            uint256 reward = calculateReward(msg.sender);
            rewardToken.safeTransfer(msg.sender, reward);
        }

        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        stakes[msg.sender].amount += _amount;
        stakes[msg.sender].startTime = block.timestamp;
        totalStaked += _amount;

        emit Staked(msg.sender, _amount);
    }

    function withdraw() external {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No tokens staked");

        uint256 reward = calculateReward(msg.sender);
        uint256 amount = userStake.amount;

        totalStaked -= amount;
        delete stakes[msg.sender];

        stakingToken.safeTransfer(msg.sender, amount);
        rewardToken.safeTransfer(msg.sender, reward);

        emit Withdrawn(msg.sender, amount, reward);
    }

    function calculateReward(address _user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[_user];
        if (userStake.amount == 0) {
            return 0;
        }

        uint256 stakingDuration = block.timestamp - userStake.startTime;
        uint256 reward = (userStake.amount * REWARD_RATE * stakingDuration) / (1000 * 1 days) * REWARD_PRECISION / REWARD_PRECISION;

        return reward;
    }

    function setStakingToken(address _stakingToken) external onlyOwner {
        stakingToken = IERC20(_stakingToken);
    }

    function setRewardToken(address _rewardToken) external onlyOwner {
        rewardToken = IERC20(_rewardToken);
    }
}
