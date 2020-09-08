import React, { useMemo, useEffect } from "react";
import styled from "styled-components";

import { useParams } from "react-router-dom";
import { useWallet } from "use-wallet";
import { provider } from "web3-core";

import Countdown, { CountdownRenderProps } from "react-countdown";

import Button from "../../components/Button";
import PageHeader from "../../components/PageHeader";
import Spacer from "../../components/Spacer";

import useFarm from "../../hooks/useFarm";
import useRedeem from "../../hooks/useRedeem";
import { getContract } from "../../utils/erc20";

import Harvest from "./components/Harvest";
import Stake from "./components/Stake";

const Farm: React.FC = () => {
  const { farmId } = useParams();
  const {
    contract,
    depositToken,
    depositTokenAddress,
    earnToken,
    name,
    icon,
  } = useFarm(farmId) || {
    depositToken: "",
    depositTokenAddress: "",
    earnToken: "",
    name: "",
    icon: "",
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { ethereum } = useWallet();

  const tokenContract = useMemo(() => {
    return getContract(ethereum as provider, depositTokenAddress);
  }, [ethereum, depositTokenAddress]);

  const { onRedeem } = useRedeem(contract);

  const depositTokenName = useMemo(() => {
    return depositToken.toUpperCase();
  }, [depositToken]);

  const earnTokenName = useMemo(() => {
    return earnToken.toUpperCase();
  }, [earnToken]);

  const countdownBlock = () => {
    const date = Date.parse("Sun Aug 23 2020 00:20:00 GMT+0800");
    if (Date.now() >= date) return "";
    return (
      <CountdownView>
        <Countdown date={date} />
      </CountdownView>
    );
  };

  const PylonNotify = (token: String) => {
    // if (token != "pylon")
    return "";
    // return (
    //   <PylonNotifyView>
    //     <p> Farm is good, but don't forget migration your PYLON before Migration Deadline. </p>
    //     <p>
    //       <a href='https://pylon.finance/'>https://pylon.finance/</a>
    //     </p>
    //     {countdownBlock()}
    //   </PylonNotifyView>
    // )
  };

  const lpPoolTips = (token: String) => {
    if (token != "uni_lp") return "";
    return (
      <PylonNotifyView>
        <p>
          If you want Add liquidity to Uniswap, please use this{" "}
          <a href="https://app.uniswap.org/#/add/0xD7B7d3C0bdA57723Fb54ab95Fd8F9EA033AF37f2/0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8">
            Uniswap link
          </a>
          .
        </p>
      </PylonNotifyView>
    );
  };

  return (
    <>
      <PageHeader
        icon={icon}
        subtitle={`Deposit ${
          depositTokenName === "LINK" ? "YALINK" : depositTokenName
        } and earn ${earnTokenName}`}
        title={name}
      />
      {PylonNotify(depositToken)}
      <StyledFarm>
        {lpPoolTips(depositToken)}
        <StyledCardsWrapper>
          <StyledCardWrapper>
            <Harvest poolContract={contract} />
          </StyledCardWrapper>
          <Spacer />
          <StyledCardWrapper>
            <Stake
              poolContract={contract}
              tokenContract={tokenContract}
              tokenName={depositToken.toUpperCase()}
            />
          </StyledCardWrapper>
        </StyledCardsWrapper>
        <Spacer size="lg" />
        <div>
          <Button
            onClick={onRedeem}
            text="Harvest & Withdraw"
            // borderImage
          />
        </div>
        <Spacer size="lg" />
      </StyledFarm>
    </>
  );
};

const StyledFarm = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StyledCardsWrapper = styled.div`
  display: flex;
  width: 600px;
  @media (max-width: 768px) {
    width: 100%;
    flex-flow: column nowrap;
    align-items: center;
  }
`;

const StyledCardWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  @media (max-width: 768px) {
    width: 80%;
  }
`;

const CountdownView = styled.div`
  font-size: 30px;
  font-weight: bold;
  color: rgb(209, 0, 75);
  margin-bottom: 20px;
`;

const PylonNotifyView = styled.div`
  text-align: center;
  color: #555;
`;

export default Farm;
