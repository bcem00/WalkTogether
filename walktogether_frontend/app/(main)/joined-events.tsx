import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react'; // useRef ve useEffect eklendi
import {
  ActivityIndicator,
  Dimensions,
  FlatList, Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { eventsApi } from '../apiClient';

const { width, height } = Dimensions.get('window');

export default function JoinedEventsScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [infoLoading, setInfoLoading] = useState(false);
  const GOOGLE_MAPS_APIKEY = 'AIzaSyDFYEsvv3CUOa07f13Go1T2XKul0HbtfnU';
  
  
  const mapRef = useRef<MapView>(null);

  useFocusEffect(
    useCallback(() => {
      fetchJoinedEvents();
    }, [])
  );

  
  useEffect(() => {
    if (destinations.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(destinations, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [destinations]);

  const fetchJoinedEvents = async () => {
    if (!refreshing) setLoading(true); 
    const username = await AsyncStorage.getItem('username');
    const result = await eventsApi.getEventsByUsername(username || '');
    if (result.data) {
      setEvents(result.data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJoinedEvents();
  }, []);

  const handleOpenInfo = async (event: any) => {
  // 1. Tıklanan kartın tüm içeriğini görelim (id mi geliyor event_id mi?)
  console.log("--- KART TIKLANDI ---");
  console.log("Gelen Event Objesi:", JSON.stringify(event, null, 2));
    
  setSelectedEvent(event);
  setInfoLoading(true);
  
  // 2. ID tespiti
  const eventId = event.event_id || event.id || event.eventId;
  console.log("Tespit Edilen ID:", eventId);

  if (!eventId) {
    console.log("HATA: Obje içinde ID bulunamadı!");
    setInfoLoading(false);
    return;
  }

  // 3. API İsteği
  console.log("API İsteği Atılıyor: /api/events/" + eventId + "/destinations");
  const result = await eventsApi.getDestinationsForEvent(eventId);
  
  if (result.data) {
    // 4. Gelen durak verisinin detaylı dökümü
    console.log("API'den Gelen Durak Sayısı:", result.data.length);
    console.log("Durak Verisi (İlk Eleman):", JSON.stringify(result.data[0], null, 2));

    const mappedDestinations = result.data.map((d: any) => ({
      ...d,
      latitude: d.latitude || d.lat || d.Lat,
      longitude: d.longitude || d.lng || d.Lng || d.Long,
    })).sort((a: any, b: any) => a.order_in_route - b.order_in_route);

    setDestinations(mappedDestinations);
  } else {
    // 5. Hata durumu (404, 500 veya boş dönme)
    console.log("API HATASI VEYA BOŞ VERİ:", result.error || "Veri gelmedi");
    setDestinations([]);
  }
  setInfoLoading(false);
  console.log("--- İŞLEM TAMAMLANDI ---");
};

  // Rota hesaplamalarını daha güvenli hale getirdik
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

      {loading && !refreshing ? (
        <ActivityIndicator color="#007AFF" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={item => (item.id || item.event_id || Math.random()).toString()}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]} />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>Henüz bir etkinliğe katılmadınız.</Text>}
        />
      )}

      <Modal visible={!!selectedEvent} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
              <TouchableOpacity onPress={() => { setSelectedEvent(null); setDestinations([]); }}>
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
                      ref={mapRef} // Ref buraya bağlandı
                      style={styles.map}
                      initialRegion={{
                        latitude: 41.0082,
                        longitude: 28.9784,
                        latitudeDelta: 0.05, longitudeDelta: 0.05
                      }}
                    >
                      {/* DURAK MARKERLARI */}
                      {destinations.map((d, i) => (
                        <Marker key={d.destination_id} coordinate={{latitude: d.latitude, longitude: d.longitude}}>
                           <View style={styles.markerBadge}><Text style={styles.markerText}>{i + 1}</Text></View>
                           <Ionicons name="location" size={26} color="#007AFF" />
                        </Marker>
                      ))}

                      {/* YOL GÜZERGAHI */}
                      {origin && destination && (
                        <MapViewDirections
                          origin={origin}
                          destination={destination}
                          waypoints={waypoints}
                          apikey={GOOGLE_MAPS_APIKEY}
                          strokeWidth={4} 
                          strokeColor="#007AFF" 
                          mode="WALKING"
                          // Google bazen 2 durak arası çok yakınsa hata verebilir, onReady ile mesafeyi loglayabilirsin
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