import os

# ================= 配置区域 =================
# 输出的文件名
OUTPUT_FILE = 'full_project_code.txt'

# 要忽略的文件夹 (非常重要，否则文件会几百MB大)
IGNORE_DIRS = {
    'node_modules', '.git', 'dist', 'build',
    '.idea', '.vscode', '__pycache__', 'coverage',
    'uploads', '.vite'
}

# 要忽略的具体文件
IGNORE_FILES = {
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    '.DS_Store', 'Thumbs.db', OUTPUT_FILE,
    'project_packer.py', 'pack_and_fix.py', 'fix_network_final.py'
}

# 要提取的文件后缀 (白名单)
TARGET_EXTENSIONS = {
    # 后端
    '.ts', '.js', '.json', '.prisma',
    # 前端
    '.tsx', '.jsx', '.css', '.html',
    # 配置与脚本
    '.env', '.env.example', '.gitignore',
    '.bat', '.sh', '.py', '.md'
}


# ===========================================

def pack_project():
    root_dir = os.getcwd()
    print(f"🚀 开始扫描项目根目录: {root_dir}")
    print(f"📂 正在忽略: {', '.join(IGNORE_DIRS)}")

    success_count = 0
    error_count = 0

    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
            # 写入头部信息
            outfile.write(f"# Project Code Export\n")
            outfile.write(f"# Root Directory: {root_dir}\n")
            outfile.write("=" * 50 + "\n\n")

            for root, dirs, files in os.walk(root_dir):
                # 1. 修改 dirs 列表，实现原地过滤 (这是 os.walk 的特性)
                dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

                for file in files:
                    if file in IGNORE_FILES:
                        continue

                    _, ext = os.path.splitext(file)

                    # 检查后缀是否在白名单中
                    if ext.lower() in TARGET_EXTENSIONS or file == '.gitignore':
                        file_path = os.path.join(root, file)
                        rel_path = os.path.relpath(file_path, root_dir)

                        try:
                            with open(file_path, 'r', encoding='utf-8') as infile:
                                content = infile.read()

                                # 写入分隔符和文件名
                                outfile.write(f"{'=' * 50}\n")
                                outfile.write(f"File: {rel_path}\n")
                                outfile.write(f"{'=' * 50}\n")
                                outfile.write(content)
                                outfile.write("\n\n")

                                print(f"✅ 已提取: {rel_path}")
                                success_count += 1
                        except UnicodeDecodeError:
                            print(f"⚠️ 跳过二进制或编码错误文件: {rel_path}")
                            error_count += 1
                        except Exception as e:
                            print(f"❌ 读取错误 {rel_path}: {e}")
                            error_count += 1

        print("\n" + "=" * 30)
        print(f"🎉 打包完成！")
        print(f"📄 成功提取文件数: {success_count}")
        if error_count > 0:
            print(f"⚠️ 跳过文件数: {error_count}")
        print(f"💾 所有代码已保存到: {os.path.abspath(OUTPUT_FILE)}")
        print("=" * 30)

    except Exception as e:
        print(f"❌ 创建输出文件失败: {e}")


if __name__ == '__main__':
    pack_project()

