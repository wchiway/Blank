# Blank

<h3 align="center">Another <a href="https://github.com/MetaCubeX/mihomo">Mihomo</a> GUI</h3>

<p align="center">
  <a href="https://github.com/xishang0128/sparkle/releases">
    <img src="https://img.shields.io/github/release/xishang0128/sparkle/all.svg" alt="Release">
  </a>
  <a href="https://t.me/+y7rcYjEKIiI1NzZl">
    <img src="https://img.shields.io/badge/Telegram-Group-blue?logo=telegram" alt="Telegram Group">
  </a>
</p>

## 简介

Blank 是一款基于 Electron、React 和 TypeScript 构建的 Mihomo 桌面 GUI，目标是提供开箱即用的代理控制、订阅管理、覆写编辑、备份恢复和桌面集成体验。

项目主要面向自用场景维护，绝大部分 Pull Request 可能不会合并；如果你需要定制功能，建议 Fork 后自行修改。

## 功能特性

- **Mihomo 内核管理**：支持内置稳定版、内置预览版，也可以使用系统中的 Mihomo/Clash 内核。
- **代理控制面板**：管理代理组、规则、连接、日志、资源和运行状态。
- **常用配置界面化**：支持系统代理、TUN、DNS、Sniffer、端口、控制器、环境变量和日志等配置。
- **覆写能力**：通过覆写文件和脚本灵活修订最终运行配置。
- **订阅管理**：支持多 Profile 管理，并深度集成 Sub-Store。
- **备份与恢复**：支持 WebDAV 和 S3 备份，可用于配置迁移与恢复。
- **桌面体验**：支持托盘菜单、悬浮窗、主题配置、快捷键、开机自启和轻量模式。
- **多平台打包**：支持 Windows、macOS 和 Linux 构建产物。

## 下载安装

前往 [Releases](https://github.com/xishang0128/sparkle/releases) 下载对应平台的安装包或便携包。

## 开发环境

### 环境要求

- **Node.js**：`>= 20.0.0`
- **pnpm**：`>= 9.0.0`，项目声明的包管理器版本为 `pnpm@11.1.1`
- **Git**：建议使用最新稳定版

### 技术栈

| 方向 | 技术 |
| --- | --- |
| 桌面框架 | Electron |
| 前端框架 | React 19 |
| 开发语言 | TypeScript |
| 构建工具 | electron-vite、Vite |
| UI 与样式 | HeroUI / NextUI、Tailwind CSS |
| 编辑器能力 | Monaco Editor、monaco-yaml |
| 数据请求与状态 | axios、SWR |
| 打包发布 | electron-builder |

### 快速开始

```bash
git clone https://github.com/xishang0128/sparkle.git
cd sparkle
pnpm install
pnpm dev
```

`pnpm dev` 会先执行 `pnpm run ensure:electron`，再启动 `electron-vite dev`。

### Electron 安装异常处理

如果 `pnpm dev` 或构建命令提示 Electron 未正确安装，可以手动执行：

```bash
pnpm run ensure:electron
```

### Windows 开发注意事项

Windows 开发时如果出现窗口白屏，可先关闭 TUN / 虚拟网卡模式后重试。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发环境 |
| `pnpm typecheck` | 检查主进程、预加载脚本和渲染进程类型 |
| `pnpm typecheck:node` | 检查 Electron 主进程、预加载脚本和脚本代码 |
| `pnpm typecheck:web` | 检查渲染进程代码 |
| `pnpm lint` | 运行 ESLint 并自动修复 |
| `pnpm format` | 使用 Prettier 格式化项目 |
| `pnpm run ensure:electron` | 确保 Electron 依赖安装完成 |
| `pnpm postinstall` | 安装 Electron 与原生应用依赖 |

## 构建发布

### 基础构建

```bash
pnpm build:win
pnpm build:mac
pnpm build:linux
```

### 指定架构

```bash
pnpm build:win --x64
pnpm build:mac --arm64
pnpm build:linux --x64
```

### 指定产物类型

```bash
pnpm build:win 7z
pnpm build:win nsis
pnpm build:mac pkg
pnpm build:linux deb
pnpm build:linux rpm
pnpm build:linux pacman
```

### 同时指定产物类型和架构

```bash
pnpm build:win 7z --x64
pnpm build:mac pkg --arm64
pnpm build:linux deb --x64
```

### 构建产物

- **Windows**：NSIS 安装包、`7z` 便携包
- **macOS**：`pkg` 安装包
- **Linux**：`deb`、`rpm`、`pkg.tar.zst` 等包格式

## 项目结构

```text
sparkle/
├── build/                    # 安装器与平台脚本
├── extra/                    # 打包附加资源
├── resources/                # 应用图标等资源
├── scripts/                  # 安装、更新、校验和发布辅助脚本
├── src/
│   ├── main/                 # Electron 主进程
│   │   ├── config/           # YAML 配置读写
│   │   ├── core/             # Mihomo 配置生成与生命周期管理
│   │   ├── resolve/          # 托盘、菜单、备份、更新、窗口等桌面能力
│   │   ├── service/          # 服务模式管理与通信
│   │   ├── sys/              # 系统代理、自启、网络接口等系统集成
│   │   └── utils/            # IPC、路径、初始化、日志等工具
│   ├── preload/              # Electron 预加载脚本与类型声明
│   ├── renderer/             # React 渲染进程
│   │   ├── index.html        # 主窗口入口
│   │   ├── floating.html     # 悬浮窗入口
│   │   ├── traymenu.html     # 自定义托盘菜单入口
│   │   └── src/
│   │       ├── components/   # 复用组件
│   │       ├── hooks/        # React Hooks
│   │       ├── pages/        # 页面组件
│   │       ├── routes/       # 路由配置
│   │       └── utils/        # 渲染进程工具与 IPC 包装
│   └── shared/               # 共享类型定义
├── electron-builder.yml      # 打包配置
├── electron.vite.config.ts   # Electron/Vite 构建配置
├── package.json              # 脚本与依赖声明
└── README.md
```

## 开发约定

- 使用 `pnpm` 执行所有脚本。
- 修改主进程或预加载脚本后，需要重启应用。
- 渲染进程支持热更新。
- 新增 IPC 能力时，需要同时更新主进程处理器、渲染进程封装和相关类型。
- 提交前建议运行 `pnpm typecheck`、`pnpm lint` 和 `pnpm format`。
- 当前项目未配置测试脚本，验证时请优先使用类型检查、Lint 和实际运行。

## 贡献说明

1. Fork 本仓库。
2. 创建功能分支：`git checkout -b feature/your-feature`。
3. 修改代码并完成本地验证。
4. 提交更改：`git commit -m "feat: add your feature"`。
5. 推送分支：`git push origin feature/your-feature`。
6. 创建 Pull Request。

请注意：本项目以自用需求为主，PR 不保证会被合并。

## Star History

<a href="https://www.star-history.com/#xishang0128/sparkle&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=xishang0128/sparkle&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=xishang0128/sparkle&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=xishang0128/sparkle&type=Date" />
 </picture>
</a>
