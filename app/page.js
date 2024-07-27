"use client";
import KakaoShare from "@/components/button/KakaoShare";
import TextButton from "@/components/button/TextButton";
import Container from "@/components/layout/Container";
import LoadingSpinner from "@/components/loading/LoadingSpinner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import styled from "styled-components";
import { api } from "../apis/apis";

export default function Home() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, []);

    const onClickHandler = () => {
        api.post();
    };
    return (
        <Container color={"black"}>
            <ViewBox>
                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        <TextBox>
                            <Image
                                src="/svgIcon/logo.svg"
                                alt="logo"
                                width={350}
                                height={150}
                            ></Image>
                        </TextBox>
                        <TextButtonBox>
                            <TextButton
                                onClickHandler={() => {
                                    router.push("./upload");
                                }}
                            >
                                사진 업로드
                            </TextButton>
                        </TextButtonBox>
                    </>
                )}
            </ViewBox>
        </Container>
    );
}

const TextBox = styled.div`
    display: flex;
    margin-top: 100px;
    flex-direction: column;
    justify-content: left;

`;

const ViewBox = styled.div`
    padding: 10% 0 10% 0;
    display: flex;
    flex-direction: column;
    margin-bottom: 40px;
    justify-content: space-between;
    align-items: center;
`;

const TextButtonBox = styled.div`
    flex-direction: column;
`;
