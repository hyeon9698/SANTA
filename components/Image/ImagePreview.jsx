import React from "react";
import styled from "styled-components";

export default function ImagePreview({ src, width, height }) {
    return (
        <PreviewContainer width={width} height={height}>
            <PreviewImage src={src} alt="Preview" height={height} />
        </PreviewContainer>
    );
}

const PreviewContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    border: 1px solid #ededed;
    width: ${(props) => (props.width ? props.width : "95%")};
    height: ${(props) => (props.width ? props.height : "80%")};
    border-radius: 8px;
    background-color: #fff;
    overflow: hidden; /* 컨테이너를 벗어나는 부분을 숨깁니다 */
`;

const PreviewImage = styled.img`
    border-radius: 8px;
    border: 1px solid #ddd;
    object-fit: contain; /* 이미지가 비율을 유지하면서 컨테이너에 맞게 조정됩니다 */
`;
