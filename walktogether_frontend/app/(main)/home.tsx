import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 1. MOCK DATA: Sanki veritabanından gelmiş gibi davranan örnek veriler
const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Sabah Sahil Yürüyüşü',
    start: 'Bebek Sahil',
    end: 'Emirgan',
    date: '25.12.2025 - 08:30',
    host: 'Caner',
    stops: 3
  },
  {
    id: '2',
    title: 'Belgrad Ormanı Doğa Koşusu',
    start: 'Neşet Suyu',
    end: 'Bahçeköy Girişi',
    date: '26.12.2025 - 10:00',
    host: 'Merve',
    stops: 5
  },
  {
    id: '3',
    title: 'Caddebostan Akşam Turu',
    start: 'Kadıköy',
    end: 'Bostancı',
    date: '27.12.2025 - 19:30',
    host: 'Ali',
    stops: 2
  }
];

export default function HomeScreen() {

  // 2. RENDER ITEM: Her bir kartın nasıl görüneceğini belirleyen yapı
  const renderEventCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.stops} Durak</Text>
        </View>
      </View>

      <View style={styles.routeInfo}>
        <View style={styles.routeLine}>
          <Ionicons name="location" size={16} color="#007AFF" />
          <Text style={styles.routeText}>{item.start}</Text>
        </View>
        <View style={styles.connector} />
        <View style={styles.routeLine}>
          <Ionicons name="flag" size={16} color="#FF3B30" />
          <Text style={styles.routeText}>{item.end}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.footerText}>{item.date}</Text>
        </View>
        <TouchableOpacity 
          style={styles.joinButton}
          onPress={() => Alert.alert("Katıl", `${item.title} etkinliğine katıldınız!`)}
        >
          <Text style={styles.joinButtonText}>Katıl</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Yakındaki Etkinlikler</Text>
      
      {/* 3. FLATLIST: Listeleme motoru */}
      <FlatList
        data={MOCK_EVENTS}
        renderItem={renderEventCard}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', paddingHorizontal: 20, paddingTop: 20, color: '#1a1a1a' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    // Gölge ayarları
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  eventTitle: { fontSize: 18, fontWeight: '700', color: '#333', flex: 1 },
  badge: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#007AFF', fontSize: 12, fontWeight: 'bold' },
  routeInfo: { marginVertical: 10 },
  routeLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeText: { fontSize: 14, color: '#555' },
  connector: { width: 1, height: 10, backgroundColor: '#ddd', marginLeft: 7, marginVertical: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { fontSize: 12, color: '#888' },
  joinButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  joinButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});