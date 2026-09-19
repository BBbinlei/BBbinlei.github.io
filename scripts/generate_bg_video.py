import os
import time
import sys
import json
import requests

# 1. 读取 API Key
env_path = os.path.expanduser("~/.config/day05-day06-review/minimax.env")
api_key = None
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("MINIMAX_API_KEY="):
                api_key = line.split("=", 1)[1].strip()
                break

if not api_key:
    api_key = os.environ.get("MINIMAX_API_KEY")

if not api_key:
    print("Error: MINIMAX_API_KEY not found in ~/.config/day05-day06-review/minimax.env or environment.")
    sys.exit(1)

print(f"Loaded MiniMax API Key: {api_key[:10]}...{api_key[-6:]}")

# 2. 端点与请求头
# 优先中国区域名，若异常则可尝试国际域名
BASE_URL = "https://api.minimaxi.com"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# 3. 提示词（遵循 design-system.md 《白银之城》维多利亚月光美学）
prompt = (
    "Cinematic aerial shot of a majestic Victorian fantasy city at night, Silver City aesthetic, "
    "cold moonlight illuminating intricate Gothic and Victorian architecture, pointed towers, silver and marble rooftops, "
    "deep midnight blue atmospheric sky, gentle mist flowing between grand stone bridges, "
    "faint warm golden lights glowing from arched windows, subtle sparkling starlight particles drifting in the air. "
    "Masterpiece, high fantasy, AAA video game trailer quality, 8k resolution, serene, sacred, elegant, calm motion, slow forward drift."
)

payload = {
    "model": "video-01",
    "prompt": prompt,
    "prompt_optimizer": True
}

print("Submitting video generation task to MiniMax...")
try:
    resp = requests.post(f"{BASE_URL}/v1/video_generation", headers=headers, json=payload, timeout=30)
    print(f"Status Code: {resp.status_code}")
    data = resp.json()
    print("Response JSON:", json.dumps(data, ensure_ascii=False, indent=2))
except Exception as e:
    print(f"Request failed on {BASE_URL}: {e}")
    # Try api.minimax.io
    BASE_URL = "https://api.minimax.io"
    resp = requests.post(f"{BASE_URL}/v1/video_generation", headers=headers, json=payload, timeout=30)
    print(f"Fallback Status Code: {resp.status_code}")
    data = resp.json()
    print("Fallback Response JSON:", json.dumps(data, ensure_ascii=False, indent=2))

task_id = data.get("task_id")
if not task_id:
    print("Failed to get task_id. Aborting.")
    sys.exit(1)

print(f"\nTask successfully created! Task ID: {task_id}")

# 4. 轮询状态
output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "videos"))
os.makedirs(output_dir, exist_ok=True)
target_video_path = os.path.join(output_dir, "hero-bg.mp4")

print(f"Target video save path: {target_video_path}")
print("Starting polling loop (every 10 seconds)...")

start_time = time.time()
while True:
    time.sleep(10)
    elapsed = int(time.time() - start_time)
    
    try:
        query_resp = requests.get(f"{BASE_URL}/v1/query/video_generation?task_id={task_id}", headers=headers, timeout=20)
        q_data = query_resp.json()
    except Exception as err:
        print(f"[{elapsed}s] Query request error: {err}")
        continue
    
    status = q_data.get("status")
    print(f"[{elapsed}s] Current Status: {status}")
    
    if status == "Success" or status == "success":
        file_id = q_data.get("file_id")
        download_url = q_data.get("download_url") or q_data.get("video_url")
        
        # 如果需要 retrieve file_id
        if not download_url and file_id:
            print(f"Retrieving file URL for file_id: {file_id}...")
            file_resp = requests.get(f"{BASE_URL}/v1/files/retrieve?file_id={file_id}", headers=headers, timeout=20)
            f_data = file_resp.json()
            download_url = f_data.get("file", {}).get("download_url") or f_data.get("download_url")
        
        if download_url:
            print(f"Downloading video from {download_url}...")
            v_content = requests.get(download_url, timeout=60).content
            with open(target_video_path, "wb") as vf:
                vf.write(v_content)
            print(f"Success! Video saved to {target_video_path} ({len(v_content)} bytes)")
            sys.exit(0)
        else:
            print("Status Success but no download_url found. Query response:", q_data)
            sys.exit(1)
            
    elif status in ["Fail", "Failed", "failed"]:
        print("Task failed:", json.dumps(q_data, ensure_ascii=False, indent=2))
        sys.exit(1)
    elif elapsed > 600:
        print("Timeout after 10 minutes.")
        sys.exit(1)
