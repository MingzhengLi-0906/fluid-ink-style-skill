# Fluid Ink Figure · 流体水墨画 Figure

[中文](#中文) · [English](#english)

---

## 中文

`fluid-ink-figure` 是一个 Codex Skill，用于创作或转换带有实时流体效果的水墨画 figure。它通过隐藏的画面吸附图谱保留可辨认的构图，同时让颜料在 Stable Fluids 模拟中产生扩散、推流、涡旋、沉积、混色和重新聚合。

它的目标不是在图片上添加模糊动画，而是让最终可见像素真正来自持续运行的流体颜料状态。

### 适用场景

- 把参考图片转换成可点击、可拖曳的流体水墨画。
- 根据多张国画、水墨画或构图参考创作原创互动 figure。
- 只有文字描述时，先动态研究相关题材，再生成构图和流体实现。
- 在现有 React、Three.js 或普通前端项目中嵌入水墨 figure。
- 没有现有项目时，生成最小 Vite／Three.js 演示。

### 不适用场景

- 滚轮驱动的章节叙事或整站 scrollytelling。
- 普通网页 redesign、排版或信息架构设计。
- 只需要一张静态水墨图片的任务。
- 只使用 CSS blur、滤镜或圆形扩散的伪流体效果。

### 核心工作流

```text
用户参考／文字描述
        ↓
自适应需求访谈（最多一轮六问）
        ↓
可见构图草图与第一次确认
        ↓
隐藏吸附图谱／结构场
        ↓
Stable Fluids：velocity → pressure → humidity → pigment → deposit
        ↓
真实 GPU 流体首帧与第二次确认
        ↓
移除所有静态草图／图集显示层
        ↓
可交互流体水墨 Figure
```

隐藏图谱会持续参与颜料恢复，但不会被最终 composite 直接绘制。最终画面只读取真实平流后的湿颜料、沉积、湿度、毛细边缘和纸张材质。

### 主要能力

- 三种输入模式：直接转换、多参考综合、纯文字研究创作。
- 构图草图与真实流体画面两次确认。
- 点击滴入颜料与水，拖曳连续推动流体。
- 默认约 3–6 秒柔和恢复；吸附强度可设为零。
- 多颜料语义通道和多颜色混合。
- RGBA pigment banks 动态分配，不写死全局通道数量。
- 湿墨、浓墨、淡洗、沉积、飞白、纸白切口和宣纸纹理。
- WebGL2 完整路径、能力检测、质量降级和静态 fallback。
- 独立 figure 支持触控；嵌入移动页面时避免抢占原生滚动。

### 安装

在 Codex 中，可以直接请求内置安装 Skill 从本仓库安装：

```text
使用 $skill-installer 从下面的 GitHub 仓库安装根目录 Skill，
并将它命名为 fluid-ink-figure：
https://github.com/MingzhengLi-0906/fluid-ink-style-skill
```

也可以手动克隆，并将本仓库的 Skill payload 复制到 Codex Skills 目录：

```text
~/.codex/skills/fluid-ink-figure/
├─ SKILL.md
├─ agents/
├─ assets/
├─ references/
└─ scripts/
```

安装完成后，在下一轮任务中使用 `$fluid-ink-figure` 调用。

### 使用示例

```text
使用 $fluid-ink-figure，根据我提供的锦鲤和荷花参考，
创作一幅红、黑、松叶绿三种颜料的可交互水墨 figure。
拖曳后让画面在约四秒内缓慢恢复。
```

```text
使用 $fluid-ink-figure 创作一幅孤舟、远山和红日的横向水墨 figure。
我没有参考图片，请先自行研究合适的国画素材，再向我确认构图草图。
```

### 需求访谈

Skill 会优先从参考和项目中推断需求，只询问尚不明确的内容，并把问题限制在一轮六问以内。可能涉及：

- 主体层级和不可舍弃的元素；
- 构图忠实度与水墨抽象程度；
- 扰动后是否恢复以及恢复速度；
- 颜料通道、配色和混色程度；
- 点击／拖曳的交互力度；
- 目标尺寸、嵌入环境和移动端行为。

如果用户回答“按照推荐”，Skill 会采用平衡写意、有限湿边混色、3–6 秒恢复、暖色宣纸和隐藏控制界面等默认值。

### 仓库内容

```text
.
├─ SKILL.md                         Skill 入口与核心约束
├─ agents/openai.yaml              Codex UI 与自动调用配置
├─ references/
│  ├─ intake.md                    自适应需求访谈
│  ├─ attractor-atlas.md           隐藏吸附图谱制作方法
│  ├─ fluid-architecture.md        Stable Fluids 与多颜料架构
│  └─ verification.md              视觉、交互、技术与性能验收
├─ scripts/
│  ├─ prepare_attractor.py         从图片准备 RGBA 吸附图谱
│  └─ validate_attractor.py        检查透明度、背景和裁切风险
└─ assets/fluid-ink-figure-template/
   ├─ src/FluidInkFigure.js        可嵌入流体引擎
   ├─ src/shaders.js               流体和纸墨 shaders
   ├─ src/main.js                  最小示例
   └─ attractor-manifest.example.json
```

### 图集工具

图像脚本依赖 Pillow。请使用同一个 Python 解释器安装和运行：

```bash
python -m pip install Pillow
python scripts/validate_attractor.py input.png
python scripts/prepare_attractor.py input.png output.png \
  --background light --threshold 0.94 --softness 0.16 --max-side 2048
python scripts/validate_attractor.py output.png --strict
```

不要根据预览中的棋盘格假设图片具有透明通道。自动去背景也可能误删浅灰雾气或淡彩笔触，因此输出仍需视觉复核。

### 运行演示模板

```bash
cd assets/fluid-ink-figure-template
npm install
npm run dev
```

模板中的双颜料曲线只是可运行示例。正式作品应使用经过确认的原创构图和按 RGBA banks 编码的隐藏吸附图谱。

### 验证状态

- Skill 结构验证通过。
- 图集准备和检查脚本已通过实际 RGB／RGBA 输入测试。
- 模板通过 Vite production build。
- 软件 WebGL 烟雾测试确认 shader 可运行、颜料 accumulator 非空且 `glError=0`。
- 最终作品仍应在目标真实 GPU、桌面和移动视口上进行画质与性能验收。

### 许可

本仓库目前尚未包含 `LICENSE`。在公开再分发前应选择并添加明确的软件许可。

---

## English

`fluid-ink-figure` is a Codex Skill for creating or transforming interactive ink-wash figures with real-time fluid behavior. A hidden artwork attractor preserves a recognizable composition while pigments diffuse, flow, curl, deposit, mix, and recover through a Stable Fluids simulation.

The goal is not to place a blurred animation over an image. Every visible ink pixel in the final result should come from the evolving fluid pigment state.

### Use cases

- Transform a reference image into a clickable and draggable fluid ink figure.
- Synthesize an original composition from multiple ink-painting references.
- Research relevant visual references when the user provides only a text description.
- Embed a fluid ink figure into an existing React, Three.js, or plain frontend project.
- Generate a minimal Vite/Three.js demo when no host project exists.

### Out of scope

- Scroll-driven storytelling or full-page scrollytelling.
- General website redesign, layout, or information architecture.
- Tasks that only require a static ink illustration.
- CSS blur, filter, or expanding-circle effects presented as fluid simulation.

### Core workflow

```text
User references or description
        ↓
Adaptive intake — no more than one round of six questions
        ↓
Visible composition blueprint and first approval gate
        ↓
Hidden attractor atlas or structure field
        ↓
Stable Fluids: velocity → pressure → humidity → pigment → deposit
        ↓
Real GPU fluid frame and second approval gate
        ↓
Remove every visible blueprint or atlas layer
        ↓
Interactive fluid ink figure
```

The hidden atlas remains active for recovery, but it is never sampled by the final composite. The final image reads only advected wet pigment, deposit, humidity, capillary edges, and paper material.

### Highlights

- Direct transformation, multi-reference synthesis, and text-only research modes.
- Separate blueprint and GPU-fluid approval gates.
- Click/tap pigment deposition and continuous directional drag forces.
- Adjustable recovery with a gentle 3–6 second default; zero attraction is supported.
- Multiple semantic pigment channels and colors.
- Dynamically allocated RGBA pigment banks rather than a fixed global channel count.
- Wet bloom, dense cores, diluted wash, deposit, flying-white gaps, and xuan-paper texture.
- WebGL2 full path with capability probes, quality degradation, and static fallback.
- Touch interaction for standalone figures without stealing native scrolling in mobile embeds.

### Installation

Ask Codex to install the root Skill from this repository:

```text
Use $skill-installer to install the root skill from this GitHub repository
and name it fluid-ink-figure:
https://github.com/MingzhengLi-0906/fluid-ink-style-skill
```

For a manual installation, clone the repository and copy the Skill payload into:

```text
~/.codex/skills/fluid-ink-figure/
├─ SKILL.md
├─ agents/
├─ assets/
├─ references/
└─ scripts/
```

Invoke it as `$fluid-ink-figure` on the next task after installation.

### Usage examples

```text
Use $fluid-ink-figure with my koi and lotus references to create an interactive
ink figure using charcoal, cinnabar, and pine-green pigments. Let the painting
recover gently about four seconds after a drag.
```

```text
Use $fluid-ink-figure to create a wide ink figure with a solitary boat,
distant mountains, and a red sun. I have no reference image, so research
appropriate ink-painting references before showing me the composition blueprint.
```

### Adaptive intake

The Skill infers as much as possible from the references and host project, then asks only unresolved questions, with a maximum of six in one round. Topics may include:

- subject hierarchy and required elements;
- composition fidelity and ink abstraction;
- recovery behavior and timing;
- pigment channels, palette, and mixing;
- interaction strength;
- target aspect ratio, integration environment, and mobile behavior.

When the user says “use the recommendations,” the defaults are balanced xieyi abstraction, controlled wet-edge mixing, gentle 3–6 second recovery, warm paper, and no visible controls.

### Repository layout

```text
.
├─ SKILL.md                         Skill entry point and invariants
├─ agents/openai.yaml              Codex UI and invocation policy
├─ references/
│  ├─ intake.md                    Adaptive intake
│  ├─ attractor-atlas.md           Hidden-attractor production
│  ├─ fluid-architecture.md        Stable Fluids and pigment banks
│  └─ verification.md              Visual, motion, technical, and performance QA
├─ scripts/
│  ├─ prepare_attractor.py         Prepare an RGBA attractor from an image
│  └─ validate_attractor.py        Inspect alpha, background, bounds, and crop risk
└─ assets/fluid-ink-figure-template/
   ├─ src/FluidInkFigure.js        Embeddable fluid engine
   ├─ src/shaders.js               Fluid and paper shaders
   ├─ src/main.js                  Minimal demo
   └─ attractor-manifest.example.json
```

### Atlas utilities

The image utilities require Pillow. Install and run it with the same Python interpreter:

```bash
python -m pip install Pillow
python scripts/validate_attractor.py input.png
python scripts/prepare_attractor.py input.png output.png \
  --background light --threshold 0.94 --softness 0.16 --max-side 2048
python scripts/validate_attractor.py output.png --strict
```

Never assume that a checkerboard preview means the file has real alpha. Automatic background extraction can also remove pale gray mist or light washes, so review the processed atlas visually.

### Run the starter

```bash
cd assets/fluid-ink-figure-template
npm install
npm run dev
```

The two-pigment curves in the starter are only a runnable example. Production artwork should use an approved original composition and hidden attractor textures encoded into RGBA banks.

### Verification status

- The Skill structure passes validation.
- The atlas utilities have been tested with real RGB and RGBA inputs.
- The starter passes a Vite production build.
- A software-WebGL smoke test confirmed running shaders, a non-empty pigment accumulator, and `glError=0`.
- Every finished artwork still requires visual and performance validation on the target real GPU and desktop/mobile viewports.

### License

This repository does not currently include a `LICENSE` file. Choose and add an explicit software license before public redistribution.
