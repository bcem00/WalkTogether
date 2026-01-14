import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Colors } from '../../constants/theme';
import { authApi, eventsApi } from '../apiClient'; // Dosya yoluna dikkat

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Sayfa açıldığında veritabanından etkinlikleri çek
  useEffect(() => {
    loadAllEvents();
  }, []);

  const loadAllEvents = async () => {
    // getUpcomingEvents tüm sistemdeki etkinlikleri getirir
    const result = await eventsApi.getUpcomingEvents();
    
    if (result.data) {
      setEvents(result.data); // Veri tabanındaki 'events' tablosundan gelen veri
    }
    setLoading(false);
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${eventTitle}"?`,
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            const result = await eventsApi.deleteEvent(eventId);
            if (result.data) {
              Alert.alert('Success', result.data.message);
              // Refresh the events list
              loadAllEvents();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete event');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  const handleQuit = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to quit?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Quit',
          onPress: async () => {
            await authApi.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'index' as never }],
            });
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  const renderAdminItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}>
      <View style={styles.info}>
        <Text style={[styles.title, { color: themeColors.text }]}>{item.title}</Text>
        <Text style={[styles.creator, { color: themeColors.tint }]}>Oluşturan: @{item.creator_username}</Text>
        <Text style={[styles.details, { color: themeColors.placeholder }]}>Kod: {item.invitation_code} | Katılımcı: {item.participant_count}</Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteBtn}
        onPress={() => handleDeleteEvent(item.event_id, item.title)}
      >
        <Ionicons name="trash-outline" size={22} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.headerContainer, { backgroundColor: themeColors.inputBackground, borderBottomColor: themeColors.border }]}>
        <View>
          <Text style={[styles.header, { color: themeColors.text }]}>Admin Paneli</Text>
          <Text style={[styles.subHeader, { color: themeColors.lightText }]}>Sistemdeki Tüm Etkinlikler</Text>
        </View>
        <TouchableOpacity style={styles.quitBtn} onPress={handleQuit}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.quitBtnText}>Çık</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={themeColors.tint} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={events}
          renderItem={renderAdminItem}
          keyExtractor={(item) => item.event_id.toString()}
          contentContainerStyle={{ padding: 20, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: themeColors.placeholder }}>Henüz etkinlik yok.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 40, backgroundColor: '#fff', paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  header: { fontSize: 24, fontWeight: 'bold' },
  subHeader: { fontSize: 14, color: '#666', marginTop: 5 },
  quitBtn: { backgroundColor: '#FF3B30', flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8 },
  quitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  card: { backgroundColor: '#fff', flexDirection: 'row', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2, marginHorizontal: 2 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold' },
  creator: { color: '#007AFF', fontSize: 13, marginVertical: 4 },
  details: { fontSize: 11, color: '#999' },
  deleteBtn: { justifyContent: 'center', paddingLeft: 10 }
});