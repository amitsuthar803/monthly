/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DashboardScreen from './src/screens/DashboardScreen';
import EMIDetailsScreen from './src/screens/EMIDetailsScreen';
import AddEMIScreen from './src/screens/AddEMIScreen';
import EditEMIScreen from './src/screens/EditEMIScreen';
import AllEMIsScreen from './src/screens/AllEMIsScreen';
import CompletedEMIsScreen from './src/screens/CompletedEMIsScreen';
import ActiveEMIsScreen from './src/screens/ActiveEMIsScreen';
import type {RootStackParamList, RootTabParamList} from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#2A2C36',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerStyle: {
          backgroundColor: '#1E1F28',
        },
        headerTintColor: '#fff',
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="view-dashboard" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="All EMIs"
        component={AllEMIsScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="format-list-bulleted" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Active"
        component={ActiveEMIsScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="clock-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Completed"
        component={CompletedEMIsScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <Icon name="check-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E1F28',
          },
          headerTintColor: '#fff',
          contentStyle: {
            backgroundColor: '#1E1F28',
          },
        }}>
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{headerShown: false}}
        />
        <Stack.Screen name="EMIDetails" component={EMIDetailsScreen} />
        <Stack.Screen name="AddEMI" component={AddEMIScreen} />
        <Stack.Screen name="EditEMI" component={EditEMIScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
