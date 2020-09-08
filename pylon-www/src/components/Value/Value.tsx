import React from "react";

import styled from "styled-components";

interface ValueProps {
  value: string;
}

const Value: React.FC<ValueProps> = ({ value }) => {
  return <StyledValue>{value}</StyledValue>;
};

const StyledValue = styled.div`
  // color: ${(props) => props.theme.color.grey[600]};
  color: #f6f5fa;
  font-size: 36px;
  font-weight: 700;
`;

export default Value;
