import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { authApi } from '../apiClient';

// 1. DÜZELTME (image_b39ac3.png): Eksik olan shouldShowBanner ve shouldShowList eklendi
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,   
  }),
});

export default function MainLayout() {
  // 2. DÜZELTME (image_b39b5e.png): useRef için (null) başlangıç değeri eklendi
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotifications().then(async (token) => {
      if (token) {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          console.log("Push Token Kaydediliyor:", token);
          await authApi.savePushToken(userId, token);
        }
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Bildirim Alındı:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Bildirime Tıklandı:", response);
    });

    return () => {
      // 3. DÜZELTME (image_b3a2c6.png): removeNotificationSubscription yerine .remove() kullanıldı
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  async function registerForPushNotifications() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      // Buradaki projectId'yi app.json'dan almayı unutma
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: '1eedce21-67a8-4e6b-87e7-b52214f92484' 
      })).data;
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    return token;
  }

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF', headerShown: true }}>
      <Tabs.Screen 
        name="home" 
        options={{ title: 'Keşfet', tabBarIcon: ({color}) => <Ionicons name="map-outline" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="create-event" 
        options={{ title: 'Etkinlik Kur', tabBarIcon: ({color}) => <Ionicons name="add-circle-outline" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="joined-events" 
        options={{ title: 'Etkinliklerim', tabBarIcon: ({color}) => <Ionicons name="walk-outline" size={24} color={color} /> }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ title: 'Profilim', tabBarIcon: ({color}) => <Ionicons name="person-outline" size={24} color={color} /> }} 
      />
    </Tabs>
  );
}