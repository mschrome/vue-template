/**
 * EdgeOne Edge Function - Catch-all 路由处理（SPA 模式）
 * 处理所有非根路径（/about, /user/123 等），支持 Vue Router 的客户端路由
 * 
 * 注意：
 * - [[id]] 不会匹配根路径 /，根路径由 index.js 处理
 * - 对于静态资源（.js, .css, .png 等），不处理，让请求穿透到 Pages 平台
 * - 只有对于 HTML 路由（没有文件扩展名）才返回 index.html
 */

export async function onRequest(context) {
  const { request, params } = context;
  
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // 检查是否是静态资源请求（包含文件扩展名）
    // 常见的静态资源扩展名
    const staticExtensions = [
      '.js', '.css', '.json', '.xml', '.txt',
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
      '.woff', '.woff2', '.ttf', '.eot', '.otf',
      '.mp4', '.webm', '.mp3', '.wav',
      '.pdf', '.zip',
      '.map' // source map
    ];
    
    // 检查路径是否包含文件扩展名
    const hasExtension = staticExtensions.some(ext => pathname.toLowerCase().endsWith(ext));
    
    // 如果是静态资源，不处理，让请求穿透
    // 直接返回原始请求，不做任何修改，避免破坏压缩编码
    if (hasExtension) {
      // 直接穿透，让 EdgeOne Pages 平台处理静态资源
      // 不重新包装 Response，以保持原始的 Content-Type 和编码
      return fetch(request);
    }
    
    // 对于 HTML 路由（SPA 路由），返回 index.html
    const indexUrl = new URL('/index.html', url.origin);
    const response = await fetch(indexUrl.toString());
    
    // 使用 response.ok 来检查是否成功（status 200-299）
    if (response.ok) {
      // 创建新的 Headers 对象，避免只读问题
      const newHeaders = new Headers(response.headers);
      
      // 设置自定义头，用于调试和确认函数执行
      newHeaders.set('x-edge-function', 'catch-all');
      newHeaders.set('x-powered-by', 'EdgeOne Pages');
      newHeaders.set('x-matched-path', pathname);
      newHeaders.set('x-ef-handler', '[[id]].js'); // 明确标识处理文件
      newHeaders.set('x-ef-timestamp', new Date().toISOString()); // 添加时间戳
      newHeaders.set('x-ef-route-type', 'spa'); // 标识这是 SPA 路由
      
      // 返回首页内容
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    }
    
    // 如果 index.html 不存在或返回错误状态
    return new Response('Index file not found', { 
      status: 404,
      headers: {
        'content-type': 'text/plain',
        'x-edge-function': 'catch-all',
        'x-powered-by': 'EdgeOne Pages'
      }
    });
    
  } catch (error) {
    console.error('Error in catch-all function:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: {
        'content-type': 'text/plain',
        'x-edge-function': 'catch-all',
        'x-powered-by': 'EdgeOne Pages'
      }
    });
  }
}

