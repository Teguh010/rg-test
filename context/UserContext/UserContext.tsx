import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { jwtDecode } from 'jwt-decode';

import { settingList, settingUpdate } from '@/models/setting';
import { refreshTokenModel } from '@/models/user_profile';
import { apiManagerRefreshToken } from '@/models/manager/common';
import { relogin } from '@/lib/auth';

// Define storage keys at the top of the file
const STORAGE_KEYS = {
  USER: 'userData-client',
  MANAGER: 'userData-manager',
  CURRENT_ROLE: 'current-role' // To track which role is active in the current tab
};

export interface Setting {
  title: string
  value: string | boolean | number
}

export interface User {
  token: string | null
  username: string | null
  password: string | null
  customer: string | null
  role?: 'manager' | 'user'
  manager?: string | null
  isClientView?: boolean
  userId?: string | number
}

interface UserContextType {
  models: {
    user: User | null
    userProfileData: User | null
    settings: Setting[] | null
  }
  operations: {
    setUser: (user: Partial<User>) => void
    clearUser: () => void
    setSettings: (settings: Setting[]) => void
    refreshToken: () => void
    getUserRef: () => User | null
    checkAndRefreshToken: () => Promise<boolean>
  }
}

const UserContext = createContext<UserContextType>({
  models: {
    user: null,
    settings: null,
    userProfileData: null,
  },
  operations: {
    setUser: () => {},
    clearUser: () => {},
    setSettings: () => {},
    refreshToken: () => {},
    getUserRef: () => null,
    checkAndRefreshToken: () => Promise.resolve(false),
  },
});

const defaultSettings: Setting[] = [
  { title: 'time_format', value: 'HH:mm:ss' },
  { title: 'language', value: 'en' },
  { title: 'date_format', value: 'dd-MM-yyyy' },
  { title: 'unit_volume', value: 'l' },
  { title: 'unit_distance', value: 'km' },
];

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null); // Initialize as null
  const userRef = useRef<User | null>(user);
  const [settings, setSettingsState] = useState<Setting[]>([]);

  const [userProfileData, setUserProfileData] = useState(null);
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const handleSetUser = useCallback((newUser: Partial<User>) => {
    setUserState((prevUser) => {
      const updatedUser = { ...prevUser, ...newUser };
      
      // Determine which storage key to use based on role
      const storageKey = updatedUser.role === 'manager' 
        ? STORAGE_KEYS.MANAGER 
        : STORAGE_KEYS.USER;
      
      // Store only necessary data based on role
      const storageData = {
        token: updatedUser.token,
        username: updatedUser.username,
        password: updatedUser.password,
        role: updatedUser.role,
        manager: updatedUser.role === 'manager' ? updatedUser.manager : null,
        customer: updatedUser.role === 'user' ? updatedUser.customer : null
      };

      if (updatedUser.token) {
        // Store in role-specific localStorage
        localStorage.setItem(storageKey, JSON.stringify(storageData));
        
        // Track current active role for this tab
        localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, updatedUser.role || 'user');
        
        // Store in cookies with proper encoding
        const encodedData = encodeURIComponent(JSON.stringify(storageData));
        document.cookie = `${storageKey}=${encodedData}; path=/; max-age=86400`;
      }
      
      return updatedUser;
    });
  }, []);

  const handleClearUser = useCallback(() => {
    const currentRole = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE) || 'user';
    const storageKey = currentRole === 'manager' ? STORAGE_KEYS.MANAGER : STORAGE_KEYS.USER;
    
    localStorage.removeItem(storageKey);
    localStorage.removeItem('token');
    localStorage.removeItem('manager-selected-customer');
    setUserState(null);
    setSettingsState([]);
  }, []);

const refreshToken = useCallback(async () => {
  const userData = userRef.current;
  if (userData?.token) {
    try {
      let refreshedData;
      
      // Use different refresh token endpoint based on role
      if (userData.role === 'manager') {
        refreshedData = await apiManagerRefreshToken();
      } else {
        refreshedData = await refreshTokenModel(userData.token);
      }

      if (refreshedData) {
        // Update token in context and storage
        handleSetUser({ token: refreshedData.access_token });
        return refreshedData;
      } else {
        console.error('Failed to refresh token: No refreshed token returned.');
        throw new Error('Failed to refresh token');
      }
    } catch (error: any) {
      console.error('Refresh token error:', error);
      
      // If silent refresh/re-login failed, then force relogin
      if (error.msg !== 'Token has expired') {
        await relogin();
      }
      throw error;
    }
  } else {
    console.warn('No token available to refresh');
    handleClearUser();
    window.location.assign('/');
  }
}, [handleSetUser, handleClearUser]);

  // Decode token to get the exp value
  const getTokenExpirationTime = useCallback((token: string) => {
    try {
      const decoded = jwtDecode(token);
      const expTime = decoded.exp ? decoded.exp * 1000 : null; // Convert to millisecond
      return expTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get current role for this tab
      const currentRole = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE);
      
      // Determine which storage to use based on current role or URL path
      const isManagerPath = window.location.pathname.includes('/manager');
      const storageKey = isManagerPath || currentRole === 'manager' 
        ? STORAGE_KEYS.MANAGER 
        : STORAGE_KEYS.USER;
      
      const storedUserData = localStorage.getItem(storageKey);
      
      if (storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          const initialUserState = {
            token: parsedData.token || null,
            username: parsedData.username || null,
            password: parsedData.password || null,
            role: parsedData.role || null,
            manager: parsedData.role === 'manager' ? parsedData.manager : null,
            customer: parsedData.role === 'user' ? parsedData.customer : null
          };

          setUserState(initialUserState);
          userRef.current = initialUserState;
          
          // Update current role for this tab
          if (parsedData.role) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, parsedData.role);
          }
        } catch (error) {
          console.error('Error parsing userData from localStorage:', error);
          handleClearUser();
        }
      }
    }
  }, []); // Empty dependency array for initialization

useEffect(() => {
  if (user?.token) {
    const expirationTime = getTokenExpirationTime(user.token);
    if (expirationTime) {
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      const isManagerToken = localStorage.getItem('is-manager-token') === 'true';
      
      const refreshTime = isManagerToken 
        ? Math.max(timeUntilExpiration * 0.5, 10000)
        : Math.max(timeUntilExpiration - 60000, timeUntilExpiration * 0.5);
            
      if (refreshTime > 0) {
        const timeoutId = setTimeout(() => {
          refreshToken();
        }, refreshTime);
        return () => clearTimeout(timeoutId);
      } else {
        refreshToken();
      }
    }
  }
}, [user?.token, getTokenExpirationTime, refreshToken]);


  const handleSetSettings = useCallback(
    async (newSettings: Setting[]) => {
      if (!userRef.current?.token) return;

      const updatedSettings = [...settings];

      for (const newSetting of newSettings) {
        const storedSetting = updatedSettings.find((setting) => setting.title === newSetting.title);
        if (!storedSetting || storedSetting.value !== newSetting.value) {
          const settingIndex = updatedSettings.findIndex(
            (setting) => setting.title === newSetting.title
          );

          if (settingIndex !== -1) {
            updatedSettings[settingIndex] = newSetting;
          } else {
            updatedSettings.push(newSetting);
          }

          try {
            await settingUpdate(userRef.current.token, newSetting.title, String(newSetting.value));
          } catch (error) {
            console.error(`Error updating setting ${newSetting.title}:`, error);
          }
        }
      }

      setSettingsState(updatedSettings);
    },
    [settings]
  );

  // Fetch settings when token is available
  useEffect(() => {
    if (user?.token) {
      const fetchUserSettings = async () => {
        try {
          // If user is a manager, use default settings without API call
          if (user.role === 'manager') {
            setSettingsState(defaultSettings);
            return;
          }

          const data = await settingList(user.token);
          if (data && data.items) {
            let updatedSettings = [...defaultSettings];
            
            // Safely access data using optional chaining
            const timeFormat = data.items?.find((item) => item.key === 'time_format');
            const language = data.items?.find((item) => item.key === 'language');
            const dateFormat = data.items?.find((item) => item.key === 'date_format');
            const unitVolume = data.items?.find((item) => item.key === 'unit_volume');
            const unitDistance = data.items?.find((item) => item.key === 'unit_distance');

            if (timeFormat) {
              updatedSettings = updatedSettings.map((setting) =>
                setting.title === 'time_format' ? { ...setting, value: timeFormat.vle } : setting
              );
            }
            if (language) {
              updatedSettings = updatedSettings.map((setting) =>
                setting.title === 'language' ? { ...setting, value: language.vle } : setting
              );
            }
            if (dateFormat) {
              updatedSettings = updatedSettings.map((setting) =>
                setting.title === 'date_format' ? { ...setting, value: dateFormat.vle } : setting
              );
            }
            if (unitVolume) {
              updatedSettings = updatedSettings.map((setting) =>
                setting.title === 'unit_volume' ? { ...setting, value: unitVolume.vle } : setting
              );
            }
            if (unitDistance) {
              updatedSettings = updatedSettings.map((setting) =>
                setting.title === 'unit_distance'
                  ? { ...setting, value: unitDistance.vle }
                  : setting
              );
            }
            setSettingsState(updatedSettings);
          } else {
            setSettingsState(defaultSettings);
          }
        } catch (error) {
          console.error('Error fetching client info:', error);
          setSettingsState(defaultSettings);
        }
      };
      fetchUserSettings();
    }
  }, [user?.token, user?.role]);

  // Listener for cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Check if the changed storage key is relevant to our context
      if (event.key === STORAGE_KEYS.USER || event.key === STORAGE_KEYS.MANAGER) {
        // Only update if the changed key matches our current role
        const currentRole = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE);
        const relevantKey = currentRole === 'manager' ? STORAGE_KEYS.MANAGER : STORAGE_KEYS.USER;
        
        if (event.key === relevantKey) {
          const newUserData = event.newValue ? JSON.parse(event.newValue) : null;
          setUserState((prevUser) => ({
            ...prevUser,
            token: newUserData ? newUserData.token : null,
          }));

          if (!newUserData) {
            setSettingsState([]);
          }
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!dataFetchedRef.current) {
      // Determine which storage to use based on current role
      const currentRole = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE) || 'user';
      const storageKey = currentRole === 'manager' ? STORAGE_KEYS.MANAGER : STORAGE_KEYS.USER;
      
      const storedUserData = localStorage.getItem(storageKey);

      if (storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          // Modified validation to handle both user and manager roles
          if (parsedData.token && parsedData.username) {
            const userData: User = {
              username: parsedData.username,
              token: parsedData.token,
              password: parsedData.password,
              customer: parsedData.customer,
              role: parsedData.role,
              manager: parsedData.manager
            };

            // Set data ke state
            setUserProfileData(userData);
            dataFetchedRef.current = true;
          } else {
            console.error('Invalid userData in localStorage', parsedData);
          }
        } catch (error) {
          console.error('Error parsing userData from localStorage:', error);
        }
      } else {
        console.error('No userData found in localStorage');
      }
    }
  }, []);

  useEffect(() => {
    if (user?.token && !dataFetchedRef.current) {
      fetchUserData();
    }
  }, [user?.token, fetchUserData]);

  // Add debug logging to getUserRef
  const getUserRef = useCallback(() => {
    return userRef.current;
  }, []);

  const checkAndRefreshToken = useCallback(async () => {
    const userData = userRef.current;
    if (userData?.token) {
      const expirationTime = getTokenExpirationTime(userData.token);
      if (expirationTime) {
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;
        
        if (timeUntilExpiration < 30000) {
          console.warn('Token will expire soon, refreshing...');
          try {
            await refreshToken();
            return true; 
          } catch (error) {
            console.error('Failed to refresh token:', error);
            return false; 
          }
        }
      }
    }
    return false;
  }, [getTokenExpirationTime, refreshToken]);

  return (
    <UserContext.Provider
      value={{
        models: {
          user,
          settings,
          userProfileData,
        },
        operations: {
          setUser: handleSetUser,
          clearUser: handleClearUser,
          setSettings: handleSetSettings,
          refreshToken,
          getUserRef,
          checkAndRefreshToken,
        },
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
