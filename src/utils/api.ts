// Dynamic base URL resolver for the Coaching ERP.
// If running in Android APK (file:// or capacitor://) or non-web preview context,
// it automatically defaults to the production backend Shared App URL.
const PRODUCTION_BACKEND_URL = "https://ais-pre-f6s3xaznpyw3xxtf5kr4cs-104278218649.asia-east1.run.app";

export const getApiBaseUrl = (): string => {
  const origin = window.location.origin;
  
  // Use the current origin if running in a real browser context inside AI Studio run.app container
  if (origin && origin.startsWith("http") && origin.includes("run.app")) {
    return origin;
  }
  
  // Otherwise, default to the official Cloud Run Production URL for absolute stability inside the APK
  return PRODUCTION_BACKEND_URL;
};

interface FetchOptions extends RequestInit {
  timeout?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

/**
 * Super robust client fetch wrapper that ensures absolute API safety:
 * 1. Validates response.ok, response.status, and content-type before parsing.
 * 2. If HTML is returned, reads text instead of crashing on .json(), logging the first 500 chars for debugging.
 * 3. Supports configurable timeout limits to prevent indefinite hangs.
 * 4. Gracefully intercepts errors and returns structured JSON { success, message, data }.
 */
export async function safeFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { timeout = 15000, ...fetchOptions } = options;
  
  // 1. Resolve full URL
  let url = endpoint;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    const baseUrl = getApiBaseUrl();
    url = `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
  }

  // 2. Setup AbortController for Timeout management
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  fetchOptions.signal = controller.signal;

  try {
    console.log(`[API Dispatch] ${options.method || 'GET'} -> ${url}`);
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || "";
    
    // 3. Handle HTML returned instead of JSON
    if (contentType.includes("text/html")) {
      const htmlText = await response.text();
      const status = response.status;
      
      console.error(`[API Error] Expected JSON but received HTML from: ${url}`);
      console.error(`[API Error] HTTP Status: ${status}`);
      console.error(`[API Error] HTML Snippet (first 500 chars):\n${htmlText.slice(0, 500)}`);
      
      return {
        success: false,
        message: "Server returned HTML instead of JSON.",
        error: "Server returned HTML instead of JSON.",
        data: {} as T
      };
    }

    // 4. Validate Content-Type
    if (!contentType.includes("application/json")) {
      const rawText = await response.text();
      const status = response.status;
      
      console.error(`[API Error] Unexpected Content-Type "${contentType}" from: ${url}`);
      console.error(`[API Error] HTTP Status: ${status}`);
      console.error(`[API Error] Raw Body Snippet (first 500 chars):\n${rawText.slice(0, 500)}`);
      
      return {
        success: false,
        message: `Unexpected response format from server (${status}).`,
        error: `Unexpected Content-Type: ${contentType}`,
        data: {} as T
      };
    }

    // 5. Safe JSON parsing to prevent crashing
    let json: any;
    try {
      json = await response.json();
    } catch (parseError: any) {
      console.error(`[API Error] JSON Parsing failed for endpoint: ${url}`);
      console.error(`[API Error] HTTP Status: ${response.status}`);
      console.error(`[API Error] Exception Details:`, parseError);
      
      return {
        success: false,
        message: "Failed to parse server response.",
        error: parseError.message || String(parseError),
        data: {} as T
      };
    }

    // 6. Check for non-OK HTTP status codes (e.g. 400, 401, 500)
    if (!response.ok) {
      console.error(`[API Error] Server returned HTTP ${response.status} from: ${url}`);
      console.error(`[API Error] Error Payload:`, json);
      
      return {
        success: json.success ?? false,
        message: json.message || json.error || `HTTP Error ${response.status}`,
        error: json.error || `HTTP Error ${response.status}`,
        data: json.data || {}
      };
    }

    // 7. Successful standardized API response
    return {
      success: json.success ?? true,
      message: json.message || "Request completed successfully.",
      data: json.data !== undefined ? json.data : json
    };

  } catch (err: any) {
    clearTimeout(timeoutId);
    
    // Log exact failing endpoint
    console.error(`[API Exception] Network or client request failed for: ${url}`, err);

    if (err.name === "AbortError") {
      return {
        success: false,
        message: "Request timed out. Please check your connection and try again.",
        error: "TIMEOUT_ERROR",
        data: {} as T
      };
    }

    return {
      success: false,
      message: err.message || "A network error occurred. Please check your internet connection.",
      error: err.message || String(err),
      data: {} as T
    };
  }
}
