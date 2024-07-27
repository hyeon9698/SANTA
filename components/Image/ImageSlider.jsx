import React from "react";
import Slider from "react-slick";
import styled from "styled-components";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";
import UploadButton from "../button/UploadButton";
import XButton from "../button/XButton";
import XButtonOnImage from "../button/XButtonOnImage";

export default function ImageSlider({ images, setImages, setSelectedFiles }) {
    const settings = {
        speed: 500,
        infinite: false,
        slidesToShow: 3,
        slidesToScroll: 1,
        arrows: false,
        focusOnSelect: false,
    };

    const onClickHandler = (index) => {
        setImages((prevImages) => prevImages.filter((_, i) => i !== index));
        setSelectedFiles((prevFiles) =>
            prevFiles.filter((_, i) => i !== index)
        );
    };

    return (
        <SliderContainer>
            <Slider {...settings}>
                <UploadButton
                    images={images}
                    setImages={setImages}
                ></UploadButton>
                {images.map((src, index) => (
                    <Group key={index} className="slide-group">
                        <XButtonOnImage
                            index={index}
                            onClickHandler={onClickHandler}
                        ></XButtonOnImage>
                        <SlideImage src={src} alt={`Slide ${index}`} />
                    </Group>
                ))}
            </Slider>
        </SliderContainer>
    );
}

const SliderContainer = styled.div`
    width: 100%;
    .slick-slide .slide-group img {
        width: auto;
        height: 80px;
    }
    .slick-list {
        margin: 0 -10px; /* 양쪽에 마이너스 마진을 줘서 padding과 균형을 맞춤 */
    }

    .slick-slide > div {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0 10px; /* 각 슬라이드에 패딩을 줘서 간격을 만듦 */
    }

    .slick-slide .first > div {
        display: flex;
        justify-content: start;
        align-items: center;
    }
`;

const SlideImage = styled.img`
    width: 80px;
    border-radius: 8px;
`;
const NullDiv = styled.div`
    opacity: 0;
    height: 80px;
    width: 10px;
    border-radius: 8px;
`;

const Group = styled.div`
    position: relative; /* XButton 위치를 절대 위치로 설정하기 위해 상대 위치 지정 */
    display: flex;
    justify-content: center;
    align-items: center;
`;
