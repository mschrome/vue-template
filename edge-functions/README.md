# Edge Functions - Vue SPA 路由处理

## 功能说明

这些 Edge Functions 用于支持 Vue.js 单页应用（SPA）的客户端路由，解决了直接访问非根路径（如 `/about`, `/user/123`）时的 404 问题。

## 文件结构

```
edge-functions/
├── index.js      # 处理根路径 /
├── [[id]].js     # 处理所有其他路径（catch-all）
└── README.md     # 本文档
```

## 路由逻辑

### 1. `index.js` - 根路径处理
- **匹配路径**: `/`
- **功能**: 返回 `index.html`
- **适用场景**: 用户访问网站首页

### 2. `[[id]].js` - Catch-all 路由处理（关键修复）
- **匹配路径**: 所有非根路径（如 `/about`, `/user/123` 等）
- **功能**: 
  - ✅ 对于**静态资源请求**（`.js`, `.css`, `.png` 等），**不处理**，让请求穿透到 Pages 平台
  - ✅ 对于**HTML 路由**（没有文件扩展名的路径），返回 `index.html`，由 Vue Router 接管
- **适用场景**: 支持 SPA 客户端路由

## 问题修复说明

### 之前的问题
在 SPA 单页应用下，当访问首页时：
1. Edge Function 拦截所有请求（包括 `/` 和静态资源如 `/assets/main.js`）
2. 对所有请求都返回 `index.html` 的内容
3. 导致 JS 文件的 `Content-Type` 变成 `text/html` 而不是 `application/javascript`
4. 浏览器无法正确解析 JS 文件，页面渲染失败

### 修复方案
在 `[[id]].js` 中添加了**静态资源检测逻辑**：

```javascript
// 检查是否是静态资源请求（包含文件扩展名）
const staticExtensions = [
  '.js', '.css', '.json', '.xml', '.txt',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp4', '.webm', '.mp3', '.wav',
  '.pdf', '.zip',
  '.map' // source map
];

const hasExtension = staticExtensions.some(ext => pathname.toLowerCase().endsWith(ext));

// 如果是静态资源，不处理，让请求穿透
if (hasExtension) {
  return fetch(request);
}
```

这样确保了：
- ✅ 静态资源（JS、CSS、图片等）由 EdgeOne Pages 平台处理，保持正确的 `Content-Type`
- ✅ HTML 路由（如 `/about`）返回 `index.html`，由 Vue Router 处理客户端路由
- ✅ SPA 应用正常工作

## 工作流程示例

### 场景 1: 访问首页
```
请求: https://example.com/
处理: index.js → 返回 index.html
结果: ✅ 正常显示首页
```

### 场景 2: 访问 SPA 路由
```
请求: https://example.com/about
处理: [[id]].js → 检测到没有文件扩展名 → 返回 index.html
结果: ✅ Vue Router 接管，显示 About 页面
```

### 场景 3: 加载 JS 文件
```
请求: https://example.com/assets/main.js
处理: [[id]].js → 检测到 .js 扩展名 → 穿透请求
结果: ✅ Pages 平台返回 JS 文件，Content-Type: application/javascript
```

### 场景 4: 加载 CSS 文件
```
请求: https://example.com/assets/style.css
处理: [[id]].js → 检测到 .css 扩展名 → 穿透请求
结果: ✅ Pages 平台返回 CSS 文件，Content-Type: text/css
```

## 参考文档

- [EdgeOne Pages - Edge Functions 文档](https://pages.edgeone.ai/zh/document/edge-functions)
- [EdgeOne Pages - 路由说明](https://pages.edgeone.ai/zh/document/edge-functions#路由)

## 本地测试

使用 EdgeOne CLI 进行本地测试：

```bash
# 安装 EdgeOne CLI
npm install -g edgeone

# 在项目根目录启动本地服务
edgeone pages dev
```

## 注意事项

1. **静态资源扩展名**: 如果你的项目使用了其他类型的静态资源，请在 `staticExtensions` 数组中添加对应的扩展名
2. **路由优先级**: Edge Functions 路由优先于静态资源，所以必须正确处理静态资源的穿透
3. **性能优化**: 静态资源的穿透处理确保了 Pages 平台可以正确缓存和加速这些资源
4. **调试**: 可以通过响应头 `x-edge-function` 和 `x-matched-path` 来调试路由匹配情况
