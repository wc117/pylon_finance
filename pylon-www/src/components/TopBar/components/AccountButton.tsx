import React, { useMemo } from "react";
import styled from "styled-components";

import { useWallet } from "use-wallet";

import useModal from "../../../hooks/useModal";
import { formatAddress } from "../../../utils";

import Button from "../../Button";

import AccountModal from "./AccountModal";

interface AccountButtonProps {}

const AccountButton: React.FC<AccountButtonProps> = (props) => {
  const [onPresentAccountModal] = useModal(<AccountModal />);

  const { account, connect } = useWallet();

  return (
    <StyledAccountButton>
      {!account ? (
        <Button
          onClick={() => connect("injected")}
          size="sm"
          text="CONNECT TO A WALLET"
        />
      ) : (
        <Button onClick={onPresentAccountModal} size="sm" text="My Wallet" />
      )}
    </StyledAccountButton>
  );
};

const StyledAccountButton = styled.div`
  height: 100%;
  width: 156px;
  margin-right: 20px;
  button {
    // height: 100%;
    padding: 20px;
  }
  @media (max-width: 640px) {
    width: 80px;

    button {
      color: transparent;
    }

    button:after {
      content: "Wallet";
      border: none;
      color: white;
      padding-top: 10px;
    }
  }
`;

export default AccountButton;
