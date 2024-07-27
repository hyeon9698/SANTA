import React from "react";
import styled from "styled-components";

export default function TextButton({ children ,onClickHandler}) {
    return <Button onClick={onClickHandler}>{children}</Button>;
}

const Button = styled.button`
    width: ${(props) => props.width || "350px"};
    height: ${(props) => props.width || "52px"};
    border-radius: 4px;
    font-weight: 700;
    color: black;
    background-color: white;
`;
