"use client";
import { createContext, useContext, useState } from "react";

const FileContext = createContext();
export const useFile = () => useContext(FileContext);
export default function Provider({ children }) {
    const [filename, setFilename] = useState("");
    const [fileData, setFileData] = useState(""); // 이미지 데이터를 저장할 상태 추가
    const [addMaskInfo, setAddMaskInfo] = useState({
        x1: 0,
        x2: 0,
        y1: 0,
        y2: 0,
    }); // 이미지 데이터를 저장할 상태 추가
    const [mode, setMode] = useState("changeFace");
    const [selectedMaskId, setSelectedMaskId] = useState();
    const [selectedFaceInfo, setSelectedFaceInfo] = useState({});

    return (
        <FileContext.Provider
            value={{
                filename,
                setFilename,
                fileData,
                setFileData,
                addMaskInfo,
                setAddMaskInfo,
                selectedMaskId,
                setSelectedMaskId,
                mode,
                setMode,
                selectedFaceInfo,
                setSelectedFaceInfo,
            }}
        >
            {children}
        </FileContext.Provider>
    );
}
