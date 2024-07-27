import cv2
import numpy as np
from PIL import Image
import json
from glob import glob
import os
import shutil
from facer import facer
from segment_anything import sam_model_registry, SamPredictor
import torch
from stable_inferenc import predict

import warnings
warnings.filterwarnings('ignore', category=UserWarning, module='google.protobuf.symbol_database')

# 얼굴 검출 모델 초기화
torch.set_grad_enabled(False)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
face_detector = facer.face_detector('retinaface/mobilenet', device=device)
sam = sam_model_registry["vit_h"](checkpoint="/home/nute11a/SANTA/segment_anything/sam_vit_h_4b8939.pth")
sam.to(device=device)
predictor = SamPredictor(sam)

def detect_face(detector, imgName, vis=False):
    image = facer.hwc2bchw(facer.read_hwc(imgName)).to(device=device)  # image: 1 x 3 x h x w
    with torch.inference_mode():
        faces = detector(image)
    if vis:
        facer.show_bchw(facer.draw_bchw(image, faces))
    return faces
##
def xyxy2xywh(bbox):
    x1, y1, x2, y2 = bbox
    return {'x1': (x1+x2)//2, 'y1': (y1+y2)//2, 'width':(x2-x1), 'height': (y2-y1)}


def swap_faces_function(source_image: Image, target_image: Image, modified_image_path: str, human_id: int) -> Image:
    # 이미지 읽기
    # convert pil to cv2
    # breakpoint()
    source_img = cv2.cvtColor(np.array(source_image), cv2.COLOR_RGB2BGR)
    target_img = cv2.cvtColor(np.array(target_image), cv2.COLOR_RGB2BGR)

    # 얼굴 인식 모델 불러오기 (OpenCV에서 제공하는 사전 훈련된 모델 사용)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # 소스 이미지에서 얼굴 검출
    source_gray = cv2.cvtColor(source_img, cv2.COLOR_BGR2GRAY)
    source_faces = face_cascade.detectMultiScale(source_gray, 1.3, 5)
    # sort source_faces
    source_faces = sorted(source_faces, key=lambda x: x[0])

    # 타겟 이미지에서 얼굴 검출
    target_gray = cv2.cvtColor(target_img, cv2.COLOR_BGR2GRAY)
    target_faces = face_cascade.detectMultiScale(target_gray, 1.3, 5)

    if len(source_faces) == 0:
        print("소스 이미지에서 얼굴을 찾을 수 없습니다.")
        return None
    if len(target_faces) == 0:
        print("타겟 이미지에서 얼굴을 찾을 수 없습니다.")
        return None

    x, y, w, h = source_faces[int(human_id[1:])]
    source_face = source_img[y:y+h, x:x+w]

    tx, ty, tw, th = target_faces[0]
    target_face = target_img[ty:ty+th, tx:tx+tw]

    # 타겟 얼굴을 소스 얼굴 크기에 맞게 조절
    target_face_resized = cv2.resize(target_face, (w, h))

    # 소스 이미지에 타겟 얼굴을 합성
    blended_img = source_img.copy()
    blended_img[y:y+h, x:x+w] = target_face_resized

    # 결과 이미지 저장
    cv2.imwrite(modified_image_path, blended_img)
    print("이미지가 성공적으로 저장되었습니다:", modified_image_path)
    return Image.open(modified_image_path)


def get_editable_hids(gid):
    with open(f'./data_folder/g{gid}/progress.json', 'r') as f:
        data = json.load(f)
    return [h for h in data if data[h] == False]

def get_editable_hids0(gid):
    with open(f'./data_folder/g{gid}/progress.json', 'r') as f:
        data = json.load(f)
    return [h for h in data]

def get_editable_cropped_imgs(gid, editable_hids):
    img_path = f'./data_folder/g{gid}/images/cropped_img/'
    crops = []
    for hid in editable_hids:
        # print([img for img in  glob(f"{img_path}/*{hid}.png") if  'i0_' not in img])
        crops += [img for img in  glob(f"{img_path}/*{hid}.png") if  'i0_' not in img]
    return crops

def get_editable_cropped_imgs0(gid, editable_hids):
    img_path = f'./data_folder/g{gid}/images/cropped_img/'
    crops = []
    for hid in editable_hids:
        # print([img for img in  glob(f"{img_path}/*{hid}.png") if  'i0_' not in img])
        crops += [img for img in  glob(f"{img_path}/*{hid}.png")]
    return crops

def get_centroid(file, gid):
    # 사람을 segmentation해주기.
    with open(f'./data_folder/g{gid}/images/added_origin.png', "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    result = detect_face(face_detector, f'./data_folder/g{gid}/images/added_origin.png')
    box = np.array(result['rects'].cpu()).astype(np.uint64).tolist()
    
    if len(box) != 1:   return None
    
    sx, sy, ex, ey = box[0]
    cx, cy = (sx + ex) // 2, (sy + ey) // 2
    return [cx, cy]

def segment_person(ip, point):
    image = cv2.imread(ip)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    predictor.set_image(image)
    # predict
    input_point = np.array([point])
    input_label = np.array([1])
    masks, _, _ = predictor.predict(
        point_coords=input_point,
        point_labels=input_label,
        multimask_output=True,
    )
    mask_human = masks[-1]  # whole mask 추출
    return mask_human.astype(np.uint8)



def remove_by_mask(centroid, gid):
    # breakpoint()
    mask = segment_person(f'./data_folder/g{gid}/images/added_origin.png', centroid)
    img = cv2.imread(f'./data_folder/g{gid}/images/added_origin.png')
    img = np.concatenate([img, np.ones((img.shape[0], img.shape[1], 1), dtype=np.uint8) * 255], axis=-1)
    result_array = img.copy()
    result_array[mask == 0] = [0, 0, 0, 0]
    # result_array = cv2.cvtColor(result_array, cv2.COLOR_RGBA2RGB)
    cv2.imwrite(f'./data_folder/g{gid}/images/mask.png', mask*255)
    cv2.imwrite(f'./data_folder/g{gid}/images/added_result.png', result_array)

def crop_img(save_path, imgId, ip):
    # img detect
    result = detect_face(face_detector, ip)
    crop_rects = np.array(result['rects'].cpu()).astype(np.uint64).tolist()
    crop_rects.sort()
    # img crop
    img, imgboxes = cv2.imread(ip), {}
    for hid, crop_rect in enumerate(crop_rects):
        sx, sy, ex, ey = crop_rect
        sx, sy, ex, ey = sx-20, sy-20, ex+20, ey+20
        if ey - sy > ex - sx:
            pad = (ey - sy) - (ex - sx)
            ex += pad//2
            sx -= pad//2
        cv2.imwrite(f'{save_path}/i{imgId}_h{hid}.png', img[sy:ey,sx:ex,:])
        imgboxes[f"h{hid}"] = [sx, sy, ex, ey]
    return imgboxes

def create_group(files):
    # group_id 생성
    data_folder = "./data_folder"
    gid = len(glob(f"{data_folder}/*"))
    group_path = f"{data_folder}/g{gid}"
    # 이미지 저장
    group_img_path = f"{group_path}/images"
    os.makedirs(group_img_path)
    os.makedirs(f"{group_img_path}/cropped_img")
    saved_files, finished, coordinates = [], {}, {}
    for idx, file in enumerate(files):
        file_location = f'{group_img_path}/i{idx}.png'
        # 파일 저장
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        if idx == 0:
            shutil.copyfile(file_location, file_location.replace('i0.png', 'modified_image.png'))
        # crop하여 저장
        imgboxes = crop_img(f"{group_img_path}/cropped_img/", idx, file_location)
        saved_files.append(file_location)
        coordinates[f"i{idx}"] = imgboxes
    
    n_humnas = len(glob(f'{group_path}/images/cropped_img/*')) // len(files)
    finished = {f"h{i}":False for i in range(n_humnas)}

    with open(f"{group_path}/progress.json", 'w') as f:
        json.dump(finished, f, indent=4)
    with open(f"{group_path}/coordinate_info.json", 'w') as f:
        json.dump(coordinates, f, indent=4)
    return gid
#------------------------
def blurr(ip, mp, gid):
    image = cv2.imread(ip)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    mask = cv2.imread(mp, cv2.IMREAD_GRAYSCALE)
    mask = np.where(mask>0, 255, 0).astype(np.float32)

    kernel = np.ones((3, 3), np.uint8)
    mask_dilate = cv2.dilate(mask, kernel, iterations=5)
    mask_erode = cv2.erode(mask, kernel, iterations=2)

    mask = mask_dilate-mask_erode

    coords = np.column_stack(np.where(mask > 0))
    y_min, x_min = coords.min(axis=0)
    y_max, x_max = coords.max(axis=0)

    value = 30

    if y_min-value < 0:
        y_min=y_min
    else: y_min-=value

    if x_min-value < 0:
        x_min=x_min
    else: x_min-=value

    if x_max+value > image.shape[1]:
        x_max = x_max
    else: x_max+=value

    if y_max+value > image.shape[0]:
        y_max = y_max
    else: y_max+=value

    crop_image = image[y_min:y_max+1,x_min:x_max+1,:]
    crop_mask = mask[y_min:y_max+1,x_min:x_max+1].astype(np.uint8)

    image_pil = Image.fromarray(crop_image)
    new_mask = Image.fromarray(crop_mask)

    input_image = {'image': image_pil, 'mask': new_mask}
    prompt = ""
    num_samples = 4 # 1, 4
    ddim_steps = 45 # 1, 50
    scale = 10 # 0.1, 30.0
    seed = 0


    result = predict(input_image, prompt, ddim_steps, num_samples, scale, seed)
    result = np.array(result[0])

    result = result[:crop_image.shape[0], :crop_image.shape[1],:]

    new_image = image
    new_image[y_min:y_max+1,x_min:x_max+1,:] = result
    # mask = np.expand_dims(mask, axis=2)
    # new_image = image * (1-mask//255) + new_image * (mask//255)
    image = cv2.cvtColor(new_image, cv2.COLOR_BGR2RGB)
    cv2.imwrite(f'./data_folder/g{gid}/images/modified_image.png', image)



# 얼굴 검출 함수
def detect_faces2(image, face_detector, device):
    image_tensor = facer.hwc2bchw(image).to(device=device)
    with torch.inference_mode():
        faces = face_detector(image_tensor)
    return faces

# 바운딩 박스를 사용하여 얼굴을 추출하는 함수
def extract_face(image, bbox):
    h, w, _ = image.shape
    x1, y1, x2, y2 = map(int, bbox)
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(w, x2)
    y2 = min(h, y2)
    face = image[y1:y2, x1:x2, :]
    return face

# # 바운딩 박스가 유효한지 확인하는 함수
# def is_valid_bbox(bbox, img_shape):
#     x1, y1, x2, y2 = map(int, bbox)
#     return 0 <= x1 < x2 <= img_shape[1] and 0 <= y1 < y2 <= img_shape[0]

# # 얼굴 합성 함수
# def swap_faces_function(source_image: Image, target_image: Image, modified_image_path: str, face_index: int, source_image_path, target_image_path) -> Image:
#     # PIL 이미지를 OpenCV 이미지로 변환
#     # source_img = cv2.cvtColor(np.array(source_image), cv2.COLOR_RGB2BGR)
#     # target_img = cv2.cvtColor(np.array(target_image), cv2.COLOR_RGB2BGR)
    
#     # 얼굴 검출
#     # breakpoint()
#     source_faces = detect_faces2(facer.read_hwc(source_image_path), face_detector, device)
#     target_faces = detect_faces2(facer.read_hwc(target_image_path), face_detector, device)

#     # 얼굴 정보가 있는지 확인
#     if len(source_faces['rects']) == 0:
#         print("소스 이미지에서 얼굴을 찾을 수 없습니다.")
#         return None
#     if len(target_faces['rects']) == 0:
#         print("타겟 이미지에서 얼굴을 찾을 수 없습니다.")
#         return None

#     # 바운딩 박스를 왼쪽에서 오른쪽 순서대로 정렬
#     source_faces['rects'] = source_faces['rects'][torch.argsort(source_faces['rects'][:, 0])]
#     target_faces['rects'] = target_faces['rects'][torch.argsort(target_faces['rects'][:, 0])]

#     blended_img = cv2.cvtColor(facer.bchw2hwc(facer.hwc2bchw(torch.tensor(np.array(source_image))).to(device=device)).cpu().numpy(), cv2.COLOR_RGB2BGR)
#     # breakpoint()
#     # 특정 인덱스의 얼굴만 변경
#     if 0 <= int(face_index[1:]) and int(face_index[1:]) < min(len(source_faces['rects']), len(target_faces['rects'])):
#         source_face_bbox = source_faces['rects'][int(face_index[1:])].cpu().numpy()
#         target_face_bbox = target_faces['rects'][0].cpu().numpy()

#         # 바운딩 박스 조정
#         source_face_bbox = [
#             max(0, source_face_bbox[0]),
#             max(0, source_face_bbox[1]),
#             min(blended_img.shape[1], source_face_bbox[2]),
#             min(blended_img.shape[0], source_face_bbox[3])
#         ]
#         target_face_bbox = [
#             max(0, target_face_bbox[0]),
#             max(0, target_face_bbox[1]),
#             min(blended_img.shape[1], target_face_bbox[2]),
#             min(blended_img.shape[0], target_face_bbox[3])
#         ]

#         if is_valid_bbox(source_face_bbox, blended_img.shape) and is_valid_bbox(target_face_bbox, blended_img.shape):
#             source_face = extract_face(blended_img, source_face_bbox)
#             target_face = extract_face(cv2.cvtColor(facer.bchw2hwc(facer.hwc2bchw(torch.tensor(np.array(target_image))).to(device=device)).cpu().numpy(), cv2.COLOR_RGB2BGR), target_face_bbox)

#             # 얼굴 크기 맞추기
#             if source_face.shape[0] > 0 and source_face.shape[1] > 0:
#                 target_face_resized = cv2.resize(target_face, (source_face.shape[1], source_face.shape[0]))

#                 # 색상 매칭 (LAB 색상 공간에서)
#                 target_face_resized_lab = cv2.cvtColor(target_face_resized, cv2.COLOR_BGR2LAB)
#                 source_face_lab = cv2.cvtColor(source_face, cv2.COLOR_BGR2LAB)

#                 l, a, b = cv2.split(target_face_resized_lab)
#                 l_mean_src, l_std_src = source_face_lab[:, :, 0].mean(), source_face_lab[:, :, 0].std()
#                 l_mean_tgt, l_std_tgt = l.mean(), l.std()

#                 l = (l - l_mean_tgt) * (l_std_src / l_std_tgt) + l_mean_src
#                 l = np.clip(l, 0, 255).astype(np.uint8)

#                 target_face_resized_lab = cv2.merge((l, a, b))
#                 target_face_resized_bgr = cv2.cvtColor(target_face_resized_lab, cv2.COLOR_LAB2BGR)

#                 # 소스 이미지에 타겟 얼굴 합성
#                 mask = 255 * np.ones(target_face_resized_bgr.shape, target_face_resized_bgr.dtype)
#                 center = (int((source_face_bbox[0] + source_face_bbox[2]) / 2), int((source_face_bbox[1] + source_face_bbox[3]) / 2))
#                 blended_img = cv2.seamlessClone(target_face_resized_bgr, blended_img, mask, center, cv2.NORMAL_CLONE)
#     else:
#         print(f"유효하지 않은 인덱스입니다. 0에서 {min(len(source_faces['rects']), len(target_faces['rects'])) - 1} 사이의 값을 입력하세요.")
    
#     # 결과 이미지 저장
#     blended_img_pil = Image.fromarray(cv2.cvtColor(blended_img, cv2.COLOR_BGR2RGB))
#     blended_img_pil.save(modified_image_path, 'PNG')
#     print("이미지가 성공적으로 저장되었습니다:", modified_image_path)
#     return blended_img_pil
# #--------------------
# if __name__ == "__main__":
#     source_image = Image.open("data_folder/g0/i0_h0.png")
#     target_image = Image.open("data_folder/g0/i1_h0.png")
#     modified_image_path = "data_folder/g0/modified_image.png"
#     swap_faces_function(source_image, target_image, modified_image_path)