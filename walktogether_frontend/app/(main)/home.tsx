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

// Helper to decode Google Polyline
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
  const [totalCount, setTotalCount] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);

  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [searchText, setSearchText] = useState('');
  const [minDist, setMinDist] = useState('');
  const [maxDist, setMaxDist] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [infoLoading, setInfoLoading] = useState(false);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);

  const mapRef = useRef<MapView>(null);
  const GOOGLE_MAPS_APIKEY = 'AIzaSyDFYEsvv3CUOa07f13Go1T2XKul0HbtfnU';

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

  // Harita odaklama mantığı (Destinations veya RouteCoords değişince tetiklenir)
  useEffect(() => {
    if (selectedEvent && (destinations.length > 0 || routeCoords.length > 0) && mapRef.current) {
      const allPoints = [...destinations, ...routeCoords];
      if(allPoints.length > 0) {
        // Küçük bir gecikme ile haritayı sığdırır (Modal animasyonu bitmesi için)
        setTimeout(() => {
            mapRef.current?.fitToCoordinates(allPoints, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }, 500);
      }
    }
  }, [destinations, routeCoords, selectedEvent]);

  const fetchEvents = async () => {
    if (!refreshing) setLoading(true);
    const [eventsResult, countResult] = await Promise.all([
      eventsApi.getUpcomingEvents(),
      eventsApi.getTotalEventCount()
    ]);

    if (eventsResult.data) {
      setEvents(eventsResult.data);
      setAllEvents(eventsResult.data);
    }
    if (countResult.data) {
      setTotalCount(countResult.data.totalEventCount);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleJoin = async (inviteCode: string) => {
    if (!inviteCode) return;
    Keyboard.dismiss();
    setJoinLoading(inviteCode);
    const result = await eventsApi.joinEvent(inviteCode);
    setJoinLoading(null);

    if (result.data) {
      Alert.alert("Başarılı", "Etkinliğe katıldınız!");
      setInviteCodeInput('');
      setSelectedEvent(null);
      fetchEvents();
    } else {
      Alert.alert("Hata", result.error || "Kod geçersiz veya zaten katıldınız.");
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setEvents(allEvents);
      setIsFiltered(false);
    } else {
      const filtered = allEvents.filter(event => 
        event.title.toLowerCase().includes(text.toLowerCase())
      );
      setEvents(filtered);
      setIsFiltered(true);
    }
  };

  const handleFilter = async () => {
    Keyboard.dismiss();
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
    }
    setLoading(false);
  };

  const clearFilter = () => fetchEvents();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents();
  }, []);

  // --- SORUNUN ÇÖZÜMÜ BURADA ---
  const handleOpenInfo = async (event: any) => {
    setSelectedEvent(event);
    setInfoLoading(true);
    setRouteCoords([]); 
    setDestinations([]); 

    // 1. Önce event nesnesinin kendisinde veri var mı diye bakarız (Listeden gelen)
    // Backend'den gelen veri yapısı bazen 'route_polyline' bazen 'routePolyline' olabilir, her ihtimali kontrol et.
    const polylineString = event.routePolyline || event.route_polyline; 
    const waypointsData = event.waypointsJson || event.waypoints_json;

    if (waypointsData && polylineString) {
      try {
        const parsedWaypoints = typeof waypointsData === 'string' ? JSON.parse(waypointsData) : waypointsData;
        setDestinations(parsedWaypoints);
        const decodedPath = decodePolyline(polylineString);
        setRouteCoords(decodedPath);
        setInfoLoading(false);
        return; // Veri varsa API'ye gitmeye gerek yok
      } catch (e) { 
        console.log("Error parsing local data", e); 
      }
    }

    // 2. Eğer yerel veri yoksa API'den çekeriz
    const eventId = event.event_id || event.id || event.eventId;
    if (!eventId) {
        setInfoLoading(false);
        return;
    }

    // Hem rotayı hem de noktaları çekmeye çalışalım (Eğer API destekliyorsa)
    // Şimdilik sadece noktaları çekiyoruz, eğer rota API'den gelmiyorsa MapViewDirections çizecek.
    const result = await eventsApi.getDestinationsForEvent(eventId);
    
    if (result.data) {
      const mapped = result.data.map((d: any) => ({
        ...d,
        latitude: d.latitude || d.lat,
        longitude: d.longitude || d.lng,
      })).sort((a: any, b: any) => a.order_in_route - b.order_in_route);
      
      setDestinations(mapped);
      
      // Eğer API'den Polyline gelmediyse ve elimizde noktalar varsa, routeCoords boş kalır
      // Bu durumda MapViewDirections devreye girecek (aşağıdaki return bloğunda)
    }
    setInfoLoading(false);
  };

  const renderEventCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]} 
      onPress={() => handleOpenInfo(item)}
    >
      <View style={styles.cardTop}>
        <Text style={[styles.cardTitle, { color: themeColors.text }]}>{item.title}</Text>
        <TouchableOpacity 
          style={[styles.codeBadge, { backgroundColor: themeColors.background, borderColor: themeColors.border }]} 
          onPress={() => { Clipboard.setString(item.invitation_code); Alert.alert("Kopyalandı"); }}
        >
          <Ionicons name="copy-outline" size={12} color={themeColors.tint} style={{marginRight: 4}} />
          <Text style={[styles.codeText, { color: themeColors.tint }]}>{item.invitation_code}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.cardDesc, { color: themeColors.lightText }]} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.cardStats}>
         <View style={styles.statItem}>
            <Ionicons name="people" size={14} color={themeColors.tint} />
            <Text style={[styles.statText, { color: themeColors.text }]}>{item.participant_count} Kişi</Text>
         </View>
         <View style={styles.statItem}>
            <Ionicons name="walk" size={14} color="#28a745" />
            <Text style={[styles.statText, { color: themeColors.text }]}>
                {(item.route_distance_meters / 1000).toFixed(1)} km
            </Text>
         </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.dateInfo}>
          <Ionicons name="calendar-outline" size={14} color={themeColors.placeholder} />
          <Text style={[styles.cardDate, { color: themeColors.lightText }]}>
            {new Date(item.start_date).toLocaleDateString('tr-TR')}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.inlineJoinBtn, { backgroundColor: themeColors.buttonBackground }]} 
          onPress={() => handleJoin(item.invitation_code)}
          disabled={joinLoading === item.invitation_code}
        >
          {joinLoading === item.invitation_code ? (
            <ActivityIndicator size="small" color={themeColors.buttonText} />
          ) : (
            <Text style={[styles.inlineJoinBtnText, { color: themeColors.buttonText }]}>Katıl</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.joinPanel, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder }]}>
        <TextInput 
          style={[styles.joinInput, { color: themeColors.text, backgroundColor: themeColors.background, borderColor: themeColors.inputBorder }]} 
          placeholder="Hızlı Katıl (Kod)" 
          placeholderTextColor={themeColors.placeholder}
          value={inviteCodeInput}
          onChangeText={setInviteCodeInput}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={[styles.joinBtn, { backgroundColor: themeColors.buttonBackground }]} onPress={() => handleJoin(inviteCodeInput)}>
          <Text style={[styles.joinBtnText, { color: themeColors.buttonText }]}>Katıl</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder }]}>
          <Ionicons name="search" size={18} color={themeColors.placeholder} style={{marginLeft: 12}} />
          <TextInput 
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Etkinlik ara..."
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
            <View style={styles.filterInputs}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Min (m)</Text>
                <TextInput style={styles.smallInput} keyboardType="numeric" value={minDist} onChangeText={setMinDist} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Max (m)</Text>
                <TextInput style={styles.smallInput} keyboardType="numeric" value={maxDist} onChangeText={setMaxDist} />
              </View>
              <TouchableOpacity style={styles.applyBtn} onPress={handleFilter}>
                <Text style={styles.applyBtnText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.sectionHeader, { color: themeColors.text }]}>
          {isFiltered ? "Sonuçlar" : "Keşfet"}
        </Text>
      </View>

      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={item => (item.event_id || Math.random()).toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]} />}
        ListFooterComponent={
          !loading && events.length > 0 ? (
            <View style={styles.listFooter}>
              <View style={styles.footerLine} />
              <Text style={[styles.footerText, { color: themeColors.placeholder }]}>
                {isFiltered 
                   ? `${events.length} sonuç bulundu.` 
                   : `${totalCount} Etkinlik Şuana Kadar Oluşturuldu`}
              </Text>
              <Ionicons name="checkmark-done" size={16} color={themeColors.placeholder} />
            </View>
          ) : null
        }
      />

      <Modal visible={!!selectedEvent} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.inputBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>{selectedEvent?.title}</Text>
              <TouchableOpacity onPress={() => { setSelectedEvent(null); setDestinations([]); setRouteCoords([]); }}>
                <Ionicons name="close-circle" size={32} color={themeColors.placeholder} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.mapBox}>
                <MapView ref={mapRef} style={styles.map} initialRegion={{ latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
                  {destinations.map((d, i) => (
                    <Marker key={i} coordinate={{latitude: d.latitude, longitude: d.longitude}}>
                       <Ionicons name="location" size={26} color={themeColors.tint} />
                    </Marker>
                  ))}
                  
                  {/* ÖNCE POLYLINE (ÇİZİLMİŞ ROTA) VAR MI DİYE BAKARIZ */}
                  {routeCoords.length > 0 ? (
                    <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor={themeColors.tint} />
                  ) : (
                    /* YOKSA VE 1'DEN FAZLA NOKTA VARSA API (DIRECTIONS) İLE ÇİZERİZ */
                    destinations.length > 1 && (
                      <MapViewDirections
                        origin={{latitude: destinations[0].latitude, longitude: destinations[0].longitude}} 
                        destination={{latitude: destinations[destinations.length-1].latitude, longitude: destinations[destinations.length-1].longitude}} 
                        waypoints={destinations.slice(1, -1).map(d => ({latitude: d.latitude, longitude: d.longitude}))}
                        apikey={GOOGLE_MAPS_APIKEY} 
                        strokeWidth={4} 
                        strokeColor={themeColors.tint} 
                        mode="WALKING"
                      />
                    )
                  )}
                </MapView>
              </View>
              <View style={styles.modalDetailContainer}>
                <View style={styles.detailRow}>
                   <Text style={[styles.detailLabel, { color: themeColors.lightText }]}>Tarih & Saat:</Text>
                   <Text style={[styles.detailValue, { color: themeColors.text }]}>
                    {new Date(selectedEvent?.start_date).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                   </Text>
                </View>
                <View style={styles.detailRow}>
                   <Text style={[styles.detailLabel, { color: themeColors.lightText }]}>Mesafe:</Text>
                   <Text style={[styles.detailValue, { color: themeColors.text }]}>{(selectedEvent?.route_distance_meters / 1000000).toFixed(2)} km</Text>
                </View>
                <View style={styles.detailRow}>
                   <Text style={[styles.detailLabel, { color: themeColors.lightText }]}>Davet Kodu:</Text>
                   <Text style={[styles.detailValue, { color: themeColors.text }]}>{selectedEvent?.invitation_code}</Text>
                </View>
                <Text style={[styles.detailDesc, { color: themeColors.text, marginTop: 15 }]}>{selectedEvent?.description}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.modalJoinBtn, { backgroundColor: themeColors.buttonBackground }]}
                onPress={() => handleJoin(selectedEvent?.invitation_code)}
              >
                <Ionicons name="log-in-outline" size={24} color={themeColors.buttonText} />
                <Text style={[styles.modalJoinBtnText, { color: themeColors.buttonText }]}>Bu Etkinliğe Katıl</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  joinPanel: { flexDirection: 'row', padding: 15, paddingTop: 10, gap: 10, borderBottomWidth: 1 },
  joinInput: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1 },
  joinBtn: { paddingHorizontal: 20, justifyContent: 'center', borderRadius: 10 },
  joinBtnText: { fontWeight: 'bold' },
  searchSection: { paddingHorizontal: 20, marginTop: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, height: 45 },
  searchInput: { flex: 1, paddingLeft: 10 },
  filterSection: { paddingHorizontal: 20, marginTop: 10 },
  filterToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12 },
  filterToggleText: { fontSize: 14, fontWeight: '600' },
  filterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007AFF' },
  filterContainer: { padding: 12, borderRadius: 12, marginTop: 10, borderWidth: 1 },
  filterInputs: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  inputWrapper: { flex: 1 },
  inputLabel: { fontSize: 10, marginBottom: 4, fontWeight: '600' },
  smallInput: { backgroundColor: '#f5f5f5', padding: 8, borderRadius: 8, fontSize: 13, borderWidth: 1, borderColor: '#eee' },
  applyBtn: { backgroundColor: '#333', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
  applyBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  headerRow: { paddingHorizontal: 20, marginTop: 5 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', paddingVertical: 10 },
  
  listFooter: { 
    padding: 30, 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 10
  },
  footerLine: {
    width: '40%',
    height: 1,
    backgroundColor: '#eee'
  },
  footerText: { 
    fontSize: 13, 
    fontStyle: 'italic',
    textAlign: 'center'
  },

  card: { marginHorizontal: 20, marginTop: 15, padding: 15, borderRadius: 15, elevation: 3, borderWidth: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', flex: 1 },
  codeBadge: { padding: 5, borderRadius: 6, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  codeText: { fontSize: 11, fontWeight: 'bold' },
  cardDesc: { fontSize: 13, marginBottom: 12 },
  cardStats: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '500' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  dateInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardDate: { fontSize: 12 },
  inlineJoinBtn: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 8 },
  inlineJoinBtnText: { fontSize: 13, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '85%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  mapBox: { height: 200, borderRadius: 15, overflow: 'hidden', marginBottom: 15 },
  map: { width: '100%', height: '100%' },
  modalDetailContainer: { marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: 'bold' },
  detailDesc: { fontSize: 14, lineHeight: 20 },
  modalJoinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, gap: 10, marginBottom: 20 },
  modalJoinBtnText: { fontSize: 16, fontWeight: 'bold' },
});