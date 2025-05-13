import asyncio
import os
import sys
import time
from ultralytics import YOLO
from google import genai
from PIL import Image, ImageDraw, ImageFont
import textwrap
import mimetypes
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GENAI_API_KEY")

# ===== CONFIGURATION =====
YOLO_MODEL_PATH = "best.pt"

GENAI_API_KEY   = api_key
FONT_PATH       = None   # None sẽ dùng font mặc định
FONT_SIZE       = 22     # kích cỡ chữ (pt)

# ===== INITIALIZATION =====
print("[Log] Loading YOLO model…")
t0 = time.perf_counter()
yolo_model = YOLO(YOLO_MODEL_PATH)
yolo_model.model.to("cuda").model.half()
client     = genai.Client(api_key=GENAI_API_KEY)
t1 = time.perf_counter()
print(f"[Log] Model & client init took {(t1 - t0)*1000:.1f} ms")

def detect_text_box(img_path: str) -> tuple:
    result = yolo_model(img_path)[0]
    coords_list = result.boxes.xyxy.tolist()
    cls_list    = result.boxes.cls.tolist()
    names       = yolo_model.names

    for coords, cls in zip(coords_list, cls_list):
        if names[int(cls)] == "question":
            return tuple(map(int, coords[:4]))
    for coords, cls in zip(coords_list, cls_list):
        if names[int(cls)] == "answer":
            return tuple(map(int, coords[:4]))
    raise ValueError("No text box (question/answer) found in image.")

def load_image_bytes(img_path: str) -> bytes:
    with open(img_path, "rb") as f:
        return f.read()

def call_gemini_multimodal(prompt: str, img_bytes: bytes, mime: str) -> str:
    from google.genai.types import Part, GenerateContentConfig

    image_part = Part.from_bytes(data=img_bytes, mime_type=mime)
    contents   = [prompt, image_part]
    config     = GenerateContentConfig(temperature=0.8, max_output_tokens=512)

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=contents,
        config=config
    )
    return response.text

def render_new_question(img_path: str, box: tuple, new_text: str) -> Image.Image:
    img  = Image.open(img_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    # load font
    try:
        font = ImageFont.truetype(FONT_PATH, FONT_SIZE) if FONT_PATH else ImageFont.load_default()
    except:
        font = ImageFont.load_default()

    x1, y1, x2, y2 = box
    draw.rectangle([x1, y1, x2, y2], fill="white")

    max_width  = x2 - x1 - 10
    wrap_chars = max(20, int(max_width / (FONT_SIZE * 0.6)))
    lines = []
    for para in new_text.split("\n"):
        wrapped = textwrap.wrap(para, width=wrap_chars)
        lines.extend(wrapped if wrapped else [""])

    y = y1 + 5
    for line in lines:
        draw.text((x1 + 5, y), line, font=font, fill="black")
        # đo chiều cao dòng qua font.getbbox
        bbox = font.getbbox(line)
        h = bbox[3] - bbox[1]
        y += h + 4
        if y > y2 - 5:
            break

    return img

async def process_image(input_path: str, output_path: str):
    # 1. Detect
    print("[Log] Starting detection…")
    t_start = time.perf_counter()
    box = await asyncio.to_thread(detect_text_box, input_path)
    t_detect = time.perf_counter()
    print(f"[Log] Detection took {(t_detect - t_start)*1000:.1f} ms")

    # 2. Load bytes
    print("[Log] Loading image bytes…")
    img_bytes = await asyncio.to_thread(load_image_bytes, input_path)
    t_load = time.perf_counter()
    print(f"[Log] Loading/reading image took {(t_load - t_detect)*1000:.1f} ms")

    # 3. Gemini API
    ext  = os.path.splitext(input_path)[1].lower()
    mime = "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png"
    prompt = (
      """ You will be provided with an image containing a 6th-grade multiple-choice math problem with four options (A, B, C, D).

Your task is to reformulate this problem to create a new practice question for students.

The primary goal is to change the wording or the problem's specifics such that the core mathematical concept remains relevant, and critically, the correct answer to the *new* question corresponds exactly to one of the *original* correct options (A, B, C, or D).

To achieve this, you should first analyze and solve the *original* problem step-by-step to fully understand its logic and solution.

You may alter the problem statement, context, or numerical values. The new question might require the same solution method as the original, or a slightly different approach, as long as the correct outcome aligns with one of the original answer choices.

Aim for a concise and reasonably altered version. The change should be significant enough that it doesn't feel identical to the original, promoting more robust review, especially for problems the student previously struggled with.

Your response MUST only contain the text of the *new* question. Do NOT include the original options (A, B, C, D), any explanations, or any other text.""")
    print("[Log] Calling Gemini API…")
    response_text = await asyncio.to_thread(call_gemini_multimodal, prompt, img_bytes, mime)
    t_api = time.perf_counter()
    print(f"[Log] Gemini API call took {(t_api - t_load)*1000:.1f} ms")

    # 4. Render & save
    print("[Log] Rendering and saving image…")
    out_img = await asyncio.to_thread(render_new_question, input_path, box, response_text)
    await asyncio.to_thread(out_img.save, output_path)
    t_end = time.perf_counter()
    print(f"[Log] Render + save took {(t_end - t_api)*1000:.1f} ms")
    print(f"[Log] Total processing time: {(t_end - t_start)*1000:.1f} ms")
    print(f"✅ Saved generated image to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python pipeline.py <input_image> <output_image>")
        sys.exit(1)
    asyncio.run(process_image(sys.argv[1], sys.argv[2]))