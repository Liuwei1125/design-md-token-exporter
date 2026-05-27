# Design.md Token Exporter

<p align="center">
  <a href="README.md">English</a>
  ·
  <a href="README.zh-CN.md"><strong>简体中文</strong></a>
</p>

<p align="center">
  <img alt="版本 0.1.0" src="https://img.shields.io/badge/version-0.1.0-dc2626?style=for-the-badge">
  <img alt="测试通过" src="https://img.shields.io/badge/tests-passing-22c55e?style=for-the-badge">
  <img alt="MIT 许可证" src="https://img.shields.io/badge/license-MIT-0ea5e9?style=for-the-badge">
  <img alt="Manifest V3" src="https://img.shields.io/badge/manifest-MV3-475569?style=for-the-badge">
</p>

一个本地优先的 Chrome 扩展：从当前网页提取设计 token，并导出适合 AI 编程和前端实现使用的设计物料。

Design.md Token Exporter 只会在用户明确点击分析后读取当前标签页。分析结果保存在浏览器本地，可导出 `DESIGN.md`、CSS Variables、Tailwind Config 片段和 `tokens.json`。

## 功能

- 用户手动触发当前页面分析。
- Side Panel 工作区，用于查看提取结果。
- 本地规则提取颜色、字体、间距、圆角、阴影和基础组件样式。
- 可选的 token 修正能力，修正结果保存在本地。
- 支持导出：
  - `DESIGN.md`
  - CSS Variables
  - Tailwind Config
  - `tokens.json`
- Manifest V3。
- 最小权限。
- MVP 不包含 AI 调用。
- 默认不发起网络请求。

## 隐私与权限

MVP 是本地优先设计：

- 不收集浏览历史。
- 不上传页面 HTML、CSS、DOM、截图、浏览历史或提取出的设计数据。
- 不调用 AI 或模型 API。
- 不申请 `<all_urls>`。
- 不申请 `webRequest`、`cookies`、`history`、`downloads` 或宽泛的 `tabs` 权限。

当前请求的 Chrome 权限：

- `activeTab`：用户点击分析后，临时访问当前标签页。
- `scripting`：在用户触发后注入已打包的本地分析脚本。
- `storage`：保存最近一次本地分析结果、用户修正和工作区偏好。
- `sidePanel`：提供主要的查看、修正和导出工作区。

隐私声明草稿见 [docs/publish/privacy-statement.md](docs/publish/privacy-statement.md)。

## 本地开发

依赖：

- 与当前 WXT/Vite 工具链兼容的 Node.js。
- pnpm。

安装依赖：

```bash
pnpm install
```

启动 WXT 开发服务：

```bash
pnpm dev
```

运行检查：

```bash
pnpm typecheck
pnpm test
pnpm build
```

## 发布包

运行完整发布检查：

```bash
pnpm release:check
```

生成 Chrome MV3 上传 zip：

```bash
pnpm release:zip
```

zip 输出位置：

```txt
.output/design-md-token-exporter-0.1.0-chrome-mv3.zip
```

上传 Chrome Web Store 前，确认 zip 根目录直接包含 `manifest.json`：

```bash
unzip -l .output/design-md-token-exporter-0.1.0-chrome-mv3.zip | head
```

## Chrome Web Store 状态

Chrome Web Store 上架材料正在 [docs/publish](docs/publish) 下准备。

## 仓库说明

`references/old-prototype` 是旧原型参考目录。旧原型源码默认不进入公开仓库，除非后续明确完成授权、隐私和 license 审查。

## 许可证

MIT
