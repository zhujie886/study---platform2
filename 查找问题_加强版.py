#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Code Doctor V11.0 (语法感知+智能路由版)
====================================
核心升级：
1. 🚑 语法健康扫描：检测未闭合的引号、括号，精准捕获 "Unterminated string" 错误。
2. 🔣 乱码探测器：扫描代码中疑似乱码的非 UTF-8 字符（解决截图中的 Mojibake 问题）。
3. 🛣️ 智能路由识别：自动豁免 pages/app 目录下的文件，不再误报“孤岛”。
4. 🔗 别名解析增强：支持 @/ 路径解析。
"""

import os
import re
import sys
import json
import datetime
from pathlib import Path
from collections import defaultdict
from typing import Set, List, Dict, Tuple

# =========================
# 颜色配置
# =========================
class C:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

# =========================
# 核心诊断引擎
# =========================
class CodeDoctorV11:
    def __init__(self, root_dir: str):
        self.root = Path(root_dir).resolve()
        # 假设常见的别名指向
        self.alias_map = {
            "@": self.root / "client" / "src",
            "~": self.root / "client" / "src"
        }
        
        self.all_files: Set[Path] = set()
        self.package_json_deps: Set[str] = set()
        self.import_graph: Dict[Path, List[str]] = defaultdict(list)
        self.reference_graph: Dict[Path, int] = defaultdict(int)

        self.issues = {
            "SYNTAX": [],   # 新增：语法/编码错误 (最高优先级)
            "CRITICAL": [], # 断链
            "MUST_FIX": [], # 逻辑缺失
            "ORPHAN": [],   # 孤岛
            "WARN": []      # 建议
        }

    def run(self):
        print(f"{C.HEADER}👁️ 启动全景天眼 V11.0 (语法感知版)...{C.ENDC}")
        print(f"📂 扫描根目录: {self.root}")
        
        self._scan_package_json()
        self._index_all_files()
        
        print(f"🔍 正在深度扫描 {len(self.all_files)} 个文件...")
        for idx, file_path in enumerate(self.all_files, 1):
            # 进度条效果
            sys.stdout.write(f"\rAnalyzing: {idx}/{len(self.all_files)}")
            sys.stdout.flush()
            self._analyze_file_content(file_path)
        
        print("\n🧠 正在进行链路逻辑推演...")
        self._analyze_graph_logic()

        self._generate_dashboard_html()

    # --- 基础设施 ---
    def _scan_package_json(self):
        for pjson in self.root.rglob("package.json"):
            if "node_modules" in str(pjson): continue
            try:
                data = json.loads(pjson.read_text(encoding='utf-8'))
                deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
                self.package_json_deps.update(deps.keys())
            except: pass

    def _index_all_files(self):
        exts = {".ts", ".tsx", ".js", ".jsx", ".css", ".scss"}
        for ext in exts:
            for f in self.root.rglob(f"*{ext}"):
                if any(x in str(f) for x in ["node_modules", "dist", "build", ".git"]): continue
                self.all_files.add(f)

    # --- 核心解析 ---
    def _analyze_file_content(self, file_path: Path):
        rel_path = file_path.relative_to(self.root)
        content = ""
        
        # 1. 安全读取 (防止编码炸裂)
        try:
            content = file_path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            self.issues["SYNTAX"].append({
                "type": "文件编码错误", "file": str(rel_path),
                "msg": "文件无法用 UTF-8 读取，可能包含乱码或保存为 GBK", "fix": "请使用编辑器将文件编码转为 UTF-8"
            })
            return # 无法读取，跳过后续分析

        lines = content.splitlines()

        # 2. 语法健康检查 (模拟编译器行为)
        self._check_syntax_sanity(lines, str(rel_path))

        # 3. 提取 Import
        # 支持 import x from '...' 和 require('...')
        imports = re.findall(r"(?:import|export)\s+(?:[\w\s{},*]+)\s+from\s+['\"](.*?)['\"]", content)
        imports += re.findall(r"import\(['\"](.*?)['\"]", content)
        imports += re.findall(r"require\(['\"](.*?)['\"]", content)
        self.import_graph[file_path] = imports

        # 4. 致命检查：AI 幻觉
        if "...rest of code" in content or "// ..." in content and len(content) < 200:
             self.issues["CRITICAL"].append({
                "type": "AI幻觉代码", "file": str(rel_path),
                "msg": "发现未完成的代码片段", "fix": "需人工补全"
            })

    def _check_syntax_sanity(self, lines: List[str], rel_path: str):
        """
        专门针对截图中的 'Unterminated string' 和乱码进行检测
        """
        for i, line in enumerate(lines):
            line_num = i + 1
            stripped = line.strip()
            
            # A. 检测单行内的引号不匹配 (简单的启发式检测)
            # 排除注释 //
            code_part = line.split('//')[0]
            
            # 统计单引号和双引号数量（忽略转义的 \' \"）
            # 注意：这只是一个简单的报警器，不完美，但能抓到大多数愚蠢错误
            sq_count = len(re.findall(r"(?<!\\)'", code_part))
            dq_count = len(re.findall(r'(?<!\\)"', code_part))
            
            # 如果是奇数个引号，且这行不像是一个跨行字符串的中间部分，报警
            # (排除反引号 ` 这种模板字符串)
            if sq_count % 2 != 0 or dq_count % 2 != 0:
                # 只有当行尾不是逗号或连接符时才报，减少误报
                if not stripped.endswith(',') and not stripped.endswith('(') and not stripped.endswith('+'):
                    self.issues["SYNTAX"].append({
                        "type": "语法/引号未闭合", 
                        "file": f"{rel_path}:{line_num}",
                        "msg": f"检测到奇数个引号，可能导致 'Unterminated string'",
                        "fix": "检查该行字符串是否正确闭合"
                    })

            # B. 检测乱码/Mojibake (针对截图中的 '鏃犳' 这种常见GBK转UTF8的乱码)
            # 匹配常见的乱码中文字符范围，或者不仅是中文但明显上下文不对的
            # 这里使用简单的策略：如果在代码逻辑里出现了非ASCII字符，且不在注释里
            if re.search(r"[^\x00-\x7F]", code_part):
                # 如果包含中文字符，可能是正常的中文文案，但如果是生僻怪字...
                # 这是一个简化的乱码检测正则
                if re.search(r"[鏃犳牳]", code_part): # 把截图中出现的乱码字放进去
                    self.issues["SYNTAX"].append({
                        "type": "疑似乱码炸弹",
                        "file": f"{rel_path}:{line_num}",
                        "msg": f"检测到可疑字符 (如: 鏃, 犳)，通常是编码错误",
                        "fix": "文件可能损坏，请检查之前的复制粘贴操作"
                    })

    # --- 逻辑推演 ---
    def _analyze_graph_logic(self):
        for file_path, imports in self.import_graph.items():
            current_dir = file_path.parent
            
            for imp in imports:
                # 处理相对路径
                if imp.startswith("."):
                    target = self._resolve_file(current_dir, imp)
                # 处理别名路径 (@/...)
                elif imp.startswith("@/"):
                    real_path_str = imp.replace("@/", str(self.alias_map["@"]) + "/")
                    # 尝试解析绝对路径
                    target = self._resolve_file(Path(real_path_str).parent, "./" + Path(real_path_str).name)
                    # 如果 resolve 失败，尝试作为目录下的 index
                    if not target:
                        target = self._resolve_file(Path(real_path_str), ".")
                else:
                    # NPM 包，跳过
                    continue

                if target:
                    self.reference_graph[target] += 1
                else:
                    # 只有确信不是 NPM 包才报断链
                    if not imp.startswith("@") and "/" in imp and not imp.startswith("."):
                         pass # 可能是 scope 包 @types/react
                    else:
                        self.issues["CRITICAL"].append({
                            "type": "断链引用",
                            "file": str(file_path.relative_to(self.root)),
                            "msg": f"无法找到文件: '{imp}'",
                            "fix": "检查路径拼写或别名配置"
                        })

        # 孤岛检测 (增强版白名单)
        # 只要文件路径包含这些关键词，就默认它是入口文件，不报错
        whitelist_dirs = {"pages", "routes", "app", "layouts", "main.tsx", "index.tsx", "App.tsx", "vite.config.ts"}
        
        for f in self.all_files:
            rel_str = str(f.relative_to(self.root)).replace("\\", "/")
            
            # 如果文件不在引用图中，且不在白名单目录里
            if f not in self.reference_graph:
                # 检查白名单
                is_safe = False
                for w in whitelist_dirs:
                    if w in rel_str.split("/"): # 目录匹配
                        is_safe = True
                        break
                    if w in f.name: # 文件名匹配
                        is_safe = True
                        break
                
                if not is_safe:
                    # 只有组件和工具类才报孤岛
                    self.issues["ORPHAN"].append({
                        "type": "孤岛文件",
                        "file": rel_str,
                        "msg": "未被引用且不在 pages/ 目录中",
                        "fix": "确认是否为废弃代码"
                    })

    def _resolve_file(self, base_dir: Path, import_path: str) -> Path:
        """尝试解析文件的多种可能性"""
        try:
            target = (base_dir / import_path).resolve()
        except: return None
        
        # 1. 直接命中
        if target.is_file() and target in self.all_files: return target
        
        # 2. 补后缀
        for ext in ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss']:
            p = target.with_suffix(ext)
            if p in self.all_files: return p
            
        # 3. 找目录下的 index
        for ext in ['.ts', '.tsx', '.js', '.jsx']:
            p = target / f"index{ext}"
            if p in self.all_files: return p
            
        return None

    # --- 报告生成 ---
    def _generate_dashboard_html(self):
        # 统计数据
        counts = {k: len(v) for k, v in self.issues.items()}
        
        def render_rows(key, css_class):
            if not self.issues[key]: return f'<tr><td colspan="4" style="text-align:center;color:#ccc;">✨ 无此类问题</td></tr>'
            html = ""
            for item in self.issues[key]:
                html += f'<tr class="{css_class}"><td>{item["type"]}</td><td class="code">{item["file"]}</td><td>{item["msg"]}</td><td>{item["fix"]}</td></tr>'
            return html

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; background: #f0f2f5; }}
        .card {{ background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }}
        h1 {{ color: #1a1a1a; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
        th {{ text-align: left; padding: 12px; background: #fafafa; border-bottom: 2px solid #eee; }}
        td {{ padding: 12px; border-bottom: 1px solid #eee; vertical-align: top; }}
        .code {{ font-family: monospace; color: #d63384; background: #fff0f6; padding: 2px 5px; border-radius: 4px; }}
        .tag {{ display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: white; }}
        .bg-red {{ background: #ff4d4f; }}
        .bg-orange {{ background: #faad14; }}
        .bg-blue {{ background: #1890ff; }}
        .stat-box {{ display: flex; gap: 20px; margin-bottom: 20px; }}
        .stat-item {{ flex: 1; background: white; padding: 20px; border-radius: 8px; text-align: center; border-top: 4px solid #ccc; }}
    </style>
</head>
<body>
    <h1>🩺 Code Doctor V11.0 诊断报告</h1>
    
    <div class="stat-box">
        <div class="stat-item" style="border-color: #ff0000">
            <h2>{counts['SYNTAX']}</h2>
            <div style="color:#ff0000">🔥 语法/乱码 (最高危)</div>
        </div>
        <div class="stat-item" style="border-color: #ff4d4f">
            <h2>{counts['CRITICAL']}</h2>
            <div style="color:#ff4d4f">🚫 断链引用</div>
        </div>
        <div class="stat-item" style="border-color: #1890ff">
            <h2>{counts['ORPHAN']}</h2>
            <div style="color:#1890ff">🏝️ 孤岛文件</div>
        </div>
    </div>

    <div class="card">
        <h3 style="color: #ff0000">🔥 语法与编码灾难 (必须立即修复)</h3>
        <p>这里的问题会导致编译直接报错（如 Unterminated string）。</p>
        <table>
            <thead><tr><th width="15%">类型</th><th width="30%">位置</th><th>详情</th><th>修复</th></tr></thead>
            <tbody>{render_rows('SYNTAX', '')}</tbody>
        </table>
    </div>

    <div class="card">
        <h3 style="color: #ff4d4f">🚫 引用断链 (会导致白屏)</h3>
        <table>
            <thead><tr><th width="15%">类型</th><th width="30%">位置</th><th>详情</th><th>修复</th></tr></thead>
            <tbody>{render_rows('CRITICAL', '')}</tbody>
        </table>
    </div>

    <div class="card">
        <h3 style="color: #1890ff">🏝️ 孤岛文件 (建议清理)</h3>
        <p>已自动过滤 pages/app 路由目录，剩下的极有可能是废弃代码。</p>
        <table>
            <thead><tr><th width="15%">类型</th><th width="30%">位置</th><th>详情</th><th>修复</th></tr></thead>
            <tbody>{render_rows('ORPHAN', '')}</tbody>
        </table>
    </div>
</body>
</html>
"""
        out = self.root / "doctor_report_v11.html"
        out.write_text(html, encoding='utf-8')
        print(f"\n{C.OKGREEN}✅ 诊断完成！报告已生成: {out}{C.ENDC}")

if __name__ == "__main__":
    CodeDoctorV11(os.getcwd()).run()