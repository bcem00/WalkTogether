import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function MainLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#007AFF', // Aktif ikonun rengi
      headerShown: true,               // Sayfa başlıkları görünsün mü?
    }}>
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: 'Keşfet', 
          tabBarIcon: ({color}) => <Ionicons name="map-outline" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="create-event" 
        options={{ 
          title: 'Etkinlik Kur', 
          tabBarIcon: ({color}) => <Ionicons name="add-circle-outline" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="friends" 
        options={{ 
          title: 'Arkadaşlar', 
          tabBarIcon: ({color}) => <Ionicons name="people-outline" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profilim', 
          tabBarIcon: ({color}) => <Ionicons name="person-outline" size={24} color={color} /> 
        }} 
      />
    </Tabs>
  );
}