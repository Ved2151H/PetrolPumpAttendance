import './global.css';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LayoutDashboard, CalendarDays, Users, FileBarChart, Settings, LogOut } from 'lucide-react-native';

// Services
import { authService } from './services/api/auth';
import { apiClient } from './services/api/client';

// Screens (Imports will be resolved when files are created)
import LoginScreen from './screens/auth/LoginScreen';
import DashboardScreen from './screens/dashboard/DashboardScreen';
import AttendanceScreen from './screens/attendance/AttendanceScreen';
import WorkersListScreen from './screens/workers/WorkersListScreen';
import WorkerProfileScreen from './screens/workers/WorkerProfileScreen';
import AddWorkerScreen from './screens/workers/AddWorkerScreen';
import EditWorkerScreen from './screens/workers/EditWorkerScreen';
import ReportsScreen from './screens/reports/ReportsScreen';
import SettingsScreen from './screens/settings/SettingsScreen';

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Context
export const AuthContext = React.createContext<any>(null);

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Dashboard') return <LayoutDashboard color={color} size={size} />;
          if (route.name === 'Attendance') return <CalendarDays color={color} size={size} />;
          if (route.name === 'Workers') return <Users color={color} size={size} />;
          if (route.name === 'Reports') return <FileBarChart color={color} size={size} />;
          if (route.name === 'More') return <Settings color={color} size={size} />;
        },
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Workers" component={WorkersListScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="More" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    // Interceptor to handle 401 globally
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await SecureStore.deleteItemAsync('auth_token');
          setUserToken(null);
          queryClient.clear();
        }
        return Promise.reject(error);
      }
    );
    
    // Check local token on mount
    const bootstrapAsync = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          // Verify with backend
          await authService.me();
          setUserToken(token);
        }
      } catch (e) {
        // Token invalid or network error
        await SecureStore.deleteItemAsync('auth_token');
        setUserToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
    
    return () => {
      apiClient.interceptors.response.eject(interceptor);
    };
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async (token: string) => {
        setUserToken(token);
      },
      signOut: async () => {
        await SecureStore.deleteItemAsync('auth_token');
        setUserToken(null);
        queryClient.clear();
      },
    }),
    []
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authContext}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {userToken == null ? (
                <Stack.Screen name="Login" component={LoginScreen} />
              ) : (
                <>
                  <Stack.Screen name="MainTabs" component={TabNavigator} />
                  <Stack.Screen name="WorkerProfile" component={WorkerProfileScreen} options={{ headerShown: true, title: 'Worker Profile' }} />
                  <Stack.Screen name="AddWorker" component={AddWorkerScreen} options={{ headerShown: true, title: 'Add Worker', presentation: 'modal' }} />
                  <Stack.Screen name="EditWorker" component={EditWorkerScreen} options={{ headerShown: true, title: 'Edit Worker', presentation: 'modal' }} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </AuthContext.Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
