import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { eventsApi } from '../apiClient';

interface Event {
  event_id: string;
  title: string;
  description: string;
  start_date: string;
  invitation_code: string;
  creator_full_name: string;
  creator_username: string;
  route_distance_meters: number;
  participant_count: number;
}

export default function HomeScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const result = await eventsApi.getUpcomingEvents();
    if (result.data) {
      setEvents(result.data);
    } else {
      Alert.alert('Error', 'Failed to load events: ' + result.error);
    }
    setLoading(false);
  };

  const handleJoin = (event: Event) => {
    // For now, just alert. In a real app, you'd need user ID and call join API
    Alert.alert('Join Event', `Joining ${event.title} with code: ${event.invitation_code}`);
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.participant_count} Participants</Text>
        </View>
      </View>

      <Text style={styles.description}>{item.description}</Text>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.footerText}>{new Date(item.start_date).toLocaleString()}</Text>
        </View>
        <View style={styles.footerInfo}>
          <Ionicons name="person-outline" size={14} color="#666" />
          <Text style={styles.footerText}>{item.creator_full_name}</Text>
        </View>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => handleJoin(item)}
        >
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Upcoming Events</Text>

      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={item => item.event_id}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No upcoming events</Text>}
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
  description: { fontSize: 14, color: '#555', marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  footerText: { fontSize: 12, color: '#888' },
  joinButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  joinButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#666', marginTop: 50 },
});