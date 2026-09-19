import os
import sys
import time
import json
import base64
import argparse
import requests

def get_api_key():
    env_path = os.path.expanduser("~/.config/day05-day06-review/minimax.env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("MINIMAX_API_KEY="):
                    return line.split("=", 1)[1].strip()
    return os.environ.get("MINIMAX_API_KEY")

def image_to_base64(image_path):
    with open(image_path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"

def main():
    parser = argparse.ArgumentParser(description="MiniMax Image-to-Video Generator")
    parser.add_argument("--image", default="public/images/scenes/scene1_panorama.jpg", help="Path to initial frame image")
    parser.add_argument("--output", default="public/videos/hero-bg.mp4", help="Output MP4 file path")
    parser.add_argument("--api-key", default=None, help="MiniMax API Key")
    args = parser.parse_args()

    api_key = args.api_key or get_api_key()
    if not api_key:
        print("Error: MiniMax API Key not found. Please specify via --api-key or check ~/.config/day05-day06-review/minimax.env")
        sys.exit(1)

    print(f"Using API Key: {api_key[:10]}...{api_key[-6:]}")
    print(f"Source frame image: {args.image}")

    first_frame_b64 = image_to_base64(args.image)

    # 提示词：根据白银之城设计视觉动作
    prompt = (
        "Slow cinematic camera drift across the floating Silver City, "
        "majestic waterfalls cascading into sea of clouds, soft sunlight reflecting on white marble architecture, "
        "flying airships gently cruising across the sky, water ripples on the palace canals, serene, AAA fantasy game aesthetic."
    )

    payload = {
        "model": "video-01",
        "prompt": prompt,
        "first_frame_image": first_frame_b64,
        "prompt_optimizer": True
    }

    base_urls = ["https://api.minimax.io", "https://api.minimaxi.com"]
    task_id = None
    active_base_url = None

    for base_url in base_urls:
        print(f"Trying endpoint: {base_url}/v1/video_generation ...")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        try:
            resp = requests.post(f"{base_url}/v1/video_generation", headers=headers, json=payload, timeout=60)
            data = resp.json()
            print("Response:", json.dumps(data, ensure_ascii=False, indent=2))
            if data.get("task_id"):
                task_id = data.get("task_id")
                active_base_url = base_url
                break
            elif data.get("base_resp", {}).get("status_code") == 1008:
                print(f"Warning: {base_url} reported 'insufficient balance' (余额不足).")
        except Exception as e:
            print(f"Error on {base_url}: {e}")

    if not task_id:
        print("\nFailed to create MiniMax I2V task. If balance is insufficient, please recharge or check your quota.")
        sys.exit(1)

    print(f"\nTask started successfully! Task ID: {task_id}")
    print("Polling task status every 10 seconds...")

    start_time = time.time()
    while True:
        time.sleep(10)
        elapsed = int(time.time() - start_time)
        q_url = f"{active_base_url}/v1/query/video_generation?task_id={task_id}"
        try:
            q_resp = requests.get(q_url, headers=headers, timeout=20).json()
        except Exception as err:
            print(f"[{elapsed}s] Query network error: {err}")
            continue

        status = q_resp.get("status")
        print(f"[{elapsed}s] Status: {status}")

        if status in ["Success", "success"]:
            file_id = q_resp.get("file_id")
            download_url = q_resp.get("download_url") or q_resp.get("video_url")
            if not download_url and file_id:
                file_resp = requests.get(f"{active_base_url}/v1/files/retrieve?file_id={file_id}", headers=headers, timeout=20).json()
                download_url = file_resp.get("file", {}).get("download_url") or file_resp.get("download_url")

            if download_url:
                print(f"Downloading final video from: {download_url} ...")
                content = requests.get(download_url, timeout=120).content
                os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
                with open(args.output, "wb") as f:
                    f.write(content)
                print(f"Done! Saved video to: {args.output} ({len(content)} bytes)")
                sys.exit(0)
            else:
                print("Task success but could not locate download URL:", q_resp)
                sys.exit(1)
        elif status in ["Fail", "Failed", "failed"]:
            print("Task failed:", q_resp)
            sys.exit(1)
        elif elapsed > 600:
            print("Timed out after 10 minutes.")
            sys.exit(1)

if __name__ == "__main__":
    main()
