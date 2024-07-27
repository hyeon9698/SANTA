import React from "react";
import styled from "styled-components";

export default function XButtonOnImage({ onClickHandler, index }) {
    return <Button onClick={() => onClickHandler(index)}>&#10006;</Button>;
}
const Button = styled.button`
    &:hover {
        background-color: rgba(0, 0, 0, 0.2); /* 검정색 배경과 80% 투명도 */
        cursor: pointer;
        border-radius:30px;
    }
    position: absolute;
    top: 5px;
    right: 5px;
    background: transparent;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
`;
