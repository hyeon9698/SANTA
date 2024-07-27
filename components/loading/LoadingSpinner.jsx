import Image from "next/image";
import React from "react";
import styled from "styled-components";

export default function LoadingSpinner() {
    return (
        <div
            style={{
                position: "fixed", // 화면에 고정 위치
                top: "50%", // 화면의 수직 중앙
                left: "50%", // 화면의 수평 중앙
                transform: "translate(-50%, -50%)", // 중앙 정렬
                zIndex: 9999, // 다른 콘텐츠 위에 표시
            }}
        >
            <Image
                src={"/svgIcon/loadingSpinner.svg"}
                alt="loading"
                width={48}
                height={48}
          
            ></Image>
        </div>
    );
}
