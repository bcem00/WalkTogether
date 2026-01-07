import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList, Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { eventsApi } from '../apiClient';

// Helper to decode Google Polyline string into coordinates
const decodePolyline = (t: string) => {
  let points = [];
  let index = 0, len = t.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push({ latitude: (lat / 1E5), longitude: (lng / 1E5) });
  }
  return points;
};

export default function JoinedEventsScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false); // Yeni: Ayrılma işlemi için
  
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [destinations, setDestinations] = useState<any[]>([]); // Markers
  const [routeCoords, setRouteCoords] = useState<any[]>([]);   // The path line
  const [infoLoading, setInfoLoading] = useState(false);
  
  const GOOGLE_MAPS_APIKEY = 'AIzaSyDFYEsvv3CUOa07f13Go1T2XKul0HbtfnU';
  const mapRef = useRef<MapView>(null);

  useFocusEffect(
    useCallback(() => {
      fetchJoinedEvents();
    }, [])
  );

  useEffect(() => {
    if ((destinations.length > 0 || routeCoords.length > 0) && mapRef.current) {
      const allPoints = [...destinations, ...routeCoords];
      if(allPoints.length > 0) {
        mapRef.current.fitToCoordinates(allPoints, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  }, [destinations, routeCoords]);

  const fetchJoinedEvents = async () => {
  if (!refreshing) setLoading(true); 
  const username = await AsyncStorage.getItem('username');
  console.log("Kullanıcı adına göre etkinlikler çekiliyor:", username);
  
  const result = await eventsApi.getEventsByUsername(username || '');
  
  // LOG: Gelen verinin yapısını terminalde mutlaka kontrol et
  if (result.error) {
    console.log("❌ API HATASI:", result.error);
  } else {
    console.log("✅ GELEN VERİ:", result.data);
    setEvents(result.data || []);
  }

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

  // --- YENİ: ETKİNLİKTEN AYRILMA (LEAVE EVENT) FONKSİYONU ---
  const handleLeaveEvent = async () => {
    if (!selectedEvent) return;

    const eventId = selectedEvent.id || selectedEvent.event_id || selectedEvent.eventId;
    const userId = await AsyncStorage.getItem('userId');

    if (!userId || !eventId) {
      Alert.alert("Hata", "Kullanıcı veya etkinlik bilgisi eksik.");
      return;
    }

    Alert.alert(
      "Etkinlikten Ayrıl",
      "Bu yürüyüşten ayrılmak istediğinize emin misiniz? Katılım kaydınız silinecektir.",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Ayrıl", 
          style: "destructive", 
          onPress: async () => {
            setLeaveLoading(true);
            const result = await eventsApi.leaveEvent(eventId);
            setLeaveLoading(false);

            if (result.data) {
              Alert.alert("Başarılı", "Etkinlikten ayrıldınız.");
              // Listeyi yerel olarak güncelle (silineni listeden at)
              setEvents(prev => prev.filter(e => (e.id || e.event_id || e.eventId) !== eventId));
              setSelectedEvent(null); // Modalı kapat
            } else {
              Alert.alert("Hata", result.error || "Ayrılma işlemi başarısız oldu.");
            }
          } 
        }
      ]
    );
  };

  const handleOpenInfo = async (event: any) => {
    setSelectedEvent(event);
    setInfoLoading(true);
    setRouteCoords([]); 
    setDestinations([]); 

    if (event.waypointsJson && event.routePolyline) {
        try {
            const parsedWaypoints = JSON.parse(event.waypointsJson);
            setDestinations(parsedWaypoints);
            const decodedPath = decodePolyline(event.routePolyline);
            setRouteCoords(decodedPath);
            setInfoLoading(false);
            return; 
        } catch (e) {
            console.log("Error parsing local data", e);
        }
    }

    const eventId = event.event_id || event.id || event.eventId;
    if (!eventId) {
      setInfoLoading(false);
      return;
    }

    const result = await eventsApi.getDestinationsForEvent(eventId);
    if (result.data) {
      const mappedDestinations = result.data.map((d: any) => ({
        ...d,
        latitude: d.latitude || d.lat || d.Lat,
        longitude: d.longitude || d.lng || d.Lng || d.Long,
      })).sort((a: any, b: any) => a.order_in_route - b.order_in_route);
      setDestinations(mappedDestinations);
    }
    setInfoLoading(false);
  };

  const origin = destinations.length > 0 ? { latitude: destinations[0].latitude, longitude: destinations[0].longitude } : null;
  const destination = destinations.length > 1 ? { latitude: destinations[destinations.length - 1].latitude, longitude: destinations[destinations.length - 1].longitude } : null;
  const waypoints = destinations.length > 2 ? destinations.slice(1, -1).map(d => ({ latitude: d.latitude, longitude: d.longitude })) : [];

  const renderEventCard = ({ item }: { item: any }) => (
  // DTO'daki 'eventId' alanını kullandığından emin ol
  <TouchableOpacity style={styles.card} onPress={() => handleOpenInfo(item)}>
    <View style={styles.cardTop}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <View style={styles.codeBadge}>
        {/* Hem camelCase hem snake_case kontrolü */}
        <Text style={styles.codeText}>{item.invitationCode || item.invitation_code}</Text>
      </View>
    </View>
    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
    <View style={styles.cardBottom}>
      <Ionicons name="calendar-outline" size={14} color="#888" />
      <Text style={styles.cardDate}>
        {new Date(item.startDate || item.start_date).toLocaleDateString('tr-TR')}
      </Text>
      {(item.totalDistanceMeters || item.total_distance_meters) && (
           <Text style={[styles.cardDate, { marginLeft: 10 }]}>
             {((item.totalDistanceMeters || item.total_distance_meters) / 1000).toFixed(2)} km
           </Text>
      )}
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
              <TouchableOpacity onPress={() => { setSelectedEvent(null); setDestinations([]); setRouteCoords([]); }}>
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
                      ref={mapRef}
                      style={styles.map}
                      initialRegion={{
                        latitude: 41.0082, longitude: 28.9784,
                        latitudeDelta: 0.05, longitudeDelta: 0.05
                      }}
                    >
                      {destinations.map((d, i) => (
                        <Marker key={i} coordinate={{latitude: d.latitude, longitude: d.longitude}}>
                           <View style={styles.markerBadge}><Text style={styles.markerText}>{i + 1}</Text></View>
                           <Ionicons name="location" size={26} color="#007AFF" />
                        </Marker>
                      ))}
                      {routeCoords.length > 0 ? (
                        <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#007AFF" />
                      ) : (
                        origin && destination && (
                          <MapViewDirections
                            origin={origin} destination={destination} waypoints={waypoints}
                            apikey={GOOGLE_MAPS_APIKEY} strokeWidth={4} strokeColor="#007AFF" mode="WALKING"
                          />
                        )
                      )}
                    </MapView>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Davet Kodu:</Text>
                    <Text style={styles.detailValue}>{selectedEvent?.invitationCode || selectedEvent?.invitation_code}</Text>
                  </View>
                  
                  {selectedEvent?.totalDistanceMeters && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Mesafe:</Text>
                        <Text style={styles.detailValue}>{(selectedEvent.totalDistanceMeters / 1000).toFixed(2)} km</Text>
                    </View>
                  )}

                  <Text style={styles.detailDesc}>{selectedEvent?.description}</Text>

                  {/* --- AYRILMA BUTONU --- */}
                  <TouchableOpacity 
                    style={[styles.leaveBtn, leaveLoading && { opacity: 0.7 }]} 
                    onPress={handleLeaveEvent}
                    disabled={leaveLoading}
                  >
                    {leaveLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="log-out-outline" size={20} color="#fff" />
                        <Text style={styles.leaveBtnText}>Etkinlikten Ayrıl</Text>
                      </>
                    )}
                  </TouchableOpacity>
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
  markerText: { fontSize: 10, fontWeight: 'bold', color: '#007AFF' },
  // YENİ BUTON STİLLERİ
  leaveBtn: { 
    backgroundColor: '#FF3B30', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 15, 
    borderRadius: 12, 
    marginTop: 25, 
    gap: 10,
    marginBottom: 30
  },
  leaveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});