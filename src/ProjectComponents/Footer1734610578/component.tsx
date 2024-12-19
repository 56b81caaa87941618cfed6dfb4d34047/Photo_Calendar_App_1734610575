
import React from 'react';
import * as ethers from 'ethers';

const CONTRACT_ADDRESS = '0x2B2C9214258FC30Afd603Bb4007B7F27718a4e05';
const CHAIN_ID = 17000;

const ABI = [
  "function stake(uint256 _amount) external",
  "function withdraw() external",
  "function calculateReward(address _user) public view returns (uint256)",
  "function stakes(address) public view returns (uint256 amount, uint256 startTime)"
];

const StakingInterface: React.FC = () => {
  const [provider, setProvider] = React.useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = React.useState<ethers.Signer | null>(null);
  const [contract, setContract] = React.useState<ethers.Contract | null>(null);
  const [stakeAmount, setStakeAmount] = React.useState<string>('');
  const [currentStake, setCurrentStake] = React.useState<string>('0');
  const [currentReward, setCurrentReward] = React.useState<string>('0');

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        
        setProvider(provider);
        setSigner(signer);
        setContract(contract);

        const network = await provider.getNetwork();
        if (network.chainId !== CHAIN_ID) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: ethers.utils.hexValue(CHAIN_ID) }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              alert('Please add the Holesky network to your wallet');
            } else {
              console.error('Failed to switch network:', switchError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      console.error('Ethereum wallet not detected');
    }
  };

  const updateStakeInfo = async () => {
    if (contract && signer) {
      try {
        const address = await signer.getAddress();
        const stakeInfo = await contract.stakes(address);
        setCurrentStake(ethers.utils.formatEther(stakeInfo.amount));
        const reward = await contract.calculateReward(address);
        setCurrentReward(ethers.utils.formatEther(reward));
      } catch (error) {
        console.error('Failed to update stake info:', error);
      }
    }
  };

  React.useEffect(() => {
    if (contract) {
      updateStakeInfo();
    }
  }, [contract]);

  const handleStake = async () => {
    if (!contract || !signer) {
      await connectWallet();
    }
    if (contract && signer) {
      try {
        const amount = ethers.utils.parseEther(stakeAmount);
        const tx = await contract.stake(amount);
        await tx.wait();
        await updateStakeInfo();
        setStakeAmount('');
      } catch (error) {
        console.error('Staking failed:', error);
      }
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !signer) {
      await connectWallet();
    }
    if (contract && signer) {
      try {
        const tx = await contract.withdraw();
        await tx.wait();
        await updateStakeInfo();
      } catch (error) {
        console.error('Withdrawal failed:', error);
      }
    }
  };

  return (
    <div className="p-5 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Staking Interface</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Current Stake: {currentStake} tokens</p>
        <p className="text-sm text-gray-600">Current Reward: {currentReward} tokens</p>
      </div>
      
      <div className="mb-4">
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="Amount to stake"
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={handleStake}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Stake
        </button>
        <button
          onClick={handleWithdraw}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Withdraw
        </button>
      </div>
    </div>
  );
};

export { StakingInterface as component };
