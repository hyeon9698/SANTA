import Image from "next/image";
import React, { useRef } from "react";
import styled from "styled-components";

export default function UploadButton({ setImages, images }) {
    const fileInputRef = useRef(null);
    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        console.log(files);

        const urls = files.map((file) => URL.createObjectURL(file));
        setImages((prev) => [...prev, ...urls]);
    };

    return (
        <div>
            <AddImage onClick={handleButtonClick}>
                <div className="first">
                    <Image
                        src="/svgIcon/camera.svg"
                        alt="camera"
                        width={24}
                        height={24}
                    />
                </div>
                <div>{images.length} / 10</div>
                <FileInput
                    type="file"
                    accept="image/*"
                    hidden
                    multiple
                    onChange={handleFileChange}
                    ref={fileInputRef}
                />
            </AddImage>
        </div>
    );
}
const AddImage = styled.div`
    display: flex;
    width: 80px;
    height: 80px;
    flex-direction: column; /* 세로 방향으로 아이템 정렬 */
    justify-content: center;
    align-items: center;
    background-color: white;
    border-radius: 8px;
    cursor: pointer;
`;
const FileInput = styled.input`
    position: absolute;
    opacity: 0;
    cursor: pointer;
`;
