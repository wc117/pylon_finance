import React from "react";
import styled from "styled-components";

const Card: React.FC = ({ children }) => <StyledCard>{children}</StyledCard>;

const StyledCard = styled.div`
  // background: ${(props) => props.theme.color.grey[200]};
  // background-color: rgba(0, 13, 26, 0.8);
  background-color: #202840;
  box-shadow: -0.5rem -0.5rem 1rem rgba(52.4, 65.5, 104.8, 0.3),
    0.5rem 0.5rem 1rem rgba(0, 0, 0, 0.3);
  // border: 1px solid rgba(153, 204, 255, 0.5);
  border-radius: 12px;
  // box-shadow: inset 1px 1px 0px ${(props) => props.theme.color.grey[100]};
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
`;

export default Card;
