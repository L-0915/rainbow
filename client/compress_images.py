"""
压缩图片脚本 - 优化卡通数字人等大图图片
"""
import os
import sys
from PIL import Image

# 图片目录
public_dir = os.path.join(os.path.dirname(__file__), 'public')

# 需要压缩的图片及其目标尺寸
images_to_compress = {
    '卡通数字人.png': (400, 400),      # 2.6MB -> 目标压缩到 200KB 以内
    '卡通数字人 2.png': (400, 400),    # 3.4MB -> 目标压缩到 200KB 以内
    'home-bg.png': (800, 800),         # 3.9MB -> 压缩背景
    'login-bg.png': (800, 800),        # 3.5MB -> 压缩背景
    '草地.png': (800, 400),            # 5.2MB -> 压缩
    '彩虹 3.png': (400, 400),          # 2.4MB -> 压缩
    '游乐场入口.png': (400, 400),      # 3.8MB -> 压缩
    'icon.png': (512, 512),            # 3.6MB -> 压缩
}

def compress_image(image_path, target_size):
    """压缩单张图片"""
    if not os.path.exists(image_path):
        print(f"File not found: {image_path}")
        return

    # 获取原始大小
    original_size = os.path.getsize(image_path) / (1024 * 1024)  # MB

    with Image.open(image_path) as img:
        # 转换为 RGBA（保留透明通道）
        if img.mode != 'RGBA':
            img = img.convert('RGBA')

        # 调整尺寸
        img.thumbnail(target_size, Image.Resampling.LANCZOS)

        # 保存压缩后的图片
        img.save(image_path, 'PNG', optimize=True, compress_level=9)

    # 获取压缩后大小
    compressed_size = os.path.getsize(image_path) / (1024 * 1024)  # MB
    reduction = (1 - compressed_size / original_size) * 100

    print(f"OK: {os.path.basename(image_path)}: {original_size:.2f}MB -> {compressed_size:.2f}MB (reduced {reduction:.1f}%)")

def main():
    print("Starting image compression...\n")

    for filename, size in images_to_compress.items():
        image_path = os.path.join(public_dir, filename)
        compress_image(image_path, size)

    print("\nImage compression completed!")

if __name__ == '__main__':
    main()
