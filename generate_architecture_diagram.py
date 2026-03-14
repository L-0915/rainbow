"""
彩虹创口贴 - 产品功能与技术架构全景图（优化版）
运行前请确保安装 matplotlib: pip install matplotlib
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, ConnectionPatch, BoxStyle
import matplotlib.patheffects as path_effects

# 设置中文字体（自动检测系统可用字体）
import platform
system = platform.system()
if system == 'Windows':
    plt.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei', 'DejaVu Sans']
elif system == 'Darwin':  # macOS
    plt.rcParams['font.sans-serif'] = ['PingFang SC', 'Heiti SC', 'Arial Unicode MS', 'DejaVu Sans']
else:  # Linux
    plt.rcParams['font.sans-serif'] = ['WenQuanYi Micro Hei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# 创建画布
fig = plt.figure(figsize=(24, 18))  # 稍增大尺寸，更清晰
ax = fig.add_subplot(111)
ax.set_xlim(0, 120)
ax.set_ylim(0, 120)
ax.axis('off')

# 颜色方案（柔和粉彩，符合儿童产品）
colors = {
    'frontend_bg': '#E1F5FE',      # 极浅蓝
    'frontend_border': '#0288D1',
    'backend_bg': '#FFF3E0',       # 极浅橙
    'backend_border': '#F57C00',
    'ai_bg': '#F3E5F5',            # 极浅紫
    'ai_border': '#7B1FA2',
    'component_bg': '#FFFFFF',
    'component_border': '#B0BEC5',
    'game_bg': '#FFF1E0',          # 极浅橘
    'game_border': '#E64A19',
    'emotion_bg': '#FCE4EC',       # 极浅粉
    'emotion_border': '#C2185B',
    'flow_bg': '#E0F2F1',          # 极浅青
    'flow_border': '#00796B',
    'text_primary': '#1A1A1A',
    'text_secondary': '#546E7A',
    'arrow': '#546E7A',
    'shadow': '#CCCCCC'
}

def create_rounded_rect(x, y, width, height, edgecolor, facecolor, alpha=0.9, linewidth=1.5):
    """创建带圆角的矩形，可加阴影"""
    rect = FancyBboxPatch(
        (x - width/2, y - height/2), width, height,
        boxstyle=BoxStyle("Round", pad=0.3, rounding_size=3),
        linewidth=linewidth,
        edgecolor=edgecolor,
        facecolor=facecolor,
        alpha=alpha
    )
    # 添加简单阴影效果（通过绘制一个偏移的灰色矩形）
    shadow = FancyBboxPatch(
        (x - width/2 + 2, y - height/2 - 2), width, height,
        boxstyle=BoxStyle("Round", pad=0.3, rounding_size=3),
        linewidth=0,
        facecolor=colors['shadow'],
        alpha=0.3,
        zorder=0
    )
    ax.add_patch(shadow)
    return rect

def create_text_box(x, y, text, edgecolor, facecolor, fontsize=8, bold=True, has_shadow=True):
    """创建带文字的自适应圆角矩形框"""
    char_count = len(text)
    chinese_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
    english_chars = char_count - chinese_chars
    base_width = chinese_chars * (fontsize + 2) + english_chars * (fontsize - 1) + 20
    width = max(20, base_width)
    height = fontsize + 8

    rect = FancyBboxPatch(
        (x - width/2, y - height/2), width, height,
        boxstyle=BoxStyle("Round", pad=0.3, rounding_size=2.5),
        linewidth=1.2,
        edgecolor=edgecolor,
        facecolor=facecolor,
        alpha=0.95
    )
    if has_shadow:
        shadow = FancyBboxPatch(
            (x - width/2 + 1.5, y - height/2 - 1.5), width, height,
            boxstyle=BoxStyle("Round", pad=0.3, rounding_size=2.5),
            linewidth=0,
            facecolor=colors['shadow'],
            alpha=0.2,
            zorder=0
        )
        ax.add_patch(shadow)
    ax.add_patch(rect)

    # 文字加粗效果
    txt = ax.text(x, y, text, fontsize=fontsize, ha='center', va='center',
                  color=colors['text_primary'], weight='bold' if bold else 'normal')
    txt.set_path_effects([path_effects.withStroke(linewidth=2, foreground='white')])
    return rect

# ============ 主标题 ============
fig.suptitle('🌈 彩虹创口贴 - 产品功能与技术架构全景图', fontsize=24, fontweight='bold', y=0.98)

# ============ 用户交互流程（左侧） ============
ax.text(18, 110, '用户交互流程', fontsize=14, fontweight='bold', ha='center', color=colors['text_primary'])

flow_rect = create_rounded_rect(18, 100, 28, 18, colors['flow_border'], colors['flow_bg'])
ax.add_patch(flow_rect)

step1 = create_text_box(18, 106, '① 选择今日心情', colors['flow_border'], '#FFFFFF', fontsize=10)
step2 = create_text_box(18, 100, '② AI 温暖回复', colors['flow_border'], '#FFFFFF', fontsize=10)
step3 = create_text_box(18, 94, '③ 推荐对应游戏', colors['flow_border'], '#FFFFFF', fontsize=10)

# 箭头
arrow1 = ConnectionPatch(xyA=(18, 103), xyB=(18, 101), coordsA="data", coordsB="data",
                         arrowstyle="-|>", mutation_scale=20, linewidth=2, color=colors['arrow'])
ax.add_patch(arrow1)
arrow2 = ConnectionPatch(xyA=(18, 97), xyB=(18, 95), coordsA="data", coordsB="data",
                         arrowstyle="-|>", mutation_scale=20, linewidth=2, color=colors['arrow'])
ax.add_patch(arrow2)

# ============ 情绪选择与游戏映射（中间） ============
ax.text(55, 110, '情绪 - 游戏映射（产品核心逻辑）', fontsize=14, fontweight='bold', ha='center', color=colors['text_primary'])

emotion_rect = create_rounded_rect(55, 100, 45, 18, colors['emotion_border'], colors['emotion_bg'])
ax.add_patch(emotion_rect)

emotions = [
    (35, 106, '😊 开心', '#FFE082'),
    (45, 106, '😌 平静', '#A5D6A7'),
    (55, 106, '😍 喜爱', '#F48FB1'),
    (65, 106, '😢 难过', '#90CAF9'),
    (75, 106, '😠 生气', '#EF9A9A'),
    (45, 98,  '😨 害怕', '#A3D9A5'),
    (55, 98,  '🤔 思考', '#FFCC80'),
    (65, 98,  '😴 疲惫', '#CE93D8'),
]

for x, y, label, color in emotions:
    create_text_box(x, y, label, colors['emotion_border'], color, fontsize=8)

# ============ 游戏列表（中间下） ============
ax.text(55, 82, '六款情绪调节游戏（技术实现）', fontsize=14, fontweight='bold', ha='center', color=colors['text_primary'])

games_rect = create_rounded_rect(55, 68, 45, 22, colors['game_border'], colors['game_bg'])
ax.add_patch(games_rect)

games = [
    (35, 76, '🎠 慢慢转木马', '滑杆控制'),
    (45, 76, '🏠 影子小屋', '点击对话'),
    (55, 76, '🗺️ 地图导航', '飞行动画'),
    (65, 76, '✈️ 纸飞机', '绘图物理'),
    (75, 76, '🚗 碰碰车', '碰撞检测'),
    (35, 66, '🌈 彩虹接接乐', '重力模拟'),
    (45, 66, '🎡 云朵瞭望台', '缓动动画'),
    (55, 66, '🪂 坠落与接住', '物理模拟'),
    (65, 66, '🎢 心跳过山车', '路径动画'),
    (75, 66, '🎯 情绪靶场', '点击投射'),
]

for x, y, title, tech in games:
    create_text_box(x, y+1.5, title, colors['game_border'], '#FFFFFF', fontsize=7)
    ax.text(x, y, tech, fontsize=5, ha='center', color=colors['text_secondary'])

# ============ 前端技术栈（右上） ============
ax.text(100, 110, '前端技术栈', fontsize=13, fontweight='bold', ha='center', color=colors['text_primary'])

frontend_rect = create_rounded_rect(100, 100, 30, 18, colors['frontend_border'], colors['frontend_bg'])
ax.add_patch(frontend_rect)

frontend_techs = [
    (90, 106, 'React 18'),
    (100, 106, 'TypeScript'),
    (110, 106, 'Vite'),
    (90, 100, 'Tailwind'),
    (100, 100, 'PWA'),
    (110, 100, 'React Router'),
    (90, 94, 'Zustand'),
    (100, 94, 'Axios'),
]

for x, y, name in frontend_techs:
    create_text_box(x, y, name, colors['component_border'], colors['component_bg'], fontsize=7)

# ============ 动画/游戏引擎（右中） ============
ax.text(100, 82, '动画/游戏引擎', fontsize=12, fontweight='bold', ha='center', color=colors['text_primary'])

engine_rect = create_rounded_rect(100, 74, 30, 12, colors['game_border'], colors['game_bg'])
ax.add_patch(engine_rect)

engine_techs = [
    (90, 78, 'Framer Motion'),
    (100, 78, 'Pixi.js'),
    (110, 78, 'Canvas API'),
    (90, 70, 'GSAP'),
]

for x, y, name in engine_techs:
    create_text_box(x, y, name, colors['game_border'], '#FFF8F0', fontsize=7)

# ============ 后端服务（右下） ============
ax.text(100, 60, '后端服务', fontsize=13, fontweight='bold', ha='center', color=colors['text_primary'])

backend_rect = create_rounded_rect(100, 50, 30, 18, colors['backend_border'], colors['backend_bg'])
ax.add_patch(backend_rect)

backend_techs = [
    (90, 56, 'FastAPI'),
    (100, 56, 'Uvicorn'),
    (110, 56, 'Pydantic'),
    (90, 50, 'SQLAlchemy'),
    (100, 50, 'SQLite'),
    (110, 50, 'httpx'),
    (90, 44, 'Celery'),
    (100, 44, 'Redis'),
]

for x, y, name in backend_techs:
    create_text_box(x, y, name, colors['component_border'], colors['component_bg'], fontsize=7)

# ============ AI 模型（底部居中） ============
ai_box = create_text_box(55, 30, '通义千问 Qwen-Plus', colors['ai_border'], colors['ai_bg'], fontsize=14)
ax.text(55, 30, '通义千问 Qwen-Plus', fontsize=14, fontweight='bold', ha='center', va='center', color=colors['text_primary'])
ax.text(55, 25, '温暖陪伴 | 情绪感知 | 积极鼓励 | 启发引导', fontsize=9, ha='center', color=colors['text_secondary'])

ai_features = [
    (25, 18, '接纳优先'),
    (40, 18, '赋能引导'),
    (55, 18, '温暖人设'),
    (70, 18, '儿童友好'),
    (85, 18, '安全过滤'),
]

for x, y, name in ai_features:
    create_text_box(x, y, name, colors['ai_border'], colors['ai_bg'], fontsize=8)

# ============ 连接箭头 ============
# 流程 → 情绪
arrow_fe = ConnectionPatch(xyA=(32, 100), xyB=(40, 103), coordsA="data", coordsB="data",
                           arrowstyle="-|>", mutation_scale=20, linewidth=2, color=colors['arrow'])
ax.add_patch(arrow_fe)

# 情绪 → 游戏
arrow_eg = ConnectionPatch(xyA=(55, 91), xyB=(55, 84), coordsA="data", coordsB="data",
                           arrowstyle="-|>", mutation_scale=20, linewidth=2, color=colors['arrow'])
ax.add_patch(arrow_eg)

# 前端 → 引擎
arrow_fe_eng = ConnectionPatch(xyA=(100, 91), xyB=(100, 80), coordsA="data", coordsB="data",
                               arrowstyle="-|>", mutation_scale=20, linewidth=2, color=colors['arrow'])
ax.add_patch(arrow_fe_eng)

# 引擎 → 游戏
arrow_eng_game = ConnectionPatch(xyA=(90, 70), xyB=(80, 70), coordsA="data", coordsB="data",
                                 arrowstyle="-|>", mutation_scale=20, linewidth=2, color=colors['arrow'])
ax.add_patch(arrow_eng_game)

# 游戏 → 后端
arrow_game_back = ConnectionPatch(xyA=(80, 60), xyB=(90, 56), coordsA="data", coordsB="data",
                                  arrowstyle="-|>", mutation_scale=20, linewidth=2, color=colors['arrow'])
ax.add_patch(arrow_game_back)

# 后端 → AI
arrow_back_ai = ConnectionPatch(xyA=(100, 41), xyB=(80, 30), coordsA="data", coordsB="data",
                                arrowstyle="-|>", mutation_scale=20, linewidth=2, color=colors['arrow'])
ax.add_patch(arrow_back_ai)

# ============ 图例 ============
legend_elements = [
    mpatches.Patch(facecolor=colors['flow_bg'], edgecolor=colors['flow_border'], label='用户流程'),
    mpatches.Patch(facecolor=colors['emotion_bg'], edgecolor=colors['emotion_border'], label='情绪选择'),
    mpatches.Patch(facecolor=colors['game_bg'], edgecolor=colors['game_border'], label='游戏功能'),
    mpatches.Patch(facecolor=colors['frontend_bg'], edgecolor=colors['frontend_border'], label='前端技术'),
    mpatches.Patch(facecolor=colors['backend_bg'], edgecolor=colors['backend_border'], label='后端服务'),
    mpatches.Patch(facecolor=colors['ai_bg'], edgecolor=colors['ai_border'], label='AI 模型'),
]
ax.legend(handles=legend_elements, loc='upper left', bbox_to_anchor=(0.02, 0.98),
          frameon=True, fancybox=True, shadow=True, fontsize=9)

# ============ 保存图片 ============
output_path = 'architecture_diagram.png'
plt.tight_layout()
plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
print(f"✅ 架构图已生成：{output_path} (尺寸: 24x18 英寸, 300 DPI)")