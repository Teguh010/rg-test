'use client';

interface RequestBody {
  jsonrpc: string;
  method: string;
  id: string;
  params?: any;
}

export const apiManagerRequest = async (_token: string | null, method: string, params?: any) => {
  // Get token from the manager storage
  const userData = JSON.parse(localStorage.getItem("userData-manager") || "{}");
  const latestToken = userData.token || _token;

  if (!latestToken) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_TRACEGRID_API_URL + '/tracegrid_api/manager';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${latestToken}`
  };

  const methodsWithCustomParams = {
    'session.select_customer': (params: any) => ({ customer_id: params.id }),
  };

  const body: RequestBody = {
    jsonrpc: '2.0',
    method: method,
    id: '1'
  };

  if (methodsWithCustomParams[method]) {
    body.params = methodsWithCustomParams[method](params);
  } 
  else if (params) {
    body.params = params;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

export const apiManagerAuth = async (username: string, password: string, manager: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_TRACEGRID_API_URL}/tracegrid_api/manager/auth_login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password,
        manager: manager
      })
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(
      `HTTP error! status: ${response.status}, message: ${errorResponse.message}`
    );
  }

  return await response.json();
};

// Add new refresh token function for manager
export const apiManagerRefreshToken = async () => {
  // Get token from the manager storage
  const userData = JSON.parse(localStorage.getItem("userData-manager") || "{}");
  const { token, username, password, manager } = userData;

  if (!token) {
    throw new Error('No token available for refresh');
  }

  const url = `${process.env.NEXT_PUBLIC_TRACEGRID_API_URL}/tracegrid_api/manager/auth_refresh`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers
    });

    const dataResponse = await response.json();

    if (!response.ok) {
      // If token has expired, try silent re-login
      if (dataResponse.error?.message === 'Token has expired') {
        if (!username || !password || !manager) {
          throw new Error('Incomplete credentials for re-login');
        }

        const loginResponse = await apiManagerAuth(username, password, manager);
        
        if (loginResponse?.access_token) {
          // Update localStorage with new token
          const updatedUserData = {
            ...userData,
            token: loginResponse.access_token
          };
          localStorage.setItem('userData-manager', JSON.stringify(updatedUserData));
          
          return loginResponse;
        }
        throw new Error('Re-login failed');
      }
      throw new Error(dataResponse.error?.message || 'Refresh token failed');
    }

    // Update localStorage with new token
    const updatedUserData = {
      ...userData,
      token: dataResponse.access_token
    };
    localStorage.setItem('userData-manager', JSON.stringify(updatedUserData));

    return dataResponse;
  } catch (error) {
    console.error('Manager Refresh Token Error:', error);
    // Clear userData if refresh completely fails
    if (error.message === 'Re-login failed' || error.message === 'Incomplete credentials for re-login') {
      localStorage.removeItem('userData-manager');
    }
    throw error;
  }
};
