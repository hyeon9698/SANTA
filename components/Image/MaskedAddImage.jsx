import React, { useRef, useEffect, useState } from "react";
import {
    Stage,
    Layer,
    Image as KonvaImage,
    Rect,
    Circle,
    Group,
    Transformer,
} from "react-konva";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import useImage from "use-image";
import styled from "styled-components";
import { useFile } from "../layout/Provider";
import { Rnd } from "react-rnd";

const MaskedAddImage = ({ src, masks, spriteSrc }) => {
    const [image] = useImage(src);
    const [spriteImage] = useImage(spriteSrc); // Load the sprite image
    const [imageSize, setImageSize] = useState({ width: 400, height: 400 }); // 기본값 설정
    const [spriteSize, setSpriteSize] = useState({ width: 100, height: 100 }); // 스프라이트 이미지의 초기 크기
    const [spritePosition, setSpritePosition] = useState({ x: 100, y: 100 });
    const stageRef = useRef(null);
    const groupRef = useRef(null);
    const spriteRef = useRef(null);
    const imageRef = useRef(null);
    const transformerRef = useRef(null);

    const { setFileData, setAddMaskInfo, addMaskInfo } = useFile(); // Context 사용

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        const scaleBy = 1.1;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale =
            e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        stage.scale({ x: newScale, y: newScale });

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        stage.position(newPos);
        stage.batchDraw();
    };

    useEffect(() => {
        if (stageRef.current) {
            const uri = stageRef.current.toDataURL();
            setFileData(uri); // 이미지를 context에 저장
        }
    }, [image, spriteImage, masks, setFileData]);

    useEffect(() => {
        if (image) {
            setImageSize({ width: image.width, height: image.height });
        }
    }, [image]);

    const handleTransformEnd = () => {
        if (spriteRef.current) {
            const node = spriteRef.current;
            const { x, y, width, height } = node.attrs;
            setSpritePosition({ x, y });
            setSpriteSize({ width, height });
    
            setAddMaskInfo({
                x1: Math.round(x),
                x2: Math.round(x + width),
                y1: Math.round(y),
                y2: Math.round(y + height),
            });
            console.log(addMaskInfo);
        }
    };

    const handleSelect = (e) => {
        if (e.target === spriteRef.current) {
            transformerRef.current.nodes([e.target]);
            transformerRef.current.getLayer().batchDraw();
        } else {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer().batchDraw();
        }
    };

    useEffect(() => {
        if (transformerRef.current) {
            transformerRef.current.nodes([spriteRef.current]);
            transformerRef.current.getLayer().batchDraw();
        }
    }, [spriteImage]);

    return (
        <ZoomContainer>
            <CanvasContainer>
                <Stage
                    width={imageSize.width}
                    height={imageSize.height}
                    onWheel={handleWheel}
                    ref={stageRef}
                >
                    <Layer>
                        <Group ref={groupRef} draggable>
                            <StyledImage
                                image={image}
                                alt={image}
                                ref={imageRef}
                            />
                            {spriteImage && (
                                <>
                                    <KonvaImage
                                        image={spriteImage} // 스프라이트 이미지 추가
                                        x={spritePosition.x}
                                        y={spritePosition.y}
                                        width={spriteSize.width}
                                        height={spriteSize.height}
                                        onClick={handleSelect}
                                        ref={spriteRef}
                                        onTransformEnd={handleTransformEnd}
                                        onDragEnd={handleTransformEnd}
                                        draggable
                                    />
                                    <Transformer
                                        ref={transformerRef}
                                        rotateEnabled={false}
                                        boundBoxFunc={(oldBox, newBox) => {
                                            if (
                                                newBox.width < 20 ||
                                                newBox.height < 20
                                            ) {
                                                return oldBox;
                                            }
                                            return newBox;
                                        }}
                                    />
                                </>
                            )}
                        </Group>
                    </Layer>
                </Stage>
            </CanvasContainer>
        </ZoomContainer>
    );
};

const CanvasContainer = styled.div`
    overflow: hidden; /* 컨테이너를 초과하는 부분을 숨기기 위해 추가 */
`;

const ZoomContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden; /* 컨테이너를 초과하는 부분을 숨기기 위해 추가 */
`;

const Controls = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
`;

const ControlButton = styled.button`
    margin: 0 5px;
    padding: 10px 20px;
    font-size: 18px;
    color: #fff;
    background-color: #007bff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
        background-color: #0056b3;
    }

    &:focus {
        outline: none;
    }

    &:active {
        background-color: #004494;
    }
`;
const StyledImage = styled(KonvaImage)`
    width: 100%;
    height: 100%;
    object-fit: cover; /* 원본 비율 유지하고 초과하는 부분 숨기기 */
`;

export default MaskedAddImage;
