# Edge Functions 架构说明

## 📁 文件结构

```
edge-functions/
└── [id].js    # 动态路由处理器（只处理 /:id）
```

## 🎯 EdgeOne Pages 路由机制

### 关键概念

EdgeOne Pages 使用**基于文件的路由系统**：

| 文件路径 | 匹配的 URL | 说明 |
|---------|-----------|------|
| `edge-functions/index.js` | `/` | 根路径 |
| `edge-functions/[id].js` | `/:id` | 动态 ID（如 `/123`, `/abc`） |
| `edge-functions/api/[name].js` | `/api/:name` | API 路由 |
| 无匹配的函数 | 任何路径 | 由前端应用处理 |

**本项目只有 `[id].js`**，因此：
- ✅ `/:id` 路径由 Edge Function 处理（返回 JSON API）
- ✅ `/` 路径由 React 应用处理（返回 HTML 首页）
- ✅ EdgeOne Pages 自动识别和分发路由

### 为什么不需要 index.js？

如果你的需求是：
- **根路径 `/` 显示 React 应用** → 不需要 `index.js`，EdgeOne Pages 自动处理
- **API 路径 `/:id` 返回数据** → 只需要 `[id].js`

如果你想在 Edge Function 中处理根路径（比如做一些特殊逻辑），才需要创建 `index.js`。

## 🔧 工作原理

### 路由处理流程

```
用户请求 EdgeOne Pages
       |
       ├─ 请求 /
       │   ├─ 检查是否有 edge-functions/index.js → 无
       │   └─ 返回静态资源（React 应用的 index.html）
       │
       └─ 请求 /123
           ├─ 检查是否有匹配的 Edge Function → 是（[id].js）
           ├─ params.id = "123"
           └─ 执行 Edge Function 返回 JSON
```

### 本地开发 vs 生产环境

**本地开发** (`edgeone pages dev`):
```
EdgeOne Pages Dev Server (8088)
  ├─ Edge Functions 处理器
  │   └─ [id].js → 处理 /:id
  │
  └─ 静态文件服务
      └─ build/ 目录 → 处理 / 和其他静态路径
```

**生产环境**:
```
EdgeOne 全球边缘网络
  ├─ Edge Functions (边缘节点)
  │   └─ [id].js → 超低延迟 API 响应
  │
  └─ 静态资源 CDN
      └─ React 应用 → 全球加速分发
```

## 📝 使用示例

### 1. 访问首页（React 应用）
```bash
# 开发环境
curl http://localhost:8088/
# 返回: React 应用的 HTML（由 build/index.html 提供）
# 不经过 Edge Function

# 或直接访问 React 开发服务器
curl http://localhost:3000/
# 返回: 相同的 HTML
```

### 2. API 调用（Edge Function）
```bash
# GET 请求
curl http://localhost:8787/user123

# POST 请求
curl -X POST http://localhost:8787/order456 \
  -H "Content-Type: application/json" \
  -d '{"item": "产品A", "quantity": 2}'

# DELETE 请求
curl -X DELETE http://localhost:8787/cart789
```

## 🚀 扩展建议

### 添加更多路由

可以创建更具体的路由文件：

```
edge-functions/
├── [id].js              # 根路径和通用动态路由
├── api/
│   ├── users/[id].js    # /api/users/:id
│   └── products/[id].js # /api/products/:id
└── admin/
    └── [action].js      # /admin/:action
```

### 添加中间件逻辑

在 `[id].js` 中可以添加：
- ✅ 身份验证
- ✅ 速率限制
- ✅ 请求日志
- ✅ 地理位置检测
- ✅ A/B 测试

示例：
```javascript
export async function onRequest(context) {
  // 中间件：日志记录
  console.log(`[${new Date().toISOString()}] ${context.request.method} ${context.request.url}`);
  
  // 中间件：身份验证
  const token = context.request.headers.get('authorization');
  if (!token && needsAuth(context.request.url)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // 原有路由逻辑...
}
```

## 📚 参考文档

- [EdgeOne Pages 官方文档](https://pages.edgeone.ai/document/product-introduction)
- [完整使用指南](../EDGE_FUNCTIONS_README.md)

