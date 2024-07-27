import React, { useEffect, useState } from "react";
import UserImageSlider from "./UserImageSlider";
import styled from "styled-components";
import { api } from "@/apis/apis";
import { useParams } from "next/navigation";

export default function SlidetWithLabel({ label, hids }) {
    const [images, setImages] = useState();
    const params = useParams();
    const { id } = params;
    const fetchCroppedImage = async ({ groupId, humanId, imageId }) => {
        try {
            const response = await api.post(
                "/get_cropped_img0",
                {
                    groupId,
                    humanId,
                    imageId,
                },
                {
                    responseType: "blob",
                }
            );
            return URL.createObjectURL(response.data);
        } catch (error) {
            console.error(`Error fetching cropped image ${imageId}:`, error);
            return null;
        }
    };

    useEffect(() => {
        const fetchTargetImages = async () => {
            const imagePromises = hids.map(async (humanId) => {
                const strippedHumanId = humanId.substring(1);
                const imageId = `i${0}`
                const url = await fetchCroppedImage({
                    groupId: Number(id),
                    imageId: imageId,
                    humanId: humanId,
                });
                return { imageId, url };
            });
            const imageObjects = await Promise.all(imagePromises);
            setImages(imageObjects.filter((obj) => obj.url !== null));
        };

        fetchTargetImages();
    }, [hids, id]);

    return (
        <div>
            <Lable>{label}</Lable>
            <UserImageSlider
                images={images}
                imageSize={48}
                viewCount={5}
                noClick={true}
            ></UserImageSlider>
        </div>
    );
}

const Lable = styled.div`
    font-weight: 500;
    color: var(--gray-6, #888889);
`;
