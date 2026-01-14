import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Clipboard, FlatList,
  Keyboard, Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity, View, useColorScheme
} from 'react-native';
import { Colors } from '../../constants/theme';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { eventsApi } from '../apiClient';


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
    
    
    points.push({ latitude: (lat / 1e5), longitude: (lng / 1e5) });
  }
  return points;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const [events, setEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  
  const [searchText, setSearchText] = useState('');
  const [minDist, setMinDist] = useState('');
  const [maxDist, setMaxDist] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [infoLoading, setInfoLoading] = useState(false);

  const mapRef = useRef<MapView>(null);
  const GOOGLE_MAPS_APIKEY = 'AIzaSyDFYEsvv3CUOa07f13Go1T2XKul0HbtfnU';
  const [routeCoords, setRouteCoords] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
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

  const fetchEvents = async () => {
    if (!refreshing) setLoading(true);
    setIsFiltered(false);
    setSearchText('');
    setMinDist('');
    setMaxDist('');
    
    const result = await eventsApi.getUpcomingEvents();
    if (result.data) {
      setEvents(result.data);
      setAllEvents(result.data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setEvents(allEvents);
    } else {
      const filtered = allEvents.filter(event => 
        event.title.toLowerCase().includes(text.toLowerCase())
      );
      setEvents(filtered);
    }
  };

  // --- 2. MESAFE FİLTRELEME (KM -> METRE DÖNÜŞÜMÜ DÜZELTİLDİ) ---
  const handleFilter = async () => {
    Keyboard.dismiss();
    // 1. Kullanıcıdan KM alıyoruz, API metre beklediği için 1000 ile çarpıp gönderiyoruz
    const minMeters = (parseFloat(minDist) || 0) * 1000;
    const maxMeters = (parseFloat(maxDist) || 999) * 1000;

    setLoading(true);
    const result = await eventsApi.filterEventsByDistance(minMeters, maxMeters);
    
    if (result.data) {
      const mapped = result.data.map((item: any) => ({
        ...item,
        event_id: item.event_id || Math.random().toString(),
        title: item.event_title || item.title,
        start_date: item.event_start_date || item.start_date,
        route_distance_meters: item.route_distance || item.route_distance_meters
      }));
      
      setEvents(mapped);
      setAllEvents(mapped);
      setIsFiltered(true);
    } else {
      Alert.alert("Hata", result.error || "Filtreleme yapılamadı.");
    }
    setLoading(false);
  };

  const clearFilter = () => {
    fetchEvents();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents();
  }, []);

  const handleQuickJoin = async () => {
    if (!inviteCodeInput) return;
    Keyboard.dismiss();
    const result = await eventsApi.joinEvent(inviteCodeInput);
    if (result.data) {
      Alert.alert("Başarılı", "Etkinliğe katıldınız!");
      setInviteCodeInput('');
      fetchEvents();
    } else {
      Alert.alert("Hata", result.error || "Kod geçersiz.");
    }
  };

  const handleJoinEventFromModal = async (inviteCode: string) => {
    if (!inviteCode) return;
    const result = await eventsApi.joinEvent(inviteCode);
    if (result.data) {
      Alert.alert("Başarılı", "Etkinliğe katıldınız!");
      setSelectedEvent(null);
      fetchEvents();
    } else {
      Alert.alert("Hata", result.error || "Kod geçersiz.");
    }
  };

  const copyToClipboard = (code: string) => {
    Clipboard.setString(code);
    Alert.alert("Kopyalandı", `Davet kodu kopyalandı: ${code}`);
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert(
      "Etkinliği Sil",
      "Bu etkinliği silmek istediğinizden emin misiniz?",
      [
        { text: "İptal", onPress: () => {} },
        {
          text: "Sil",
          onPress: async () => {
            setDeleting(eventId);
            const result = await eventsApi.deleteEvent(eventId);
            setDeleting(null);
            if (result.data) {
              Alert.alert("Başarılı", "Etkinlik silindi.");
              fetchEvents();
            } else {
              Alert.alert("Hata", result.error || "Etkinlik silinemedi.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleOpenInfo = async (event: any) => {
    setSelectedEvent(event);
    setInfoLoading(true);
    setRouteCoords([]); 
    setDestinations([]); 

    // Try to load route polyline and waypoints from event data first
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

  const renderEventCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} onPress={() => handleOpenInfo(item)}>
      <View style={styles.cardTop}>
        <Text style={[styles.cardTitle, { color: themeColors.text }]}>{item.title}</Text>
        <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
          <TouchableOpacity 
            style={[styles.codeBadge, { backgroundColor: themeColors.background, borderColor: themeColors.border }]} 
            onPress={() => copyToClipboard(item.invitation_code)}
            activeOpacity={0.7}
          >
            <Ionicons name="copy-outline" size={12} color={themeColors.tint} style={{marginRight: 4}} />
            <Text style={[styles.codeText, { color: themeColors.tint }]}>{item.invitation_code}</Text>
          </TouchableOpacity>
          {deleting === item.event_id ? (
            <ActivityIndicator size="small" color="#FF3B30" />
          ) : (
            <TouchableOpacity onPress={() => handleDeleteEvent(item.event_id)}>
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={[styles.cardDesc, { color: themeColors.lightText }]} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardStats}>
         <View style={styles.statItem}>
            <Ionicons name="people" size={14} color={themeColors.tint} />
            <Text style={[styles.statText, { color: themeColors.text }]}>{item.participant_count} Katılımcı</Text>
         </View>
         <View style={styles.statItem}>
            <Ionicons name="walk" size={14} color="#28a745" />
            <Text style={[styles.statText, { color: themeColors.text }]}>
                {/* Metreyi KM'ye çevirip gösteriyoruz */}
                {(item.route_distance_meters / 1000000).toFixed(1)} km
            </Text>
         </View>
      </View>
      <View style={styles.cardBottom}>
  <Ionicons name="calendar-outline" size={14} color={themeColors.placeholder} />
  <Text style={[styles.cardDate, { color: themeColors.lightText }]}>
    {new Date(item.start_date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
  </Text>
</View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.joinPanel, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder }]}>
        <TextInput 
          style={[styles.joinInput, { color: themeColors.text, backgroundColor: themeColors.background, borderColor: themeColors.inputBorder }]} 
          placeholder="Davet Kodu Gir..." 
          placeholderTextColor={themeColors.placeholder}
          value={inviteCodeInput}
          onChangeText={setInviteCodeInput}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={[styles.joinBtn, { backgroundColor: themeColors.buttonBackground }]} onPress={handleQuickJoin}>
          <Text style={[styles.joinBtnText, { color: themeColors.buttonText }]}>Katıl</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder }]}>
          <Ionicons name="search" size={18} color={themeColors.placeholder} style={{marginLeft: 12}} />
          <TextInput 
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Etkinlik başlığına göre ara..."
            placeholderTextColor={themeColors.placeholder}
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      <View style={styles.filterSection}>
        <TouchableOpacity 
          style={[styles.filterToggle, { backgroundColor: themeColors.inputBackground }]} 
          onPress={() => setIsFilterVisible(!isFilterVisible)}
        >
          <Ionicons name="options-outline" size={20} color={themeColors.text} />
          <Text style={[styles.filterToggleText, { color: themeColors.text }]}>Mesafe Filtrele</Text>
          {isFiltered && <View style={styles.filterDot} />}
        </TouchableOpacity>

        {isFilterVisible && (
          <View style={[styles.filterContainer, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}>
            <Text style={[styles.filterHint, { color: themeColors.text }]}>Mesafe aralığını KM cinsinden giriniz:</Text>
            <View style={styles.filterInputs}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Min (KM)</Text>
                <TextInput 
                  style={styles.smallInput} 
                  placeholder="0" 
                  keyboardType="numeric" 
                  value={minDist} 
                  onChangeText={setMinDist} 
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Max (KM)</Text>
                <TextInput 
                  style={styles.smallInput} 
                  placeholder="99" 
                  keyboardType="numeric" 
                  value={maxDist} 
                  onChangeText={setMaxDist} 
                />
              </View>
              <TouchableOpacity style={styles.applyBtn} onPress={handleFilter}>
                <Text style={styles.applyBtnText}>Uygula</Text>
              </TouchableOpacity>
              {isFiltered && (
                <TouchableOpacity onPress={clearFilter}>
                  <Ionicons name="close-circle" size={28} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.sectionHeader, { color: themeColors.text }]}>{isFiltered ? "Filtrelenmiş Sonuçlar" : "Keşfet"}</Text>
        {!loading && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{events.length} Etkinlik</Text>
          </View>
        )}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator color="#007AFF" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={item => (item.event_id || Math.random()).toString()}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
               <Ionicons name="map-outline" size={50} color="#ccc" />
               <Text style={styles.emptyText}>Sonuç bulunamadı.</Text>
            </View>
          }
        />
      )}

      <Modal visible={!!selectedEvent} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.45)' }]}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}>            
            <View style={[styles.modalHeader, { backgroundColor: themeColors.inputBackground, borderBottomColor: themeColors.border, borderBottomWidth: 1 }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>{selectedEvent?.title}</Text>
              <TouchableOpacity onPress={() => { setSelectedEvent(null); setDestinations([]); setRouteCoords([]); }}>
                <Ionicons name="close-circle" size={32} color={themeColors.placeholder} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {infoLoading ? (
                <ActivityIndicator color={themeColors.tint} style={{margin: 20}} />
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
                           <View style={[styles.markerBadge, { backgroundColor: themeColors.background, borderColor: themeColors.tint }]}><Text style={[styles.markerText, { color: themeColors.tint }]}>{i + 1}</Text></View>
                           <Ionicons name="location" size={26} color={themeColors.tint} />
                        </Marker>
                      ))}
                      {routeCoords.length > 0 ? (
                        <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor={themeColors.tint} />
                      ) : (
                        destinations.length > 1 && (
                          <MapViewDirections
                            origin={{latitude: destinations[0].latitude, longitude: destinations[0].longitude}} 
                            destination={{latitude: destinations[destinations.length-1].latitude, longitude: destinations[destinations.length-1].longitude}} 
                            waypoints={destinations.slice(1, -1).map(d => ({latitude: d.latitude, longitude: d.longitude}))}
                            apikey={GOOGLE_MAPS_APIKEY} strokeWidth={4} strokeColor={themeColors.tint} mode="WALKING"
                          />
                        )
                      )}
                    </MapView>
                  </View>
                  
                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.lightText }]}>Tarih ve Saat:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>
                      {new Date(selectedEvent?.start_date).toLocaleString('tr-TR', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </Text>
                  </View>

                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.lightText }]}>Davet Kodu:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedEvent?.invitation_code}</Text>
                  </View>
                  
                  {selectedEvent?.route_distance_meters && (
                    <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                        <Text style={[styles.detailLabel, { color: themeColors.lightText }]}>Mesafe:</Text>
                        <Text style={[styles.detailValue, { color: themeColors.text }]}>{(selectedEvent.route_distance_meters / 1000000).toFixed(2)} km</Text>
                    </View>
                  )}

                  <View style={[styles.detailRow, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.detailLabel, { color: themeColors.lightText }]}>Katılımcılar:</Text>
                    <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedEvent?.participant_count}</Text>
                  </View>

                  <Text style={[styles.detailDesc, { color: themeColors.lightText }]}>{selectedEvent?.description}</Text>

                  <View style={{gap: 10, marginBottom: 30, marginTop: 20}}>
                    <TouchableOpacity 
                      style={[styles.joinBtn2, { backgroundColor: themeColors.buttonBackground }]}
                      onPress={() => handleJoinEventFromModal(selectedEvent?.invitation_code)}
                    >
                      <Ionicons name="log-in-outline" size={20} color={themeColors.buttonText} />
                      <Text style={[styles.joinBtnText2, { color: themeColors.buttonText }]}>Etkinliğe Katıl</Text>
                    </TouchableOpacity>
                  </View>
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
  joinPanel: { flexDirection: 'row', padding: 20, paddingTop: 20, backgroundColor: '#fff', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  joinInput: { flex: 1, backgroundColor: '#f0f0f0', padding: 8, borderRadius: 10 },
  joinBtn: { backgroundColor: '#007AFF', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 10 },
  joinBtnText: { color: '#fff', fontWeight: 'bold' },
  searchSection: { paddingHorizontal: 20, marginTop: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', elevation: 2, height: 45 },
  searchInput: { flex: 1, paddingLeft: 10, fontSize: 14, color: '#333' },
  filterSection: { paddingHorizontal: 20, marginTop: 15 },
  filterToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  filterToggleText: { fontSize: 14, fontWeight: '600', color: '#333' },
  filterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007AFF' },
  filterContainer: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginTop: 10, elevation: 1 },
  filterHint: { fontSize: 11, color: '#888', marginBottom: 8 },
  filterInputs: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  inputWrapper: { flex: 1 },
  inputLabel: { fontSize: 10, color: '#555', marginBottom: 4, fontWeight: '600' },
  smallInput: { backgroundColor: '#f5f5f5', padding: 8, borderRadius: 8, fontSize: 13, borderWidth: 1, borderColor: '#eee' },
  applyBtn: { backgroundColor: '#333', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, marginBottom: 2 },
  applyBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20, marginTop:0 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', padding: 10, paddingBottom: 0 },
  countBadge: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 18 },
  countText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 15, padding: 15, borderRadius: 15, elevation: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 17, fontWeight: 'bold' },
  codeBadge: { backgroundColor: '#E3F2FD', padding: 6, borderRadius: 6, flexDirection: 'row', alignItems: 'center' },
  codeText: { color: '#007AFF', fontSize: 11, fontWeight: 'bold' },
  cardDesc: { color: '#666', fontSize: 14, marginBottom: 12 },
  cardStats: { flexDirection: 'row', gap: 15, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f9f9f9', paddingBottom: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#555', fontWeight: '500' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardDate: { fontSize: 12, color: '#888' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { textAlign: 'center', marginTop: 15, color: '#999', fontSize: 14 },
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
  markerBadge: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 5, borderWidth: 1, borderColor: '#007AFF', position: 'absolute', top: -15, alignSelf: 'center', zIndex: 1 },
  markerText: { fontSize: 10, fontWeight: 'bold', color: '#007AFF' },
  joinBtn2: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 10,
    marginBottom: 30,
  },
  joinBtnText2: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});