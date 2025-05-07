"use client";
import { apiManagerRequest } from "./common";

export interface SessionResponse {
  success: boolean;
  message?: string;
}

/**
 * Select a customer for the current session
 * @param token Manager authentication token
 * @param customerId Customer ID to select (use 0 to deselect)
 * @returns Promise<boolean> indicating success
 */
export const selectCustomer = async (
  token: string | null, 
  customerId: number
): Promise<SessionResponse> => {
  try {
    const result = await apiManagerRequest(
      token, 
      "session.select_customer", 
      { id: customerId }
    );
    
    const success = JSON.parse(result);
    
    return {
      success: Boolean(success),
      message: success ? 
        `Customer ${customerId} selected successfully` : 
        `Failed to select customer ${customerId}`
    };
  } catch (error) {
    console.error('Error selecting customer:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to select customer'
    };
  }
};

/**
 * Deselect the current customer
 * @param token Manager authentication token
 * @returns Promise<SessionResponse> indicating success
 */
export const deselectCustomer = async (
  token: string | null
): Promise<SessionResponse> => {
  try {
    const result = await apiManagerRequest(
      token, 
      "session.deselect_customer", 
      {}
    );
    
    const success = JSON.parse(result);
    
    return {
      success: Boolean(success),
      message: success ? 
        'Customer deselected successfully' : 
        'Failed to deselect customer'
    };
  } catch (error) {
    console.error('Error deselecting customer:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to deselect customer'
    };
  }
};

/**
 * Get current session info including selected customer
 * @param token Manager authentication token
 * @returns Promise with session information
 */
export const getSessionInfo = async (token: string | null) => {
  try {
    const result = await apiManagerRequest(
      token, 
      "session.info", 
      {}
    );
    return JSON.parse(result);
  } catch (error) {
    console.error('Error getting session info:', error);
    throw error;
  }
};
