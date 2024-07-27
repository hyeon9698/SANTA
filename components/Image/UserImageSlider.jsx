import React, { useState } from "react";
import Slider from "react-slick";
import styled from "styled-components";
import { useFile } from "../layout/Provider";

export default function UserImageSlider({
    images,
    imageSize,
    viewCount,
    noClick,
}) {
    const settings = {
        infinite: false,
        slidesToShow: viewCount ? viewCount : 4,
        slidesToScroll: 1,
        arrows: false,
        draggable: true,
        focusOnSelect: false,
    };
    const { setSelectedFaceInfo } = useFile();
    const [selectedImage, setSelectedImage] = useState(null);
    const handleImageClick = (imageId) => {
        setSelectedImage(imageId);
        setSelectedFaceInfo((prev) => ({ ...prev, imageId: imageId }));
    };

    return (
        <SliderContainer>
            <Slider {...settings}>
                {images?.map((image, index) => (
                    <ImageWrapper key={index}>
                        <Image
                            name={image.imageId}
                            src={image.url}
                            width={imageSize}
                            height={imageSize}
                            alt={`Image ${index}`}
                            onClick={
                                noClick
                                    ? () => {}
                                    : () => handleImageClick(image.imageId)
                            }
                            isSelected={selectedImage === image.imageId}
                        />
                        {selectedImage === image.imageId && (
                            <CheckMark>✔</CheckMark>
                        )}
                    </ImageWrapper>
                ))}
            </Slider>
        </SliderContainer>
    );
}

const SliderContainer = styled.div`
    width: 100%;
    .slick-slide {
        display: flex !important;
        justify-content: center; /* 중앙 정렬 */
        align-items: center; /* 중앙 정렬 */
        height: auto; /* 높이 자동 조정 */
    }
`;

const ImageList = styled.div`
    gap: 10px; /* 이미지 간 간격 */
    transition: transform 0.3s ease; /* 스크롤 애니메이션 */
`;

const ImageWrapper = styled.div`
    position: relative;
    display: flex !important;
    justify-content: center; /* 중앙 정렬 */
    align-items: center; /* 중앙 정렬 */
    padding: 8px;
    box-sizing: border-box;
    width: ${(props) => props.imageSize + 16}px; /* 패딩 포함 크기 */
`;

const Image = styled.img`
    width: ${(props) => (props.width ? props.width + "px" : "80px")};
    height: ${(props) => (props.height ? props.height + "px" : "80px")};
    border-radius: 50%;
    box-sizing: border-box;
    border: ${(props) =>
        props.isSelected ? "2px solid black" : "2px solid transparent"};
    cursor: pointer;
    object-fit: cover;
    transition: border 0.3s;
`;

const CheckMark = styled.div`
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
`;
