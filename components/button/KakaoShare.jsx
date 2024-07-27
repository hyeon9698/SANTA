"use client";
import Image from "next/image";
import React, { useEffect } from "react";
import styled from "styled-components";

export default function KakaoShare() {
    const onClickKakaoHandler = () => {
        //kakaoSdk부른후 window.kakao로 접근
        if (window.Kakao) {
            const kakao = window.Kakao;
            //중복 initialization 방지
            //카카오에서 제공하는 jsㅏkey를 이용하여 initializae
            if (!kakao.isInitialized()) {
                kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY);
            }

            kakao.Share.sendDefault({
                objectType: "feed",
                content: {
                    title: "사진을 공유했어요!",
                    description: "사진을 확인해주세요",
                    imageUrl: "",
                    link: { mobileWebUrl: "", webUrl: "" },
                },
            });
        }
    };

    useEffect(() => {
        //카카오톡 sdk 추가
        const script = document.createElement("script");
        script.src = "https://developers.kakao.com/sdk/js/kakao.js";
        script.async = true;
        document.body.appendChild(script);

        return () => document.body.removeChild(script);
    }, []);

    return (
        <KakaoShareBtn onClick={onClickKakaoHandler}>
            <Image
                src={"/svgIcon/kakaoShare.svg"}
                alt="카카오톡 공유하기"
                width={52}
                height={52}
            />
        </KakaoShareBtn>
    );
}

const KakaoShareBtn = styled.div`
    &:hover {
        cursor: pointer;
    }
`;
