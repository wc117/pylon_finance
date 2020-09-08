import React from "react";
import styled from "styled-components";

import Footer from "../Footer";

const Page: React.FC = ({ children }) => (
  <StyledPage>
    <StyledMain>{children}</StyledMain>
    <Footer />
  </StyledPage>
);

const StyledPage = styled.div`
  margin-top: ${(props) => props.theme.topBarSize}px;
  background: url(${require("../../assets/img/background.jpg")}) no-repeat fixed;
  -webkit-background-size: 100%;
  -moz-background-size: 100%;
  -o-background-size: 100%;
  background-size: 100%;

  @media (max-width: 640px) {
    background: none;
  }
`;

const StyledMain = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - ${(props) => props.theme.topBarSize * 2}px - 168px);
`;

export default Page;
