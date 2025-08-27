# AGENT Context for Web Drumkit

本文件为本项目（Web Drumkit）的代理/协作开发指南，提炼自类似音乐项目的成熟实践，并结合当前仓库实际情况。

## 项目概览

- 目标：构建一个浏览器中的 Drumkit（鼓机/套鼓）练习与演示应用。
- 受众：鼓手、音乐学习者、音频/前端开发者。
- 核心价值：低延迟音频反馈 + 清晰可视化反馈，支持键盘映射与触控操作。

## 技术栈

- 构建/脚手架：Vite 5
- 前端：React 18 + TypeScript
- 样式：TailwindCSS 3（见 `tailwind.config.js` 和 `src/index.css`）
- 音频：Web Audio API（解码/播放样本、增益控制、路由）
- 包管理：推荐 `pnpm`

## 目录与关键文件

- 根目录
  - `README.md`：项目使用说明与样本库说明
  - `AGENT.md`：本文件，协作与开发规则
  - `package.json`：脚本与依赖（当前提供 `dev`/`build`/`preview`）
  - `tailwind.config.js`、`postcss.config.js`：样式配置
  - `vite.config.ts`：Vite 配置
- 源码
  - `src/App.tsx`、`src/main.tsx`、`src/index.css`
- 采样
  - `drum-samples/`：外部鼓样本库（体积较大，开发期直读，生产需取舍）

## 通用开发规则（General Rules）

- Audio-First：音频是核心；交互后立即给出声音反馈，尽量降低延迟；首次用户手势解锁 AudioContext；提供全局音量/静音。
- Dual Feedback：声音与可视化并重（鼓垫高亮/动画与声音同步）。
- Keyboard Shortcuts：提供键盘映射（如 `A S D F ...` 对应 Kick/Snare/Hat/Tom/Ride）；在 UI 中展示映射提示。
- Accessibility：全键盘可操作；ARIA 语义；不要只依赖视觉提示。
- Performance：
  - 预加载关键样本（首屏常用 Kick/Snare/HHats）；其他按需/懒加载。
  - 复用 `AudioBuffer` 与节点，避免重复解码与过度创建。
  - 在高并发触发时节流/合并视觉动画，避免掉帧。
- State Scope：
  - 全局设置（音量、套鼓/样本集选择）集中管理（后续如引入状态库再统一）。
  - 组件局部交互使用局部状态。
- Code Organization：
  - 抽出通用音频工具（加载、解码、播放、增益）集中复用。
  - 组件命名使用 PascalCase；自定义 hooks 以 `use` 开头；文件名保持一致性。
- Consistency：保持小而清晰的函数，统一风格与命名。
- Quality Gates：本地确保 `pnpm dev` 可运行、`pnpm build` 可构建、`pnpm preview` 可本地预览；若后续添加 ESLint/Prettier，提交前通过检查。
- Testing Focus：
  - 在桌面/移动端浏览器验证播放与延迟。
  - 关键工具函数可做轻量单测（若后续引入测试框架）。
  - 手测响应式布局与不同输入（键盘/鼠标/触屏）。
- Documentation：新增显著功能时更新 `README.md`：键位映射、使用说明、限制与已知问题。

## 音频实现要点（Web Audio）

- AudioContext：仅在首次用户手势（点击/按键）中创建或 `resume`，以通过浏览器自动播放策略。
- 样本加载：
  - 使用 `fetch + decodeAudioData` 解码为 `AudioBuffer`，缓存到内存。
  - 大体积样本避免全量预加载；优先核心鼓件。
- 播放策略：
  - One-shot：为每次触发创建 `AudioBufferSourceNode` 并连接到 `GainNode` → `destination`。
  - 支持同一声音快速重触发（不要复用已 `start()` 的 source）。
  - 提供全局增益与每个鼓件的局部增益（可选）。
- 时序与同步：视觉动画应与 `currentTime` 同步；必要时使用 `start(when)` 做轻量调度。

## 体验与可访问性（UX & A11y）

- 即时性：按下即响；视觉与声学反馈一致且可预测。
- 清晰反馈：加载、错误、静音状态应有明显指示。
- 辅助功能：为鼓垫提供角色/标签与键盘 tabindex；支持 Space/Enter 触发。

## 性能与体积（样本库）

- 开发期可直接引用 `drum-samples/` 中的文件路径。
- 生产构建不建议打包全部 WAV：
  1) 复制常用子集到 `public/samples/`；
  2) 预处理/压缩（如转 44.1kHz 16-bit WAV 或 OGG）；
  3) 首次触发懒加载，配合加载指示。

## 开发流程（建议）

1) 理解：先阅读 `README.md` 与现有代码模式。
2) 规划：较大改动先简单列出 TODO/子任务。
3) 实现：遵循上文规则与现有代码风格。
4) 验证：
   - 桌面/移动浏览器实测音频与键盘映射。
   - `pnpm build` 无报错；如有格式/语法检查，确保通过。
5) 文档：更新 README 的使用说明与键位映射。

## Git 工作流与代理规范

- 分支优先：非琐碎改动使用功能分支 `feat/your-topic`。
- 合并策略：使用 `--no-ff` 保留历史（在获得维护者确认后再合并）。
- 避免直接推送 `main`：除非极小的文档修正。
- 变更前后：在 PR 或说明中总结改动内容、动机与影响点，等待维护者确认再推送/合并。
- 合并后：如使用多工作树或多人协作，合并到 `main` 后请立即切回原工作分支，避免占用 `main`。
- 禁止改写已发布历史，除非得到明确许可。

## 构建与运行

- 开发：`pnpm dev`（默认 http://localhost:5173）
- 构建：`pnpm build`
- 预览：`pnpm preview`

若使用 `npm` 或 `yarn` 亦可等价替换命令。

## 后续可选项

- 引入 ESLint/Prettier 与对应脚本（`lint`/`format`）以强化质量门禁。
- 提供小型样本清单/映射表（鼓件 → 文件路径）以加速查找与懒加载。
- 状态管理（如仅在需要时引入）：全局设置（音量、套鼓选择）集中管理。

—— 保持“即点即响”的体验，优先保障音频与时序正确，其次才是视觉与装饰 ——

