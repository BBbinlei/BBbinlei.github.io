import subprocess
import os

scenes_dir = "public/images/scenes"
output_video = "public/videos/hero-bg.mp4"
temp_dir = "scripts/temp_clips"
os.makedirs(temp_dir, exist_ok=True)

# 5个分镜不同的微动运镜设计 (Ken Burns Effect)
# 每个片段时长 4.5 秒，30fps
clips = [
    {
        "input": f"{scenes_dir}/scene1_panorama.jpg",
        "vf": "scale=2560:1440,zoompan=z='min(zoom+0.0003,1.08)':d=135:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30",
        "output": f"{temp_dir}/clip1.mp4"
    },
    {
        "input": f"{scenes_dir}/scene2_palace.jpg",
        "vf": "scale=2560:1440,zoompan=z='1.05':d=135:x='iw/2-(iw/zoom/2)+0.15*on':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30",
        "output": f"{temp_dir}/clip2.mp4"
    },
    {
        "input": f"{scenes_dir}/scene3_terrace.jpg",
        "vf": "scale=2560:1440,zoompan=z='if(lte(zoom,1.0),1.07,max(1.0,zoom-0.0003))':d=135:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30",
        "output": f"{temp_dir}/clip3.mp4"
    },
    {
        "input": f"{scenes_dir}/scene4_greenhouse.jpg",
        "vf": "scale=2560:1440,zoompan=z='min(zoom+0.0003,1.06)':d=135:x='iw/2-(iw/zoom/2)-0.15*on':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30",
        "output": f"{temp_dir}/clip4.mp4"
    },
    {
        "input": f"{scenes_dir}/scene5_harbor.jpg",
        "vf": "scale=2560:1440,zoompan=z='1.04':d=135:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)+0.1*on':s=1920x1080:fps=30",
        "output": f"{temp_dir}/clip5.mp4"
    }
]

print("1. 生成各分镜运镜片段...")
for idx, clip in enumerate(clips):
    print(f"-> 渲染 Clip {idx+1}: {clip['input']} ...")
    cmd = [
        "ffmpeg", "-y", "-loop", "1", "-i", clip["input"],
        "-vf", clip["vf"],
        "-t", "4.5",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast",
        "-an", clip["output"]
    ]
    subprocess.run(cmd, check=True)

print("2. 使用 xfade 滤镜进行电影级平滑交叉淡入淡出（Crossfade）拼接...")
# 5个片段，每个 4.5s，转场 0.8s
# 偏移点:
# offset 1 = 4.5 - 0.8 = 3.7
# offset 2 = 3.7 + 4.5 - 0.8 = 7.4
# offset 3 = 7.4 + 4.5 - 0.8 = 11.1
# offset 4 = 11.1 + 4.5 - 0.8 = 14.8
filter_complex = (
    "[0:v][1:v]xfade=transition=fade:duration=0.8:offset=3.7[v01];"
    "[v01][2:v]xfade=transition=fade:duration=0.8:offset=7.4[v02];"
    "[v02][3:v]xfade=transition=fade:duration=0.8:offset=11.1[v03];"
    "[v03][4:v]xfade=transition=fade:duration=0.8:offset=14.8[vfinal]"
)

cmd_concat = [
    "ffmpeg", "-y",
    "-i", f"{temp_dir}/clip1.mp4",
    "-i", f"{temp_dir}/clip2.mp4",
    "-i", f"{temp_dir}/clip3.mp4",
    "-i", f"{temp_dir}/clip4.mp4",
    "-i", f"{temp_dir}/clip5.mp4",
    "-filter_complex", filter_complex,
    "-map", "[vfinal]",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-preset", "medium",
    "-an", output_video
]

subprocess.run(cmd_concat, check=True)
print(f"3. 拼接完成！最终全景电影感背景视频已保存至: {output_video}")

# 清理临时文件
for clip in clips:
    if os.path.exists(clip["output"]):
        os.remove(clip["output"])
os.rmdir(temp_dir)
print("4. 临时缓存已清理。")
