/**
 * EdgeOne Edge Function - 根路径处理
 * 只处理根路径 /，返回 Vue SPA 应用首页
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
      
      // 设置自定义头，用于调试和确认函数执行
      newHeaders.set('x-edge-function', 'root');
      newHeaders.set('x-powered-by', 'EdgeOne Pages');
      newHeaders.set('x-matched-path', url.pathname); // 添加匹配路径
      newHeaders.set('x-ef-handler', 'index.js'); // 明确标识处理文件
      newHeaders.set('x-ef-timestamp', new Date().toISOString()); // 添加时间戳
      
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

