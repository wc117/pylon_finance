import React from "react";
import styled from "styled-components";

import Nav from "./components/Nav";

const Footer: React.FC = () => (
  <StyledFooter>
    <StyledFooterInner>
      <Nav />
    </StyledFooterInner>
  </StyledFooter>
);

const StyledFooter = styled.footer`
  align-items: center;
  display: flex;
  justify-content: center;
  padding-top: 100px;
  padding-bottom: 20px;
`;

const StyledFooterInner = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
  height: ${(props) => props.theme.topBarSize}px;
  max-width: ${(props) => props.theme.siteWidth}px;
  width: 100%;
  // background-image: url(https://static.starcraft2.com/dist/images/bg-footer-social-1600.a7861f1….jpg);
  // height: 200px;
`;

export default Footer;
