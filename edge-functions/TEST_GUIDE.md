# Edge Functions 测试指南

## 🔍 如何验证 Edge Functions 是否正常工作

### 响应头说明

我们添加了以下自定义响应头来帮助调试：

| 响应头 | 说明 | 可能的值 |
|--------|------|---------|
| `x-edge-function` | 函数类型标识 | `root` / `catch-all` |
| `x-powered-by` | 平台标识 | `EdgeOne Pages` |
| `x-matched-path` | 匹配的路径 | 请求的路径 |
| `x-ef-handler` | 处理的函数文件 | `index.js` / `[[id]].js` |
| `x-ef-timestamp` | 函数执行时间戳 | ISO 时间格式 |
| `x-ef-route-type` | 路由类型 | `spa`（仅在 catch-all 中） |
| `x-ef-passthrough` | 是否穿透处理 | `true`（仅在静态资源中） |

---

## 📋 测试场景

### 场景 1: 访问首页 `/`

**测试命令:**
```bash
curl -I https://your-domain.com/
```

**预期响应头:**
```
HTTP/2 200
content-type: text/html
x-edge-function: root
x-powered-by: EdgeOne Pages
x-matched-path: /
x-ef-handler: index.js
x-ef-timestamp: 2024-01-20T10:30:00.000Z
```

**✅ 说明:** 由 `index.js` 处理，返回 `index.html`

---

### 场景 2: 访问 SPA 路由（如 `/about`）

**测试命令:**
```bash
curl -I https://your-domain.com/about
```

**预期响应头:**
```
HTTP/2 200
content-type: text/html
x-edge-function: catch-all
x-powered-by: EdgeOne Pages
x-matched-path: /about
x-ef-handler: [[id]].js
x-ef-timestamp: 2024-01-20T10:30:00.000Z
x-ef-route-type: spa
```

**✅ 说明:** 由 `[[id]].js` 处理，返回 `index.html`，Vue Router 接管路由

---

### 场景 3: 访问 JS 文件

**测试命令:**
```bash
curl -I https://your-domain.com/assets/main.js
# 或者
curl -I https://your-domain.com/assets/index-xxxxx.js
```

**预期响应头:**
```
HTTP/2 200
content-type: application/javascript    ← 🔥 关键！必须是这个
x-ef-passthrough: true
x-ef-handler: [[id]].js
```

**✅ 说明:** 由 `[[id]].js` 检测到是静态资源，穿透处理，保持正确的 `Content-Type`

---

### 场景 4: 访问 CSS 文件

**测试命令:**
```bash
curl -I https://your-domain.com/assets/style.css
# 或者
curl -I https://your-domain.com/assets/index-xxxxx.css
```

**预期响应头:**
```
HTTP/2 200
content-type: text/css    ← 🔥 关键！必须是这个
x-ef-passthrough: true
x-ef-handler: [[id]].js
```

**✅ 说明:** 由 `[[id]].js` 检测到是静态资源，穿透处理，保持正确的 `Content-Type`

---

### 场景 5: 访问图片文件

**测试命令:**
```bash
curl -I https://your-domain.com/favicon.ico
# 或者
curl -I https://your-domain.com/logo.png
```

**预期响应头:**
```
HTTP/2 200
content-type: image/x-icon    ← 或 image/png
x-ef-passthrough: true
x-ef-handler: [[id]].js
```

**✅ 说明:** 由 `[[id]].js` 检测到是静态资源，穿透处理

---

## 🌐 浏览器开发者工具测试

### 方法 1: Network 面板

1. 打开浏览器开发者工具（F12）
2. 切换到 **Network** 标签
3. 访问你的网站
4. 点击任意请求，查看 **Response Headers**

**检查清单:**
- [ ] HTML 请求：`content-type: text/html`，有 `x-ef-handler`
- [ ] JS 请求：`content-type: application/javascript`，有 `x-ef-passthrough: true`
- [ ] CSS 请求：`content-type: text/css`，有 `x-ef-passthrough: true`

### 方法 2: Console 测试

在浏览器控制台运行以下代码：

```javascript
// 测试首页
fetch('/', { method: 'HEAD' })
  .then(r => {
    console.log('首页响应头:');
    for (let [key, value] of r.headers.entries()) {
      if (key.startsWith('x-')) {
        console.log(`  ${key}: ${value}`);
      }
    }
  });

// 测试 SPA 路由
fetch('/about', { method: 'HEAD' })
  .then(r => {
    console.log('About 页面响应头:');
    for (let [key, value] of r.headers.entries()) {
      if (key.startsWith('x-')) {
        console.log(`  ${key}: ${value}`);
      }
    }
  });

// 测试 JS 文件
fetch('/assets/main.js', { method: 'HEAD' })
  .then(r => {
    console.log('JS 文件响应头:');
    console.log(`  content-type: ${r.headers.get('content-type')}`);
    console.log(`  x-ef-passthrough: ${r.headers.get('x-ef-passthrough')}`);
  });
```

---

## ❗ 问题排查

### 问题 1: 看不到自定义响应头

**可能原因:**
1. Edge Function 没有部署成功
2. 平台缓存导致旧版本还在运行
3. 某些响应头被平台过滤

**解决方案:**
```bash
# 检查部署状态
edgeone pages dev  # 本地测试

# 清除浏览器缓存后重试
# 或使用 curl 测试（绕过浏览器缓存）
```

### 问题 2: JS 文件的 Content-Type 仍然是 text/html

**可能原因:**
- `[[id]].js` 的静态资源检测逻辑没有生效

**排查方法:**
```bash
# 检查响应头
curl -I https://your-domain.com/assets/main.js

# 应该看到：
# x-ef-passthrough: true
```

如果没有看到 `x-ef-passthrough: true`，说明静态资源没有走穿透逻辑。

### 问题 3: x-edge-function 显示 root 而不是 catch-all

**这是正常的！**
- 访问 `/` 时，由 `index.js` 处理，所以是 `root`
- 访问 `/about` 等其他路径时，由 `[[id]].js` 处理，才是 `catch-all`

---

## 📊 完整测试脚本

将以下脚本保存为 `test-edge-functions.sh`，一键测试所有场景：

```bash
#!/bin/bash

DOMAIN="https://your-domain.com"  # 修改为你的域名

echo "🧪 测试 Edge Functions"
echo "===================="

echo ""
echo "📍 测试 1: 首页 /"
curl -sI "$DOMAIN/" | grep -E "^(content-type|x-)"

echo ""
echo "📍 测试 2: SPA 路由 /about"
curl -sI "$DOMAIN/about" | grep -E "^(content-type|x-)"

echo ""
echo "📍 测试 3: JS 文件"
curl -sI "$DOMAIN/assets/main.js" | grep -E "^(content-type|x-)"

echo ""
echo "📍 测试 4: CSS 文件"
curl -sI "$DOMAIN/assets/style.css" | grep -E "^(content-type|x-)"

echo ""
echo "📍 测试 5: Favicon"
curl -sI "$DOMAIN/favicon.ico" | grep -E "^(content-type|x-)"
```

---

## ✅ 成功标志

如果你看到以下情况，说明 Edge Functions 工作正常：

1. ✅ 首页显示 `x-ef-handler: index.js`
2. ✅ SPA 路由显示 `x-ef-handler: [[id]].js` 和 `x-ef-route-type: spa`
3. ✅ JS 文件显示 `content-type: application/javascript` 和 `x-ef-passthrough: true`
4. ✅ CSS 文件显示 `content-type: text/css` 和 `x-ef-passthrough: true`
5. ✅ 页面可以正常加载和渲染
6. ✅ Vue Router 路由切换正常

---

## 🎯 关键点总结

| 路径类型 | 处理函数 | x-edge-function | Content-Type | 特殊标识 |
|---------|---------|----------------|--------------|---------|
| `/` | index.js | root | text/html | x-ef-handler: index.js |
| `/about` | [[id]].js | catch-all | text/html | x-ef-route-type: spa |
| `*.js` | [[id]].js | ❌（可能被覆盖） | **application/javascript** | x-ef-passthrough: true |
| `*.css` | [[id]].js | ❌（可能被覆盖） | **text/css** | x-ef-passthrough: true |

**记住:** 最重要的是 `Content-Type` 必须正确！自定义头可能会被平台覆盖，但只要 Content-Type 正确，应用就能正常工作。

