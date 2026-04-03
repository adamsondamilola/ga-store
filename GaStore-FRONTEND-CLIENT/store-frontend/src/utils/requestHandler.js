
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
  try {
    let baseUrl = process.env.NEXT_PUBLIC_API_URL_DEV;
    if (process.env.NODE_ENV !== "development") {
      baseUrl = process.env.NEXT_PUBLIC_API_URL;
    }
    const response = await fetch(baseUrl + url, options);
    const result = await response.json();
    const statusCode = response.status < 300? 200 : response.status;
    const success = response.status < 300? true : false;

    //console.log('Success:', result);

    return { result, statusCode, success };
  } catch (error) {
    //toast.error(Strings.internalServerError)
    console.log('Fetch error:', error);
    return { result: null, statusCode: 500, success: false }; // Return a standard error response
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