// Mock for next/server
module.exports = {
  Request: class MockRequest {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.headers = new Map(Object.entries(options.headers || {}));
    }
  },
  Response: class MockResponse {
    constructor(body, options = {}) {
      this.body = body;
      this.status = options.status || 200;
      this.headers = new Map(Object.entries(options.headers || {}));
    }
    
    static json(data, options = {}) {
      return new MockResponse(JSON.stringify(data), {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers }
      });
    }
  },
};