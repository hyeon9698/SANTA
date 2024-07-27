import Image from "next/image";
import React from "react";
import styled from "styled-components";

export default function XButton({ onClickHandler }) {
    return (
        <Container onClick={onClickHandler}>
            <Image
                src={"/svgIcon/x.svg"}
                alt={"cancel"}
                width={24}
                height={24}
            />
        </Container>
    );
}

const Container = styled.div`
    padding: 2px;
    &:hover {
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.1); /* 검정색 배경과 80% 투명도 */
        cursor: pointer;
    }
`;
