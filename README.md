# Pi Agent

[pi 编程智能体](https://github.com/badlogic/pi-mono) 的跨端操作界面。用于浏览会话、与智能体对话、分叉对话、切换消息分支、管理模型和 Skills；既可通过本机服务访问，也可通过 Electron 打包运行，后续可继续扩展 PWA 能力。

## 快速开始

**无需安装，直接运行 CLI：**

```bash
npx @agegr/pi-agent@latest
```

**或全局安装后使用：**

```bash
npm install -g @agegr/pi-agent
pi-agent
```

启动后打开 [http://localhost:30141](http://localhost:30141)。

CLI 会在 Next.js 准备好后自动尝试打开浏览器。

**可选参数与环境变量：**

```bash
pi-agent --port 8080               # 自定义端口
pi-agent --hostname 127.0.0.1      # 仅本机访问
pi-agent -p 8080 -H 127.0.0.1     # 组合使用

PORT=8080 pi-agent                 # 也支持环境变量
```

## 功能介绍

- **会话浏览器** — 按工作目录分组展示所有 pi 会话
- **实时对话** — 通过 SSE 流式输出与智能体实时交互
- **会话分叉** — 从任意用户消息创建独立的新会话分支
- **会话内分支** — 回退到任意节点继续对话，在同一文件内创建分支
- **分支导航器** — 可视化切换同一会话内的各个分支
- **模型与鉴权** — 编辑 `models.json`，查看 OAuth/API key provider 状态，并在对话中切换模型
- **工具面板** — 控制智能体可使用的工具
- **Skills 面板** — 查看当前 cwd 可用 Skills，搜索/安装 Skills，切换 `disable-model-invocation`
- **压缩会话** — 对长会话进行摘要，节省上下文窗口
- **引导 / 追加** — 在智能体运行时 steer，或排队 follow-up
- **图片输入** — 支持粘贴、选择和拖放图片，随消息发送给智能体
- **文件浏览器** — 从侧边栏浏览当前 cwd，打开文件标签页，或将路径插入输入框
- **状态面板** — 顶栏显示 token、缓存、费用和上下文窗口占用
- **主题与声音** — 支持亮/暗主题切换和任务完成提示音
- **Apple 风格界面** — 使用本地系统字体、纸白/深墨色系、系统蓝强调色、毛玻璃顶栏和胶囊控件

## 注意事项

- **数据目录** — 默认读取 `~/.pi/agent/sessions` 下的会话文件。可通过环境变量 `PI_CODING_AGENT_DIR` 指定其他目录。
- **模型配置** — 从智能体数据目录下的 `models.json` 读取可用模型，可在侧边栏底部的「Models」面板中编辑。
- **Skills 配置** — Skills 面板使用 pi 的 `DefaultResourceLoader`，会合并 settings、包内 Skills 和项目 Skills；安装时调用 `npx skills add --agent pi`。
- **项目 Skills** — 仓库内 `.pi/skills/awesome-design-md` 提供 VoltAgent/awesome-design-md 的 DESIGN.md 使用指引，可在前端设计任务中按站点 slug 拉取设计系统参考。
- **界面视觉系统** — 全局 CSS token 采用 Apple-inspired interface chrome：亮色 `#f5f5f7` 画布、`#1d1d1f` 文本、`#0066cc` 操作蓝，暗色使用 `#2997ff` 链接/强调色。
- **会话删除** — 只删除单个 `.jsonl` 会话文件，并会把直接子会话 re-parent 到被删会话的父会话。
- **默认工作目录** — 新建默认 cwd 时会创建 `~/pi-cwd-YYYYMMDD`。

## 开发

```bash
npm install
npm run dev        # Next dev server，端口 30141，使用 webpack
npm run electron:dev # 自动重启 30141 dev server 并打开 Electron
npm run lint       # ESLint
node --test electron/runtime.test.js
node --test scripts/electron-dev.test.js
node --test scripts/node-runtime.test.js
node_modules/.bin/tsc --noEmit
```

开发期间不要运行裸 `next build`。如需生产构建或桌面包，请使用下面的 npm scripts。

## 桌面应用

```bash
npm run electron:dev       # 终止已有 30141 dev server，重新启动 npm run dev，并打开 Electron
npm run desktop:start      # 使用 production runtime 启动 Electron，需要已有构建产物
npm run desktop:pack       # 构建并生成 unpacked app
npm run desktop:dist       # 构建安装包
npm run desktop:dist:mac
npm run desktop:dist:win
npm run desktop:dist:linux
```

Electron 开发命令会自动管理开发服务器：先释放默认端口 `30141`，再启动 Next dev server，最后打开 Electron 并连接该服务器。`desktop:start` 会设置 `PI_AGENT_ELECTRON_MODE=production`，用于本地验证 standalone 输出。打包模式会运行 standalone Next server，并绑定到本机随机端口。

桌面构建不依赖 Google Fonts；界面使用本地系统字体栈，避免离线或受限网络环境下 `next/font` 拉取字体导致构建失败。

桌面打包命令会检测是否运行在 Codex.app 内置 Node 下；如果是，会自动 re-exec 到 PATH 中的其他 Node，再运行 Next build、prepare 和 electron-builder，避免 macOS native addon 的 Team ID 校验失败。

打包后的 Electron 在启动 standalone server 前会合并用户 login shell 的 `PATH` 和常见 Node/npm 路径，确保模型调用、Skills 安装等服务端流程可以找到 `npm`/`npx`/用户工具链。服务端 stdout/stderr 会写入 Electron Logs 目录下的 `server/server.log`，用于排查 packaged app 中的后端错误。

`dist/` 是桌面打包产物目录，不参与 ESLint 检查。

## 项目结构

```
app/
  api/
    sessions/      # 读写会话文件
    agent/         # 发送命令、SSE 事件流
    files/         # 文件内容读取
    models/        # 可用模型列表与默认模型
    models-config/ # 读写 models.json
    skills/        # Skills 列表、搜索、安装、前置开关
    auth/          # OAuth 和 API key provider 状态/登录/登出
    default-cwd/   # 创建 ~/pi-cwd-YYYYMMDD
    home/          # 返回用户 home 目录
components/        # UI 组件
hooks/             # agent 请求、音频、拖放、主题等 hooks
.pi/
  skills/awesome-design-md/ # VoltAgent/awesome-design-md DESIGN.md project skill
lib/
  session-reader.ts  # SessionManager-backed 会话列表、上下文构建和路径缓存
  rpc-manager.ts     # 管理 AgentSession 生命周期
  normalize.ts       # 规范化 toolCall 字段名
  file-paths.ts      # 跨平台路径展示和 API 编码
  npx.ts             # shell-free npx 调用封装
  types.ts / pi-types.ts
bin/
  pi-agent.js          # npm CLI 入口
scripts/
  dev.js             # 开发服务器启动脚本
  electron-dev.js    # 自动重启 dev server 并启动 Electron
  desktop-pack.js    # 自动跳出 Codex Node 后运行桌面打包链
  node-runtime.js    # Node runtime 检测与 re-exec helper
  prepare-desktop.js # Electron 打包前准备
  start-desktop.js   # production runtime 启动 Electron
electron/
  main.js            # Electron 主进程
  runtime.js         # dev/packaged runtime 路径判断
```

会话文件存储路径：`~/.pi/agent/sessions/<编码后的工作目录>/<时间戳>_<uuid>.jsonl`

## 维护约束

- 功能、路由、脚本、打包流程或用户可见行为变更时，请同步更新 `AGENTS.md` 和本 README 的相关段落。
- 禁止批量删除文件或目录；需要删除时只允许针对单个明确文件路径操作。
- 不要回退无关的本地改动。
