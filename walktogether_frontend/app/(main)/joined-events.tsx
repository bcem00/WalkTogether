import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList, Modal,
    ScrollView,
    StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { eventsApi } from '../apiClient'; //

const { width, height } = Dimensions.get('window');

export default function JoinedEventsScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Home.tsx ile birebir aynı panel state'leri
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [infoLoading, setInfoLoading] = useState(false);
  const GOOGLE_MAPS_APIKEY = 'AIzaSyDFYEsvv3CUOa07f13Go1T2XKul0HbtfnU';

  useEffect(() => {
    fetchJoinedEvents();
  }, []);

  const fetchJoinedEvents = async () => {
    setLoading(true);
    // Veritabanındaki 'attendances' tablosu üzerinden kullanıcının katıldıklarını çekiyoruz
    const username = await AsyncStorage.getItem('username');
    
    // Burada backend'den gelen, kullanıcının katıldığı etkinliklerin listesini çekiyoruz
    const result = await eventsApi.getEventsByUsername(username || '');
    
    if (result.data) {
      setEvents(result.data);
    }
    setLoading(false);
  };

  const handleOpenInfo = async (event: any) => {
    setSelectedEvent(event);
    setInfoLoading(true);
    // Rota ve durak bağlantısı: Destinations tablosundan verileri çek
    const result = await eventsApi.getDestinationsForEvent(event.event_id || event.id);
    if (result.data) {
      setDestinations(result.data.sort((a: any, b: any) => a.order_in_route - b.order_in_route));
    }
    setInfoLoading(false);
  };

  // Harita Koordinat Hesaplamaları (Home.tsx ile aynı)
  const origin = destinations.length > 0 ? { latitude: destinations[0].latitude, longitude: destinations[0].longitude } : null;
  const destination = destinations.length > 1 ? { latitude: destinations[destinations.length - 1].latitude, longitude: destinations[destinations.length - 1].longitude } : null;
  const waypoints = destinations.length > 2 ? destinations.slice(1, -1).map(d => ({ latitude: d.latitude, longitude: d.longitude })) : [];

  const renderEventCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleOpenInfo(item)}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{item.invitation_code}</Text>
        </View>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardBottom}>
        <Ionicons name="calendar-outline" size={14} color="#888" />
        <Text style={styles.cardDate}>{new Date(item.start_date).toLocaleDateString('tr-TR')}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.headerTitle}>Katıldığım Etkinlikler</Text>
        <Text style={styles.headerSubtitle}>Yürüyüş takviminiz burada listelenir.</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#007AFF" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={item => (item.event_id || item.id).toString()}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Henüz bir etkinliğe katılmadınız.</Text>}
        />
      )}

      {/* EVENT INFO PANELİ (Home.tsx ile birebir aynı yapı) */}
      <Modal visible={!!selectedEvent} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                <Ionicons name="close-circle" size={32} color="#ccc" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {infoLoading ? (
                <ActivityIndicator color="#007AFF" style={{margin: 20}} />
              ) : (
                <>
                  <View style={styles.mapBox}>
                    <MapView 
                      style={styles.map}
                      initialRegion={{
                        latitude: destinations[0]?.latitude || 41.0082,
                        longitude: destinations[0]?.longitude || 28.9784,
                        latitudeDelta: 0.01, longitudeDelta: 0.01
                      }}
                    >
                      {destinations.map((d, i) => (
                        <Marker key={d.destination_id} coordinate={{latitude: d.latitude, longitude: d.longitude}}>
                           <View style={styles.markerBadge}><Text style={styles.markerText}>{i + 1}</Text></View>
                           <Ionicons name="location" size={26} color="#007AFF" />
                        </Marker>
                      ))}
                      {origin && destination && (
                        <MapViewDirections
                          origin={origin}
                          destination={destination}
                          waypoints={waypoints}
                          apikey={GOOGLE_MAPS_APIKEY}
                          strokeWidth={4} strokeColor="#007AFF" mode="WALKING"
                        />
                      )}
                    </MapView>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Davet Kodu:</Text>
                    <Text style={styles.detailValue}>{selectedEvent?.invitation_code}</Text>
                  </View>
                  <Text style={styles.detailDesc}>{selectedEvent?.description}</Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  pageHeader: { padding: 25, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#888', marginTop: 5 },
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 15, padding: 15, borderRadius: 15, elevation: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 17, fontWeight: 'bold' },
  codeBadge: { backgroundColor: '#E3F2FD', padding: 4, borderRadius: 6 },
  codeText: { color: '#007AFF', fontSize: 11, fontWeight: 'bold' },
  cardDesc: { color: '#666', fontSize: 14, marginBottom: 12 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardDate: { fontSize: 12, color: '#888' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '85%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  mapBox: { height: 250, borderRadius: 15, overflow: 'hidden', marginBottom: 20 },
  map: { width: '100%', height: '100%' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  detailLabel: { color: '#888' },
  detailValue: { fontWeight: 'bold', color: '#007AFF' },
  detailDesc: { color: '#444', lineHeight: 22 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  markerBadge: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 5, borderWidth: 1, borderColor: '#007AFF', position: 'absolute', top: -15, alignSelf: 'center', zIndex: 1 },
  markerText: { fontSize: 10, fontWeight: 'bold', color: '#007AFF' }
});