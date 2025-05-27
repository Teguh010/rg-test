"use client";

import { relogin } from "@/lib/auth";
import { setMaintenanceModeExternally } from "@/context/MaintenanceContext";

const ERROR_MESSAGES = [
  "user_lookup returned None",
  "Error loading the user",
  "Invalid header",
  "Signature has expired",
];

const handleErrorResponse = async (
  errorResponse: any,
  method: string,
  params: any,
  requestFunction: Function
) => {
  const errorMessage = errorResponse.error?.data?.message || "";

  if (ERROR_MESSAGES.some((msg) => errorMessage.includes(msg))) {
    const newToken = await relogin();
    if (newToken) {
      return requestFunction(newToken, method, params);
    } else {
      throw new Error("Relogin failed");
    }
  } else {
    throw new Error(
      `HTTP error! status: ${errorResponse.status}, message: ${errorResponse.message}`
    );
  }
};

export const apiRequest = async (
  _token: string | null,
  method: string,
  params: any,
  options = { tokenSource: "client" }
) => {
  // Get token based on tokenSource
  let latestToken = _token;
  
  if (options.tokenSource === "client") {
    const userData = JSON.parse(localStorage.getItem("userData-client") || "{}");
    latestToken = userData.token || _token;
  } else if (options.tokenSource === "manager") {
    const userData = JSON.parse(localStorage.getItem("userData-manager") || "{}");
    latestToken = userData.token || _token;
  }

  if (!latestToken) {
    return null;
  }

  const url =
    process.env.NEXT_PUBLIC_TRACEGRID_API_URL + "/tracegrid_api/client";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${latestToken}`,
  };
  const body = {
    id: "1",
    jsonrpc: "2.0",
    method: method,
    params: params,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 503) {
        setMaintenanceModeExternally(response.status, true);
        return null;
      }
      const errorResponse = await response.json();
      return handleErrorResponse(errorResponse, method, params, apiRequest);
    }

    const dataResponse = await response.json();
    setMaintenanceModeExternally(null, false);
    return dataResponse.result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const apiAuth = async (
  username: string,
  password: string,
  customer: string
) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_TRACEGRID_API_URL}/tracegrid_api/client/auth_login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
        customer: customer,
      }),
    }
  );

  if (!response.ok) {
    const errorResponse = await response.json();
    console.error("Error response:", errorResponse);
    throw new Error(
      `HTTP error! status: ${response.status}, message: ${errorResponse.message}`
    );
  }

  return await response.json();
};

export const apiRefreshToken = async () => {
  // Get token from the client storage
  const userData = JSON.parse(localStorage.getItem("userData-client") || "{}");
  const latestToken = userData.token;

  if (!latestToken) {
    return null;
  }

  const url = `${process.env.NEXT_PUBLIC_TRACEGRID_API_URL}/tracegrid_api/client/auth_refresh`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${latestToken}`,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      return handleErrorResponse(errorResponse, "", {}, apiRefreshToken);
    }

    const dataResponse = await response.json();
    return dataResponse;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const apiTachoGetRequest = async (
  token: string | null,
  params: any,
  urlString: any
) => {
  if (!token) {
    return null;
  }
  const url = new URL(urlString);

  const headers = {
    accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key])
  );

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      return handleErrorResponse(
        errorResponse,
        "",
        params,
        (newToken: string) => apiTachoGetRequest(newToken, params, urlString)
      );
    }

    const dataResponse = await response.json();
    return dataResponse;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const apiTachoGetFile = async (
  token: string | null,
  params: any,
  urlString: any
) => {
  if (!token) {
    return null;
  }
  const url = new URL(urlString);

  const headers = {
    accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key])
  );

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      return handleErrorResponse(
        errorResponse,
        "",
        params,
        (newToken: string) => apiTachoGetFile(newToken, params, urlString)
      );
    }

    const dataResponse = await response.blob();
    return dataResponse;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const apiTachoPostRequest = async (
  token: string | null,
  params: any,
  urlString: any
) => {
  if (!token) {
    return null;
  }
  const url = new URL(urlString);

  const headers = {
    accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key])
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      return handleErrorResponse(
        errorResponse,
        "",
        params,
        (newToken: string) => apiTachoPostRequest(newToken, params, urlString)
      );
    }
    const dataResponse = response;
    return dataResponse;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const apiTachoPostTokenRequest = async (username: any, password: any, urlString: any) => {
  const url = new URL(urlString);
  const headers = {
    "Content-Type": "application/json",
  };
  const body = {
    UserName: username,
    Password: password
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 503) {
        setMaintenanceModeExternally(response.status, true);
        return null;
      }
      const errorResponse = await response.json();
      return handleErrorResponse(
        errorResponse,
        "POST",
        username,
        apiTachoPostTokenRequest
      );
    }

    const dataResponse = await response.json();
    setMaintenanceModeExternally(null, false);
    return dataResponse;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
