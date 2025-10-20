/**
 * EdgeOne Edge Function - 根路径处理
 * 只处理根路径 /，返回 Hugo 静态站点首页
 * 
 * 其他路径由 [[id]].js 处理
 */

export async function onRequest(context) {
  const { request } = context;
  
  try {
    const url = new URL(request.url);
    
    // 构建 index.html 的完整 URL
    const indexUrl = new URL('/index.html', url.origin);
    const response = await fetch(indexUrl.toString());
    
    // 使用 response.ok 来检查是否成功（status 200-299）
    if (response.ok) {
      // 创建新的 Headers 对象，避免只读问题
      const newHeaders = new Headers(response.headers);
      newHeaders.set('x-edge-function', 'root');
      newHeaders.set('x-powered-by', 'EdgeOne Pages');
      
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
        'x-edge-function': 'root',
        'x-powered-by': 'EdgeOne Pages'
      }
    });
    
  } catch (error) {
    console.error('Error in root function:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: {
        'content-type': 'text/plain',
        'x-edge-function': 'root',
        'x-powered-by': 'EdgeOne Pages'
      }
    });
  }
}

