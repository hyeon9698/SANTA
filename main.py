import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import os
from PIL import Image
from utils import swap_faces_function, create_group, xyxy2xywh, get_editable_cropped_imgs, get_editable_hids, get_centroid, remove_by_mask, get_editable_cropped_imgs0, get_editable_hids0, blurr
from typing import List
import json
import aiofiles
from fastapi.middleware.cors import CORSMiddleware
from glob import glob
import numpy as np

app = FastAPI()
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8080",
    "https://santa-frontend-xi.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SwapFacesRequest(BaseModel):
    groupId: int
    humanId: str
    imageId: str

class GetCropImgsRequest(BaseModel):
    groupId: int
    humanId: str

class GetCropImgRequest(BaseModel):
    groupId: int
    imageId : str
    humanId: str

class GroupIDRequest(BaseModel):
    groupId: int

class RemoveBackgroundRequest(BaseModel):
    groupId: int

@app.post("/swap_faces")
async def swap_faces(request: SwapFacesRequest):
    group_folder = f"data_folder/g{request.groupId}"
    image_name = f"{request.imageId}_{request.humanId}.png"
    image_path = os.path.join(group_folder, "images", "cropped_img", image_name)
    progress_json_path = os.path.join(group_folder, "progress.json")
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")
    if not os.path.exists(progress_json_path):
        raise HTTPException(status_code=404, detail="Progress JSON not found")

    # 이미지를 로드하고 얼굴 교체 작업을 수행합니다. (여기에 교체 로직을 구현해야 합니다.)
    try:
        image = Image.open(image_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error opening image: {str(e)}")
    # 이미지를 수정하고 저장
    modified_image_path = os.path.join(group_folder, "images", "modified_image.png")
    if not os.path.exists(modified_image_path):
        raise HTTPException(status_code=404, detail="Modified Image not found")
    try:
        modified_image = Image.open(modified_image_path)
        modified_image = swap_faces_function(modified_image, image, modified_image_path, request.humanId) , #source_image_path=modified_image_path, target_image_path=image_path
        modified_image.save(modified_image_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving image: {str(e)}")

    try:
        with open(progress_json_path, "r") as json_file:
            progress = json.load(json_file)
        progress[str(request.humanId)] = True
        with open(progress_json_path, "w") as json_file:
            json.dump(progress, json_file, indent=4)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating progress: {str(e)}")
    return {"status": "success", "modified_image_path": modified_image_path, "progress_json_path": progress_json_path}

# 수정된 이미지 불러오기
@app.post("/get_modified_img")
async def get_modified_img(request: GroupIDRequest):
    file_path = f"./data_folder/g{request.groupId}/images/modified_image.png"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

class Coordinate(BaseModel):
    x1: int
    x2: int
    y1: int
    y2: int
    
@app.post("/add_people") # coordinate = {"x1": 0, "x2": 0, "y1": 0, "y2": 0}
async def add_people(groupId: int = 0, coordinate: str = Form(...)):
    coordinate_data = json.loads(coordinate)
    coord = Coordinate(**coordinate_data)
    # if len(coordinates) != 4 or not all(isinstance(i, int) for i in coordinates):
    #     raise HTTPException(status_code=400, detail="Invalid coordinate format. Expected format: [x1, y1, x2, y2]")
    # {"x1": 50, "x2": 200, "y1": 50, "y2":500}
    # breakpoint()
    x1, y1, x2, y2 = coord.x1, coord.y1, coord.x2, coord.y2
    # 파일 경로 설정
    group_folder = f"data_folder/g{groupId}"
    modified_image_path = os.path.join(group_folder, "images", "modified_image.png")
    mask_image_path = os.path.join(group_folder, "images", "mask.png")

    if not os.path.exists(modified_image_path):
        raise HTTPException(status_code=404, detail="Modified Image not found")
    try:
        modified_image = Image.open(modified_image_path)
        mask_image = Image.open(mask_image_path)
        # 첫 번째 업로드된 파일 읽기
        # if len(files) == 0:
            # raise HTTPException(status_code=400, detail="No file uploaded")
        # added_image = Image.open(os.path.join(group_folder, "images", "mask.png"))
        added_image = Image.open(os.path.join(group_folder, "images", "added_result.png")).convert("RGBA")
        image_array = np.array(added_image)
        
        # 배경을 투명하게 설정
        alpha_channel = (np.sum(image_array[:, :, :3], axis=2) != 0).astype(np.uint8) * 255
        image_array[:, :, 3] = alpha_channel
        image_array = Image.fromarray(image_array, "RGBA")

        new_width = x2 - x1
        new_height = y2 - y1
        resized_image_array = image_array.resize((new_width, new_height))
        resized_mask_image = mask_image.resize((new_width, new_height))
        # ㅜㄷㅈ
        new_mask_image = Image.new("RGB", modified_image.size, (0, 0, 0))
        new_mask_image.paste(resized_mask_image, (x1, y1))
        # 이미지 덮어쓰기
        modified_image.paste(resized_image_array, (x1, y1), mask=resized_image_array)

        # 수정된 이미지 저장
        modified_image.save(modified_image_path)
        new_mask_image.save(mask_image_path.replace('mask.png', 'mask_resized.png'))
        # blur 
        blurr(modified_image_path, mask_image_path.replace('mask.png', 'mask_resized.png'), groupId)        

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error modifying image: {str(e)}")

    return FileResponse(modified_image_path)


@app.post("/get_coord")
def get_coord(request: GroupIDRequest):
    print("GroupIDRequest.groupId:", request.groupId)
    with open(f'./data_folder/g{request.groupId}/coordinate_info.json', 'r') as f:
        data = json.load(f)
    return {key:xyxy2xywh(data['i0'][key]) for key in data['i0']}

@app.post("/get_imageIds")
def get_imageIds(request: GroupIDRequest):
    # print("GroupIDRequest.groupId:", request.groupId)
    img_file = (glob(f'./data_folder/g{request.groupId}/images/i*.png'))
    img_file = [i for i in img_file if 'i0.png' not in i]
    return {"status": "success", "imageIds": [i.split('/')[-1].replace('.png', '') for i in img_file]} 

@app.post("/get_progress")
def get_progress(request: GroupIDRequest):
    with open(f'./data_folder/g{request.groupId}/progress.json') as f:
        data = json.load(f)
    return {"status": "success", "progress": data} 

@app.post("/init_group")
async def init_group(files: List[UploadFile] = File(...)):
    try:
        print("len(files):", len(files))
        gid = create_group(files)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving image: {str(e)}")
    print("gid:", gid)
    return {"status": "success", "groupId": gid}

async def read_file(path: str):
    try:
        async with aiofiles.open(path, mode="rb") as file:
            return await file.read()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {path}")

# @app.post("/get_cropped_imgs")
# async def get_cropped_imgs(request: GetCropImgRequest):
#     try:
#         # 1. 해당 group에서의, 수정 가능한 hids 불러오기
#         editable_hids = get_editable_hids(request.groupId)
#         if request.humanId not in editable_hids:
#             raise HTTPException(status_code=500, detail=f"no")
#         # 2. 모든 image_ids 중 hid에 해당하는 cropped_imgs만 전달
#         crops_paths = get_editable_cropped_imgs(request.groupId, [request.humanId])
#         async def image_generator():
#             for path in crops_paths:
#                 file_data = await read_file(path)
#                 yield file_data
#         # Generator로부터 바이트 스트림을 얻고, 이를 적절히 처리
#         async def stream_images():
#             async for file_data in image_generator():
#                 yield file_data
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error saving image: {str(e)}")

#     return StreamingResponse(stream_images(), media_type="multipart/mixed")


@app.post("/get_cropped_img")
async def get_cropped_img(request: GetCropImgRequest):
    try:
        # 1. 해당 group에서의, 수정 가능한 hids 불러오기
        editable_hids = get_editable_hids(request.groupId)
        # print(editable_hids)
        if request.humanId not in editable_hids:
            raise HTTPException(status_code=500, detail=f"no")
        # 2. 모든 image_ids 중 hid에 해당하는 cropped_imgs만 전달
        crops_paths = get_editable_cropped_imgs(request.groupId, [request.humanId])
        # print(crops_paths)
        crops_path = [cp for cp in crops_paths if f'{request.imageId}_' in cp][0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving image: {str(e)}")
    return FileResponse(crops_path)
    # return StreamingResponse(stream_images(), media_type="multipart/mixed")

@app.post("/get_cropped_img0")
async def get_cropped_img0(request: GetCropImgRequest):
    try:
        # 1. 해당 group에서의, 수정 가능한 hids 불러오기
        editable_hids = get_editable_hids0(request.groupId)
        # print(editable_hids)
        if request.humanId not in editable_hids:
            raise HTTPException(status_code=500, detail=f"no")
        # 2. 모든 image_ids 중 hid에 해당하는 cropped_imgs만 전달
        crops_paths = get_editable_cropped_imgs0(request.groupId, [request.humanId])
        # print(crops_paths)
        crops_path = [cp for cp in crops_paths if f'{request.imageId}_' in cp][0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving image: {str(e)}")
    return FileResponse(crops_path)
    # return StreamingResponse(stream_images(), media_type="multipart/mixed")



@app.post("/remove_background")
async def remove_background(file: UploadFile = File, gid = 43):
    breakpoint()
    try:
        ## 1. 사람 얼굴 detection -> 중심 좌표 잡기
        centroid = get_centroid(file, gid)
        if centroid == None:
            return HTTPException(status_code=404, detail=f"only one people!!")
        ## 2. 중심좌표로 sam -> 마스크 리턴 & 3. 마스크 사용해 누끼 딴 이미지 임시 저장
        remove_by_mask(centroid, gid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving image: {str(e)}")
    return FileResponse(f'./data_folder/g{gid}/images/added_result.png')

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", reload=True)
    # 실행코드
    # conda activate santa
    # uvicorn main:app --port 8080 --reload