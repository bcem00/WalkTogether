import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // Eklendi
import React, { useCallback, useRef, useState } from 'react'; // useRef eklendi
import {
  ActivityIndicator, Alert, FlatList, Modal,
  RefreshControl, // Eklendi
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { eventsApi } from '../apiClient';

export default function HomeScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Eklendi
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [infoLoading, setInfoLoading] = useState(false);
  const GOOGLE_MAPS_APIKEY = 'AIzaSyDFYEsvv3CUOa07f13Go1T2XKul0HbtfnU';

  const mapRef = useRef<MapView>(null); // Harita kontrolü için ref

  // Sayfaya her geri dönüldüğünde listeyi tazele
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

  const fetchEvents = async () => {
    if (!refreshing) setLoading(true);
    console.log("Upcoming etkinlikler çekiliyor...");
    const result = await eventsApi.getUpcomingEvents();
    
    if (result.data) {
      console.log("Gelen etkinlik sayısı:", result.data.length);
      setEvents(result.data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents();
  }, []);

  const handleQuickJoin = async () => {
    if (!inviteCodeInput) return;
    const userId = await AsyncStorage.getItem('userId');
    
    const result = await eventsApi.joinEvent(userId || '', inviteCodeInput);
    if (result.data) {
      Alert.alert("Başarılı", "Etkinliğe katıldınız!");
      setInviteCodeInput('');
      fetchEvents();
    } else {
      Alert.alert("Hata", result.error || "Kod geçersiz veya zaten katıldınız.");
    }
  };

  const handleOpenInfo = async (event: any) => {
    console.log("Seçilen Event ID:", event.event_id);
    setSelectedEvent(event);
    setInfoLoading(true);
    
    const result = await eventsApi.getDestinationsForEvent(event.event_id);
    if (result.data) {
      // Koordinat isimlerini garantiye al ve sırala
      const mapped = result.data.map((d: any) => ({
        ...d,
        latitude: d.latitude || d.lat || d.Lat,
        longitude: d.longitude || d.lng || d.Lng,
      })).sort((a: any, b: any) => a.order_in_route - b.order_in_route);
      
      setDestinations(mapped);

      // Haritayı duraklara göre odakla
      if (mapped.length > 0 && mapRef.current) {
        mapRef.current.fitToCoordinates(mapped, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
    setInfoLoading(false);
  };

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
      
      {/* UpcomingEvent DTO'sundan gelen ek bilgiler */}
      <View style={styles.cardStats}>
         <View style={styles.statItem}>
            <Ionicons name="people" size={14} color="#007AFF" />
            <Text style={styles.statText}>{item.participant_count} Katılımcı</Text>
         </View>
         <View style={styles.statItem}>
            <Ionicons name="walk" size={14} color="#28a745" />
            <Text style={styles.statText}>{(item.route_distance_meters / 1000).toFixed(1)} km</Text>
         </View>
      </View>

      <View style={styles.cardBottom}>
        <Ionicons name="calendar-outline" size={14} color="#888" />
        <Text style={styles.cardDate}>{new Date(item.start_date).toLocaleDateString('tr-TR')}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.joinPanel}>
        <TextInput 
          style={styles.joinInput} 
          placeholder="Davet Kodu Gir..." 
          value={inviteCodeInput}
          onChangeText={setInviteCodeInput}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.joinBtn} onPress={handleQuickJoin}>
          <Text style={styles.joinBtnText}>Katıl</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Keşfet</Text>

      {loading && !refreshing ? (
        <ActivityIndicator color="#007AFF" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={item => item.event_id.toString()}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
               <Ionicons name="map-outline" size={50} color="#ccc" />
               <Text style={styles.emptyText}>Şu an aktif etkinlik bulunmuyor.</Text>
            </View>
          }
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
                      ref={mapRef}
                      style={styles.map}
                      initialRegion={{
                        latitude: 41.0082, longitude: 28.9784,
                        latitudeDelta: 0.05, longitudeDelta: 0.05
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
  joinPanel: { flexDirection: 'row', padding: 20, paddingTop: 50, backgroundColor: '#fff', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  joinInput: { flex: 1, backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10 },
  joinBtn: { backgroundColor: '#007AFF', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 10 },
  joinBtnText: { color: '#fff', fontWeight: 'bold' },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', padding: 20, paddingBottom: 0 },
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 15, padding: 15, borderRadius: 15, elevation: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 17, fontWeight: 'bold' },
  codeBadge: { backgroundColor: '#E3F2FD', padding: 4, borderRadius: 6 },
  codeText: { color: '#007AFF', fontSize: 11, fontWeight: 'bold' },
  cardDesc: { color: '#666', fontSize: 14, marginBottom: 12 },
  cardStats: { flexDirection: 'row', gap: 15, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f9f9f9', paddingBottom: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#555', fontWeight: '500' },
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
  detailDesc: { color: '#444', lineHeight: 22, fontSize: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { textAlign: 'center', marginTop: 15, color: '#999', fontSize: 14 },
  markerBadge: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 5, borderWidth: 1, borderColor: '#007AFF', position: 'absolute', top: -15, alignSelf: 'center', zIndex: 1 },
  markerText: { fontSize: 10, fontWeight: 'bold', color: '#007AFF' }
});