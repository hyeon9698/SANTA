"use client";
import LoadingSpinner from "@/components/loading/LoadingSpinner";
import React from "react";
import { useLoading } from "@/hooks/useLoading";
import styled from "styled-components";
import NavBar from "@/components/layout/NavBar";

export default function layout({ children }) {
    return (
        <Container>
            {children}
        </Container>
    );
}

const Container = styled.div`
    padding: 0;
    margin: 0;
`;
