import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";

const Nav: React.FC = () => {
  return (
    <StyledNav>
      {/* <StyledLink exact activeClassName="active" to="/">Home</StyledLink> */}
      <StyledLink exact activeClassName="active" to="/farms">
        Farms
      </StyledLink>
      {/* <StyledLink exact activeClassName="active" to="/vote">Vote</StyledLink> */}
      <StyledLink exact activeClassName="active" to="/stats">
        Stats
      </StyledLink>
    </StyledNav>
  );
};

const StyledNav = styled.nav`
  align-items: center;
  display: flex;
  height: 100%;
  margin-left: 10px;
`;

const StyledLink = styled(NavLink)`
  height: 100%;
  display: flex;
  align-items: center;
  // color: ${(props) => props.theme.color.grey[400]};
  color: #868996;
  font-weight: 700;
  padding-left: ${(props) => props.theme.spacing[4]}px;
  padding-right: ${(props) => props.theme.spacing[4]}px;
  text-decoration: none;
  border-radius: 20px;
  margin: 0 5px;
  &:hover {
    color: #4a4c54;
    background-color: #DCE2E8;
    // color: ${(props) => props.theme.color.grey[500]};
    // box-shadow: 0 2px #3d6b99;
    // background-image: linear-gradient(
      // 0deg,
      // rgba(0, 128, 255, 0.2),
      // rgba(0, 128, 255, 0.05)
    );
  }
  &.active {
    // color: ${(props) => props.theme.color.primary.main};
    color: #313236;
    background: #ecf0f3;
    box-shadow: -.25rem -.25rem 1rem #fff,.25rem .25rem 1rem #d3d4db;
  }

  @media (max-width: 640px) {
    height: unset;
    padding: 8px;
  }
`;

export default Nav;
