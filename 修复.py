import os

# ==========================================
# 1. 新的界面代码 (美化版)
# ==========================================
NEW_VUE_CODE = r"""
<template>
  <div class="personalized-config-card">
    <div class="glass-overlay"></div>
    <div class="header">
      <div class="header-left">
        <div class="icon-box"><el-icon><MagicStick /></el-icon></div>
        <div class="text-group">
          <span class="title">个性化空间</span>
          <span class="subtitle">Avatar & Style Studio</span>
        </div>
      </div>
      <el-button class="upload-btn" @click="triggerUpload" round>
        <el-icon><Upload /></el-icon> 更换头像
      </el-button>
    </div>
    <div class="content-wrapper">
      <div class="preview-zone">
        <div class="avatar-stage" :class="currentBorder">
          <div class="border-layer"></div>
          <div class="img-container">
            <img :src="avatarUrl" alt="Avatar" />
          </div>
        </div>
        <div class="preview-hint">
          <span>当前效果预览</span>
          <p>设置将同步至您的个人主页</p>
        </div>
      </div>
      <div class="options-zone">
        <div class="zone-label">选择边框风格</div>
        <div class="options-grid">
          <div v-for="item in borderList" :key="item.value" class="option-item"
            :class="{ active: currentBorder === item.value }" @click="selectBorder(item.value)">
            <div class="mini-preview" :class="item.value">
              <div class="mini-border"></div>
              <div class="mini-bg"></div>
            </div>
            <span class="name">{{ item.name }}</span>
          </div>
        </div>
      </div>
    </div>
    <input type="file" ref="fileInput" style="display: none" accept="image/*" @change="handleFileChange" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Picture, Edit, Upload, MagicStick } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const defaultAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
const avatarUrl = ref(defaultAvatar)
const currentBorder = ref('border-none')
const fileInput = ref(null)

const borderList = [
  { name: '原图', value: 'border-none' },
  { name: '流金岁月', value: 'border-gold' },
  { name: '赛博朋克', value: 'border-tech' },
  { name: '秘密花园', value: 'border-garden' },
  { name: '星际穿越', value: 'border-galaxy' }
]

const triggerUpload = () => { fileInput.value.click() }

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) { ElMessage.warning('图片大小不能超过 2MB'); return }
    const reader = new FileReader()
    reader.onload = (e) => { avatarUrl.value = e.target.result; ElMessage.success('头像上传成功') }
    reader.readAsDataURL(file)
  }
}
const selectBorder = (val) => { currentBorder.value = val }
</script>

<style scoped lang="scss">
.personalized-config-card {
  position: relative; background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%);
  border-radius: 24px; padding: 30px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  overflow: hidden; font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', sans-serif;
  &::before { content: ''; position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(167, 139, 250, 0.2) 0%, rgba(255,255,255,0) 70%); border-radius: 50%; }
}
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; position: relative; z-index: 2;
  .header-left { display: flex; align-items: center; gap: 15px;
    .icon-box { width: 40px; height: 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
    .text-group { display: flex; flex-direction: column; .title { font-size: 18px; font-weight: 700; color: #1f2937; } .subtitle { font-size: 12px; color: #9ca3af; letter-spacing: 0.5px; } } }
  .upload-btn { border: none; background: #fff; color: #4b5563; box-shadow: 0 2px 8px rgba(0,0,0,0.05); &:hover { color: #6366f1; background: #f9fafb; } }
}
.content-wrapper { display: flex; gap: 40px; align-items: center; position: relative; z-index: 2; @media (max-width: 768px) { flex-direction: column; } }
.preview-zone { display: flex; flex-direction: column; align-items: center; gap: 15px; min-width: 140px; }
.avatar-stage { width: 120px; height: 120px; position: relative; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.5s ease;
  .img-container { width: 100px; height: 100px; border-radius: 50%; overflow: hidden; position: relative; z-index: 2; background: #fff; border: 2px solid #fff; img { width: 100%; height: 100%; object-fit: cover; } }
  &.border-none { .border-layer { display: none; } .img-container { border: 4px solid #f3f4f6; } }
}
.preview-hint { text-align: center; span { display: block; font-size: 14px; font-weight: 600; color: #374151; } p { font-size: 12px; color: #9ca3af; margin-top: 4px; } }
.options-zone { flex: 1; .zone-label { font-size: 14px; color: #6b7280; margin-bottom: 15px; font-weight: 500; } }
.options-grid { display: flex; gap: 15px; flex-wrap: wrap; }
.option-item { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; padding: 10px; border-radius: 12px; transition: all 0.3s;
  &:hover { background: rgba(255, 255, 255, 0.8); } &.active { background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.08); .name { color: #6366f1; font-weight: 700; } } .name { font-size: 12px; color: #6b7280; } }
.mini-preview { width: 40px; height: 40px; border-radius: 50%; position: relative; display: flex; align-items: center; justify-content: center; .mini-bg { width: 30px; height: 30px; background: #e5e7eb; border-radius: 50%; z-index: 2; } .mini-border { position: absolute; inset: 0; border-radius: 50%; } }
/* 高级边框特效 */
.border-gold { .border-layer { position: absolute; inset: -5px; border-radius: 50%; background: conic-gradient(from 0deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c); z-index: 1; animation: spin 10s linear infinite; mask: radial-gradient(transparent 64%, black 65%); -webkit-mask: radial-gradient(transparent 64%, black 65%); } &.mini-preview .mini-border { background: conic-gradient(#bf953f, #fcf6ba, #bf953f); mask: radial-gradient(transparent 60%, black 61%); -webkit-mask: radial-gradient(transparent 60%, black 61%); } }
.border-tech { .border-layer { position: absolute; inset: -8px; border-radius: 50%; border: 2px dashed #00f2fe; box-shadow: 0 0 10px #4facfe; z-index: 1; animation: spin 20s linear infinite reverse; &::after { content: ''; position: absolute; inset: -4px; border-radius: 50%; border: 2px solid transparent; border-top-color: #4facfe; border-bottom-color: #f093fb; animation: spin 3s linear infinite; } } &.mini-preview .mini-border { border: 2px dashed #00f2fe; &::after { content: ''; position: absolute; inset: -2px; border-radius: 50%; border: 1px solid transparent; border-top-color: #4facfe; } } }
.border-garden { .border-layer { position: absolute; inset: -6px; border-radius: 50%; background: repeating-conic-gradient(from 0deg, #10b981 0deg 10deg, #34d399 10deg 20deg, #ecfdf5 20deg 30deg); z-index: 1; mask: radial-gradient(transparent 62%, black 64%); -webkit-mask: radial-gradient(transparent 62%, black 64%); animation: spin 30s linear infinite; } &::before { content: ''; position: absolute; top: -10px; right: 0; width: 20px; height: 20px; background: radial-gradient(circle, #fcd34d 40%, transparent 70%); border-radius: 50%; z-index: 3; animation: float 3s ease-in-out infinite; } &.mini-preview .mini-border { background: conic-gradient(#10b981, #34d399, #ecfdf5, #10b981); mask: radial-gradient(transparent 60%, black 61%); -webkit-mask: radial-gradient(transparent 60%, black 61%); } }
.border-galaxy { .border-layer { position: absolute; inset: -4px; border-radius: 50%; background: linear-gradient(45deg, #ec4899, #8b5cf6, #3b82f6); background-size: 200% 200%; z-index: 1; animation: gradientMove 3s ease infinite; box-shadow: 0 0 15px rgba(139, 92, 246, 0.5); } &.mini-preview .mini-border { background: linear-gradient(45deg, #ec4899, #8b5cf6); mask: radial-gradient(transparent 60%, black 61%); -webkit-mask: radial-gradient(transparent 60%, black 61%); } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
</style>
"""

# ==========================================
# 2. 强力搜索逻辑 (使用英文特征码)
# ==========================================
def find_and_overwrite():
    current_dir = os.getcwd()
    print(f"🔍 正在 {current_dir} 下全盘搜索目标文件...")
    print("🚀 搜索策略: 寻找包含 'border-mint' 或 'preview-section' 代码的文件")
    
    target_path = None
    files_scanned = 0
    
    # 遍历所有子文件夹
    for root, dirs, files in os.walk(current_dir):
        # 排除 node_modules 和 .git 文件夹，提高速度
        if 'node_modules' in dirs: dirs.remove('node_modules')
        if '.git' in dirs: dirs.remove('.git')
        
        for file in files:
            if file.endswith(".vue"):
                files_scanned += 1
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # 核心修改：不找中文，找代码里一定存在的英文变量名
                        # "border-mint" 是你截图中那个绿色边框的类名，一定存在
                        if "border-mint" in content or "preview-section" in content:
                            target_path = full_path
                            print(f"✅ 找到文件: {full_path}")
                            break
                except Exception:
                    continue # 忽略无法读取的文件
        if target_path: break
    
    if target_path:
        try:
            # 1. 自动备份
            with open(target_path, 'r', encoding='utf-8') as f:
                old_content = f.read()
            with open(target_path + ".bak", 'w', encoding='utf-8') as f:
                f.write(old_content)
            
            # 2. 覆盖写入
            with open(target_path, 'w', encoding='utf-8') as f:
                f.write(NEW_VUE_CODE)
            
            print("-" * 40)
            print(f"🎉 成功锁定并修改文件: {os.path.basename(target_path)}")
            print("🚀 已自动美化完成，请去浏览器查看效果！")
            print("-" * 40)
            
        except Exception as e:
            print(f"❌ 写入失败: {e}")
    else:
        print(f"❌ 扫描了 {files_scanned} 个Vue文件，依然没找到。")
        print("如果是刚下载的项目，请确认你是否解压了？")

if __name__ == "__main__":
    find_and_overwrite()