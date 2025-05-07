import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
const jwtDecode = require('jwt-decode');

import { settingList, settingUpdate } from '@/models/setting';
import { userProfile, refreshTokenModel } from '@/models/user_profile';
import { apiManagerRefreshToken } from '@/models/manager/common';
import { relogin } from '@/lib/auth';

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
  },
});

const defaultSettings: Setting[] = [
  { title: 'time_format', value: 'HH:mm:ss' },
  { title: 'language', value: 'en' },
  { title: 'date_format', value: 'dd-MM-yyyy' },
  { title: 'unit_volume', value: 'l' },
  { title: 'unit_distance', value: 'km' },
];

const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} minutes ${seconds} seconds`;
};

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
        // Store in localStorage
        localStorage.setItem('userData', JSON.stringify(storageData));
        
        // Store in cookies with proper encoding
        const encodedData = encodeURIComponent(JSON.stringify(storageData));
        document.cookie = `userData=${encodedData}; path=/; max-age=86400`;
      }
      
      return updatedUser;
    });
  }, []);

  const handleClearUser = useCallback(() => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    localStorage.removeItem('userdata');
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
      const decoded = jwtDecode.jwtDecode(token);
      const expTime = decoded.exp ? decoded.exp * 1000 : null; // Convert to millisecond
      return expTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserData = localStorage.getItem('userData');
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

      const refreshTime = Math.max(timeUntilExpiration - 60000, timeUntilExpiration * 0.5);
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
      if (event.key === 'userData') {
        const newUserData = event.newValue ? JSON.parse(event.newValue) : null;
        setUserState((prevUser) => ({
          ...prevUser,
          token: newUserData ? newUserData.token : null,
        }));

        if (!newUserData) {
          setSettingsState([]);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [getTokenExpirationTime]);

  const fetchUserData = useCallback(async () => {
    if (!dataFetchedRef.current) {
      const storedUserData = localStorage.getItem('userData');

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
        },
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
