import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './src/theme';
import { TodayScreen } from './src/screens/TodayScreen';
import { MyWorkScreen } from './src/screens/MyWorkScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { MentorScreen } from './src/screens/MentorScreen';
import { WelcomeScreen } from './src/screens/auth/WelcomeScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignupScreen } from './src/screens/auth/SignupScreen';
import { ProfileScreen } from './src/screens/auth/ProfileScreen';
import { CareerPhaseOneScreen } from './src/screens/career/CareerPhaseOneScreen';
import { CareerPhaseTwoScreen } from './src/screens/career/CareerPhaseTwoScreen';
import { CareerPhaseThreeScreen } from './src/screens/career/CareerPhaseThreeScreen';
import { CareerResultScreen } from './src/screens/career/CareerResultScreen';
import { AppStateProvider, useAppState } from './src/state/appState';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const CareerStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: 'transparent',
  },
};

function AppRoutes() {
  const { user, hasCompletedCareerDiscovery, loading } = useAppState();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textMuted }}>Loading…</Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : !hasCompletedCareerDiscovery ? (
        <RootStack.Screen name="Career" component={CareerNavigator} />
      ) : (
        <RootStack.Screen name="Main" component={Tabs} />
      )}
      <RootStack.Screen
        name="ProfileModal"
        component={ProfileScreen}
        options={{ presentation: 'modal' }}
      />
    </RootStack.Navigator>
  );
}

function Tabs() {
  const insets = useSafeAreaInsets();
  const tabPadBottom = 8 + insets.bottom;
  const tabBarHeight = 60 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#020617',
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: tabPadBottom,
          height: tabBarHeight,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          paddingBottom: 2,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = size + 2;
          if (route.name === 'Today') {
            return <Ionicons name={focused ? 'home' : 'home-outline'} size={iconSize} color={color} />;
          }
          if (route.name === 'MyWork') {
            return <Ionicons name={focused ? 'folder' : 'folder-outline'} size={iconSize} color={color} />;
          }
          if (route.name === 'Progress') {
            return (
              <Ionicons
                name={focused ? 'stats-chart' : 'stats-chart-outline'}
                size={iconSize}
                color={color}
              />
            );
          }
          return (
            <Ionicons
              name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
              size={iconSize}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="MyWork" component={MyWorkScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Mentor" component={MentorScreen} />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="Profile" component={ProfileScreen} />
    </AuthStack.Navigator>
  );
}

function CareerNavigator() {
  return (
    <CareerStack.Navigator screenOptions={{ headerShown: false }}>
      <CareerStack.Screen name="PhaseOne" component={CareerPhaseOneScreen} />
      <CareerStack.Screen name="PhaseTwo" component={CareerPhaseTwoScreen} />
      <CareerStack.Screen name="PhaseThree" component={CareerPhaseThreeScreen} />
      <CareerStack.Screen name="Result" component={CareerResultScreen} />
    </CareerStack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" />
            <AppRoutes />
          </NavigationContainer>
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
