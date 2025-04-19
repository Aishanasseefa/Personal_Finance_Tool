// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import OnlinePaymentScreen from './src/screens/OnlinePaymentScreen';
import AdvanceScreen from './src/screens/AdvanceScreen';
import PriorityScreen from './src/screens/PriorityScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SuggestionScreen from './src/screens/SuggestionScreen';
import ReportScreen from './src/screens/ReportScreen';
import AdditionalIncomeScreen from './src/screens/AdditionalIncomeScreen';
import { getUserId } from './src/config/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userId = await getUserId();
        if (userId) {
          const username = await AsyncStorage.getItem('username');
          setUserData({ user_id: userId, username });
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
      }
    };
    checkLoginStatus();
  }, []);

  if (isLoggedIn === null) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? 'HomeScreen' : 'Login'} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} initialParams={{ user: userData }} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
        <Stack.Screen name="OnlinePayment" component={OnlinePaymentScreen} />
        <Stack.Screen name="Advance" component={AdvanceScreen} />
        <Stack.Screen name="Priority" component={PriorityScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Suggestions" component={SuggestionScreen} />
        <Stack.Screen name="Reports" component={ReportScreen} />
        <Stack.Screen name="AdditionalIncome" component={AdditionalIncomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}