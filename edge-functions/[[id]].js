/**
 * EdgeOne Edge Function - Catch-all 路由处理
 * 处理所有非根路径（/aaa, /bbb 等），返回 Hugo 静态站点首页
 * 
 * 注意：[[id]] 不会匹配根路径 /，根路径由 index.js 处理
 */

export async function onRequest(context) {
  const { request, params } = context;
  
  try {
    const url = new URL(request.url);
    
    // 构建 index.html 的完整 URL
    const indexUrl = new URL('/index.html', url.origin);
    const response = await fetch(indexUrl.toString());
    
    // 使用 response.ok 来检查是否成功（status 200-299）
    if (response.ok) {
      // 创建新的 Headers 对象，避免只读问题
      const newHeaders = new Headers(response.headers);
      newHeaders.set('x-edge-function', 'catch-all');
      newHeaders.set('x-powered-by', 'EdgeOne Pages');
      newHeaders.set('x-matched-path', url.pathname);
      
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

