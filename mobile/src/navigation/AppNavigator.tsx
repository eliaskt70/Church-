import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';

// Main screens
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import ServiceDetailScreen from '../screens/search/ServiceDetailScreen';
import ConversationsScreen from '../screens/messages/ConversationsScreen';
import ChatScreen from '../screens/messages/ChatScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_left',
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="OTP" component={OTPScreen} />
  </AuthStack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#00897B' },
      headerTintColor: '#FFFFFF',
      tabBarActiveTintColor: '#00897B',
      tabBarInactiveTintColor: '#9E9E9E',
      tabBarStyle: { minHeight: 56, paddingBottom: 6 },
      tabBarLabelStyle: { fontSize: 12 },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: '\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629',
        tabBarLabel: '\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629',
      }}
    />
    <Tab.Screen
      name="Search"
      component={SearchScreen}
      options={{
        title: '\u0627\u0644\u0628\u062D\u062B',
        tabBarLabel: '\u0627\u0644\u0628\u062D\u062B',
      }}
    />
    <Tab.Screen
      name="Messages"
      component={ConversationsScreen}
      options={{
        title: '\u0627\u0644\u0631\u0633\u0627\u0626\u0644',
        tabBarLabel: '\u0627\u0644\u0631\u0633\u0627\u0626\u0644',
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: '\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A',
        tabBarLabel: '\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A',
      }}
    />
  </Tab.Navigator>
);

const MainNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen
      name="MainTabs"
      component={MainTabs}
      options={{ headerShown: false }}
    />
    <MainStack.Screen
      name="ServiceDetail"
      component={ServiceDetailScreen}
      options={{
        title: '\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062E\u062F\u0645\u0629',
        headerStyle: { backgroundColor: '#00897B' },
        headerTintColor: '#FFFFFF',
      }}
    />
    <MainStack.Screen
      name="Chat"
      component={ChatScreen}
      options={({ route }: any) => ({
        title: route.params?.userName || '\u0645\u062D\u0627\u062F\u062B\u0629',
        headerStyle: { backgroundColor: '#00897B' },
        headerTintColor: '#FFFFFF',
      })}
    />
  </MainStack.Navigator>
);

const AppNavigator: React.FC = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer>
      {token ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
