import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { eventsApi } from '../apiClient'; // Dosya yoluna dikkat

export default function AdminDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const renderAdminItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.creator}>Oluşturan: @{item.creator_username}</Text>
        <Text style={styles.details}>Kod: {item.invitation_code} | Katılımcı: {item.participant_count}</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={22} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Paneli</Text>
      <Text style={styles.subHeader}>Sistemdeki Tüm Etkinlikler</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={events}
          renderItem={renderAdminItem}
          keyExtractor={(item) => item.event_id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text>Henüz etkinlik yok.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { fontSize: 24, fontWeight: 'bold', paddingHorizontal: 20, paddingTop: 40 },
  subHeader: { fontSize: 14, color: '#666', paddingHorizontal: 20, marginBottom: 20 },
  card: { backgroundColor: '#fff', flexDirection: 'row', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2, marginHorizontal: 2 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold' },
  creator: { color: '#007AFF', fontSize: 13, marginVertical: 4 },
  details: { fontSize: 11, color: '#999' },
  deleteBtn: { justifyContent: 'center', paddingLeft: 10 }
});