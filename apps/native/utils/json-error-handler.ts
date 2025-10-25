/**
 * JSON Error Handler
 * JSON 파싱 오류 처리 유틸리티
 */

export interface JSONParseError {
  type: 'html_response' | 'json_parse_error' | 'connection_error' | 'unknown_response';
  message: string;
  data?: string;
  statusCode?: number;
}

/**
 * JSON 파싱 오류를 진단합니다
 */
export function diagnoseJSONParseError(error: any, response?: any): JSONParseError {
  if (!error && !response) {
    return {
      type: 'unknown_response',
      message: '알 수 없는 오류가 발생했습니다'
    };
  }

  // HTML 응답 감지
  if (response?.data && typeof response.data === 'string' && response.data.startsWith('<')) {
    return {
      type: 'html_response',
      message: '서버가 HTML을 반환하고 있습니다. API 서버가 정상적으로 실행되고 있는지 확인하세요.',
      data: response.data.substring(0, 200),
      statusCode: response.statusCode
    };
  }

  // JSON 파싱 오류
  if (error?.message?.includes('JSON') || error?.message?.includes('parse')) {
    return {
      type: 'json_parse_error',
      message: `JSON 파싱 오류: ${error.message}`,
      data: response?.data
    };
  }

  // 연결 오류
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return {
      type: 'connection_error',
      message: `연결 오류: ${error.message}`
    };
  }

  // 기타 오류
  return {
    type: 'unknown_response',
    message: error?.message || '알 수 없는 오류가 발생했습니다',
    data: response?.data
  };
}

/**
 * JSON 파싱 오류에 대한 사용자 친화적 메시지를 반환합니다
 */
export function getJSONParseErrorMessage(error: JSONParseError): string {
  switch (error.type) {
    case 'html_response':
      return '서버가 HTML을 반환하고 있습니다. API 서버를 확인해주세요.';
    
    case 'json_parse_error':
      return '데이터 형식이 올바르지 않습니다. 서버 상태를 확인해주세요.';
    
    case 'connection_error':
      return '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
    
    case 'unknown_response':
      return '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    
    default:
      return '데이터를 불러오는 중 오류가 발생했습니다.';
  }
}

/**
 * JSON 파싱 오류에 대한 해결 방법을 반환합니다
 */
export function getJSONParseErrorSolution(error: JSONParseError): string {
  switch (error.type) {
    case 'html_response':
      return 'API 서버를 시작하세요: cd packages/api && npm run dev';
    
    case 'json_parse_error':
      return '서버 로그를 확인하고 JSON 형식을 수정하세요';
    
    case 'connection_error':
      return '네트워크 연결과 서버 URL을 확인하세요';
    
    case 'unknown_response':
      return '앱을 재시작하고 다시 시도하세요';
    
    default:
      return '문제가 지속되면 개발자에게 문의하세요';
  }
}

/**
 * JSON 파싱 오류를 로깅합니다
 */
export function logJSONParseError(error: JSONParseError, context?: string): void {
  console.error('🔴 JSON 파싱 오류 발생:', {
    type: error.type,
    message: error.message,
    context: context || '알 수 없음',
    timestamp: new Date().toISOString(),
    data: error.data?.substring(0, 100) + (error.data?.length > 100 ? '...' : '')
  });
}

/**
 * JSON 파싱 오류를 사용자에게 표시하기 위한 정보를 반환합니다
 */
export function getJSONParseErrorDisplayInfo(error: JSONParseError) {
  return {
    title: '데이터 로딩 오류',
    message: getJSONParseErrorMessage(error),
    solution: getJSONParseErrorSolution(error),
    type: error.type,
    canRetry: error.type === 'connection_error' || error.type === 'unknown_response',
    needsServerRestart: error.type === 'html_response'
  };
}

