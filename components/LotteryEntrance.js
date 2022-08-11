import { useMoralis, useWeb3Contract } from "react-moralis";
import { abi, contractAddresses } from "../constants";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNotification } from "web3uikit";

export default function LotteryEntrance() {
  const { chainId: chainIdHex, isWeb3Enabled, Moralis } = useMoralis();
  const chainId = parseInt(chainIdHex);
  const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null;
  const [entranceFee, setEntranceFee] = useState("0");
  const [numberOfPlayers, setNumberOfPlayers] = useState("0");
  const [recentWinner, setRecentWinner] = useState("0");
  const [provider, setProvider] = useState();

  const dispatch = useNotification();

  const {
    runContractFunction: enterRaffle,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: "enterRaffle",
    params: {},
    msgValue: entranceFee,
  });

  const { runContractFunction: getEntranceFee } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: "getEntranceFee",
    params: {},
  });

  const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: "getNumberOfPlayers",
    params: {},
  });

  const { runContractFunction: getRecentWinner } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: "getRecentWinner",
    params: {},
  });

  async function updateUI() {
    const entraceFeeFromCall = (await getEntranceFee()).toString();
    const numberOfPlayersFromCall = (await getNumberOfPlayers()).toString();
    const recentWinnerFromCall = await getRecentWinner();
    setEntranceFee(entraceFeeFromCall);
    setNumberOfPlayers(numberOfPlayersFromCall);
    setRecentWinner(recentWinnerFromCall);
  }

  Moralis.onWeb3Enabled((provider) => {
    setProvider(provider);
  });

  useEffect(() => {
    if (isWeb3Enabled) {
      updateUI();

      const raffleContract = new ethers.Contract(raffleAddress, abi, provider.web3);
      raffleContract.on("WinnerPicked", async (winner) => {
        updateUI();
      });
    }
  }, [isWeb3Enabled]);

  const handleSuccess = async function (tx) {
    const raffleContract = new ethers.Contract(raffleAddress, abi, provider.web3);
    const txReceipt = await tx.wait(1);
    if (txReceipt.events[0] !== "undefined") {
      handleNewNotification();
      updateUI();
    }
  };

  const handleNewNotification = function () {
    dispatch({
      type: "success",
      message: "Transaction Complete!",
      title: "Tx Notification",
      position: "bottomR",
      icon: "bell",
    });
  };

  return (
    <div>
      Hi from lottery entrance!
      {raffleAddress ? (
        <div>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
            onClick={async function () {
              await enterRaffle({
                onSuccess: handleSuccess, // only check if the tx was successfully send, not if tx has a block confirmation
                onError: (error) => console.log(error),
              });
            }}
            disabled={isLoading || isFetching}
          >
            {isLoading || isFetching ? (
              <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
            ) : (
              <div>Enter Raffle</div>
            )}
          </button>
          <div>Entrance fee: {ethers.utils.formatUnits(entranceFee, "ether").toString()} ETH</div>
          <div>Number of players: {numberOfPlayers}</div>
          <div>Recent winner: {recentWinner}</div>
        </div>
      ) : (
        <div>No Raffle Address Detected</div>
      )}
    </div>
  );
}
