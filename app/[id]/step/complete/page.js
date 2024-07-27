"use client";
import React, { useEffect, useRef, useState } from "react";
import { useLoading } from "@/hooks/useLoading";
import LoadingSpinner from "@/components/loading/LoadingSpinner";
import styled from "styled-components";
import ImagePreview from "@/components/Image/ImagePreview";
import ImageSlider from "@/components/Image/ImageSlider";
import { useParams, useRouter } from "next/navigation";
import { useFile } from "@/components/layout/Provider";
import SlidetWithLabel from "@/components/Image/SlidetWithLabel";
import XButton from "@/components/button/XButton";
import KakaoShare from "@/components/button/KakaoShare";
import { api } from "@/apis/apis";
const DummyImages = [
    "/images/circleImage.png",
    "https://via.placeholder.com/80",
    "https://via.placeholder.com/80",
    "https://via.placeholder.com/80",
    "https://via.placeholder.com/80",
    "https://via.placeholder.com/80",
    // 더 많은 이미지 경로를 추가하세요
];

export default function Complete({ loading }) {
    const router = useRouter();

    const { setFilename, filename } = useFile();
    const [images, setImages] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const params = useParams();
    const { id } = params;

    const [completeImages, setCompleteImages] = useState([]);
    const [ingImages, setIngImages] = useState([]);
    const [progressData, setProgressData] = useState(null);

    useEffect(() => {
        const fetchModifiedImage = async () => {
            const groupId = Number(id);
            try {
                const response = await api.post(
                    "/get_modified_img",
                    { groupId: groupId },
                    { responseType: "blob" } // 이미지를 바이너리 데이터로 수신
                );

                const imageBlob = new Blob([response.data], {
                    type: "image/png",
                });
                const imageUrl = URL.createObjectURL(imageBlob);
                setImageSrc(imageUrl);
            } catch (error) {
                console.error("Error fetching modified image:", error);
            }
        };

        const fetchProgressData = async () => {
            const groupId = Number(id);
            try {
                const response = await api.post("/get_progress", {
                    groupId,
                });
                if (response.data.status === "success") {
                    const progressData = response.data.progress;
                    const completed = [];
                    const inProgress = [];

                    Object.keys(progressData).forEach((key) => {
                        if (progressData[key]) {
                            completed.push(key);
                        } else {
                            inProgress.push(key);
                        }
                    });

                    setCompleteImages(completed);
                    setIngImages(inProgress);
                } else {
                    console.error("Failed to fetch progress data");
                }
            } catch (error) {
                console.error("Error fetching progress data:", error);
            }
        };

        fetchProgressData();
        fetchModifiedImage();
    }, [id]);

    console.log(progressData);
    const onClickShare = () => {
        setIsModalOpen(!isModalOpen);
    };

    return (
        <div>
            <Container>
                <View>
                    <Top>
                        <ImagePreview src={imageSrc} />
                    </Top>
                    <Bottom>
                        <TextTitle>몇명이 아직 편집 중이에요</TextTitle>
                        <SlidetWithLabel
                            label={"완료된 사람"}
                            hids={completeImages}
                        ></SlidetWithLabel>
                        <SlidetWithLabel
                            label={"진행중인 사람"}
                            hids={ingImages}
                        ></SlidetWithLabel>
                    </Bottom>
                </View>
                <BottomActions>
                    <ActionButton onClick={onClickShare}>
                        사진 공유하기
                    </ActionButton>
                    <ActionButton
                        onClick={() => {
                            router.push("/");
                        }}
                    >
                        홈으로 가기
                    </ActionButton>
                </BottomActions>
            </Container>
            {isModalOpen && (
                <ModalOverlay>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <CancelBox>
                            <XButton onClickHandler={onClickShare}></XButton>
                        </CancelBox>
                        <Box>
                            <ModalText>
                                <p>우리의 소중한 단체사진을</p>
                                <p>SNS에 공유해보세요!</p>
                            </ModalText>
                            <KakaoShare>카카오톡공유햐기</KakaoShare>
                        </Box>
                    </ModalContent>
                </ModalOverlay>
            )}
        </div>
    );
}

const Container = styled.div`
    height: calc(100vh - 56px); /* 전체 화면 높이를 사용 */
    padding: 20px;
    margin: 0;
    box-sizing: border-box; /* padding 및 border를 포함하여 요소 크기 설정 */
    overflow: hidden; /* 스크롤바 숨기기 */
    background-color: #f6f6f6;
`;

const View = styled.div`
    display: flex; /* Flexbox 사용 */
    height: 90%;
    flex-direction: column; /* 세로 방향으로 정렬 */
    box-sizing: border-box; /* padding 및 border를 포함하여 요소 크기 설정 */
`;

const Top = styled.div`
    flex: 6; /* 전체 공간의 60% 차지 */
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f6f6f6;
`;

const Bottom = styled.div`
    flex: 4;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px;
    background-color: #f6f6f6;
`;
const BottomActions = styled.div`
    display: flex;
    justify-content: space-around;
    width: 100%;
    gap: 10px;
    padding: 16px;
`;

const ActionButton = styled.button`
    padding: 10px 20px;
    width: 100%;
    background-color: #000;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
        background-color: rgba(0, 0, 0, 0.8); /* 검정색 배경과 80% 투명도 */
        cursor: pointer;
    }
`;

const TextTitle = styled.div`
    font-size: 1.5rem;
    font-weight: 700;
    color: black;
`;

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ModalContent = styled.div`
    display: flex;
    width: 350px;
    padding: 20px 20px 36px 20px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    border-radius: 16px;
    background: var(--Gray-white, #fff);
`;

const CancelBox = styled.div`
    display: flex;
    justify-content: end;
    width: 100%;
`;

const ModalText = styled.div`
    color: var(--Gray-10, #121212);
    text-align: center;

    /* H4 */
    font-family: Pretendard;
    font-size: 20px;
    font-style: normal;
    font-weight: 700;
    line-height: 28px; /* 140% */
`;

const Box = styled.div`
    display: flex;
    gap: 24px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;
