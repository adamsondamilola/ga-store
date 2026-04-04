
const getToken = () => {
  try {
    let tok = localStorage.getItem('token');
    if (tok) {
      return tok; // Return token directly if found
    }
  } catch (e) {
    console.log('Error retrieving token:', e);
  }
  return null; // Return null if token not found or error
};

const createHeaders = (bearer) => {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (bearer) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
  }

  return headers;
};

const createHeadersFormData = (bearer) => {
  const headers = {

  };

  if (bearer) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
  }
  headers['Accept'] = 'application/json';

  return headers;
};

const getBaseUrl = () => {
  let baseUrl = process.env.NEXT_PUBLIC_API_URL_DEV;
  if (process.env.NODE_ENV !== "development") {
    baseUrl = process.env.NEXT_PUBLIC_API_URL;
  }
  return baseUrl;
};

const getLocalHttpFallbackUrl = (baseUrl) => {
  if (!baseUrl || process.env.NODE_ENV !== "development") {
    return null;
  }

  if (baseUrl.startsWith("https://localhost:7059")) {
    return baseUrl.replace("https://localhost:7059", "http://localhost:5036");
  }

  return null;
};

/*
const fetchData = async (url, options) => {
  try {
    let baseUrl = process.env.NEXT_PUBLIC_API_URL_DEV;
    if (process.env.NODE_ENV !== "development") {
      baseUrl = process.env.NEXT_PUBLIC_API_URL;
    }
    const endpoint = baseUrl + url;
    const response = await fetch(endpoint, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { 
      statusCode: response.status,
      result: data // Directly return parsed data
    };
  } catch (error) {
    console.error('Fetch error:', error);
    return { 
      result: null, 
      statusCode: 500,
      error: error.message 
    };
  }
};
*/
 const fetchData = async (url, options) => {
  const baseUrl = getBaseUrl();

  try {
    const response = await fetch(baseUrl + url, options);
    const rawText = await response.text();
    let result = null;

    if (rawText) {
      try {
        result = JSON.parse(rawText);
      } catch (parseError) {
        console.log('Response parse error:', parseError, rawText);
        result = {
          message: rawText,
        };
      }
    }

    const normalizedStatusCode =
      result?.statusCode ??
      result?.status ??
      response.status;

    return {
      result,
      statusCode: normalizedStatusCode,
      httpStatusCode: response.status,
      success: response.ok && normalizedStatusCode < 300,
    };
  } catch (error) {
    const fallbackBaseUrl = getLocalHttpFallbackUrl(baseUrl);

    if (fallbackBaseUrl) {
      try {
        const fallbackResponse = await fetch(fallbackBaseUrl + url, options);
        const fallbackRawText = await fallbackResponse.text();
        let fallbackResult = null;

        if (fallbackRawText) {
          try {
            fallbackResult = JSON.parse(fallbackRawText);
          } catch (parseError) {
            console.log('Fallback response parse error:', parseError, fallbackRawText);
            fallbackResult = {
              message: fallbackRawText,
            };
          }
        }

        const normalizedStatusCode =
          fallbackResult?.statusCode ??
          fallbackResult?.status ??
          fallbackResponse.status;

        return {
          result: fallbackResult,
          statusCode: normalizedStatusCode,
          httpStatusCode: fallbackResponse.status,
          success: fallbackResponse.ok && normalizedStatusCode < 300,
        };
      } catch (fallbackError) {
        console.log('Fallback fetch error:', fallbackError);
      }
    }

    console.log('Fetch error:', error);
    return {
      result: {
        message: error?.message || 'Request failed',
      },
      statusCode: 500,
      httpStatusCode: 500,
      success: false,
    };
  }
}; 

// For Server Components - Token-less version
const getServerSide = async (url) => {
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    cache: 'no-store' // For dynamic data
  };
  
  return fetchData(url, options);
};

const get = async (url, bearer = false) => {
  const options = {
    method: 'GET',
    headers: createHeaders(bearer),
  };
  
  return fetchData(url, options);
};

const post = async (url, form, bearer = false) => {
  const options = {
    method: 'POST',
    headers: createHeaders(bearer),
    body: JSON.stringify(form),
  };

  const { result, statusCode } = await fetchData(url, options);  
  return { result, statusCode };
};

const postForm = async (url, form, bearer = false) => {
  const options = {
    method: 'POST',
    headers: createHeadersFormData(bearer),
    body: form,
  };

  const { result, statusCode } = await fetchData(url, options);
  
  return { result, statusCode };
};


const patch = async (url, form, bearer = false) => {
  const options = {
    method: 'PATCH',
    headers: createHeaders(bearer),
    body: JSON.stringify(form),
  };

  const { result, statusCode } = await fetchData(url, options);
  
  return { result, statusCode };
};

const put = async (url, form, bearer = false) => {
  const options = {
    method: 'PUT',
    headers: createHeaders(bearer),
    body: JSON.stringify(form),
  };

  const { result, statusCode } = await fetchData(url, options);
  
  return { result, statusCode };
};

const putForm = async (url, form, bearer = false) => {
  const options = {
    method: 'PUT',
    headers: createHeadersFormData(bearer),
    body: form,
  };

  const { result, statusCode } = await fetchData(url, options);
  
  return { result, statusCode };
};

const deleteReq = async (url, bearer = false) => {
  const options = {
    method: 'DELETE',
    headers: createHeaders(bearer)
  };

  const { result, statusCode } = await fetchData(url, options);
  return { result, statusCode };
};

export default { getServerSide, get, post, postForm, patch, put, putForm, deleteReq, getToken };
