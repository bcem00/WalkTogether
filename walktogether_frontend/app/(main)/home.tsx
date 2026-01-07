import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList,
  RefreshControl,
  StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import MapView from 'react-native-maps';
import { eventsApi } from '../apiClient';

export default function HomeScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  
  // --- YENİ: FİLTRELEME STATE'LERİ ---
  const [minDist, setMinDist] = useState('');
  const [maxDist, setMaxDist] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [infoLoading, setInfoLoading] = useState(false);
  const GOOGLE_MAPS_APIKEY = 'AIzaSyDFYEsvv3CUOa07f13Go1T2XKul0HbtfnU';

  const mapRef = useRef<MapView>(null);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

  const fetchEvents = async () => {
    if (!refreshing) setLoading(true);
    setIsFiltered(false); // Yenilendiğinde filtre durumunu sıfırla
    console.log("Upcoming etkinlikler çekiliyor...");
  
  // DEBUG İÇİN BU SATIRI EKLE:
  const result = await eventsApi.getUpcomingEvents();
  console.log("--- API RESPONSE DATA ---", JSON.stringify(result, null, 2));
    
    if (result.data) {
      setEvents(result.data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // --- YENİ: FİLTRELEME MANTIĞI ---
  const handleFilter = async () => {
    // Sayısal değerleri kontrol et
    const min = parseFloat(minDist) || 0;
    const max = parseFloat(maxDist) || 999;

    setLoading(true);
    const result = await eventsApi.filterEventsByDistance(min, max);
    
    if (result.data) {
      // API'den gelen farklı key yapılarını (event_title vb.) mevcut kart yapısına uyarla
      const mapped = result.data.map((item: any) => ({
        ...item,
        event_id: item.event_id || Math.random().toString(),
        title: item.event_title || item.title,
        start_date: item.event_start_date || item.start_date,
        // Backend'den km geliyorsa metreye çevir (karttaki bölme işlemi için)
        route_distance_meters: (item.route_distance || item.route_distance_meters / 1000) * 1000 
      }));
      
      setEvents(mapped);
      setIsFiltered(true);
    } else {
      Alert.alert("Hata", result.error || "Filtreleme yapılamadı.");
    }
    setLoading(false);
  };

  const clearFilter = () => {
    setMinDist('');
    setMaxDist('');
    fetchEvents();
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
    setSelectedEvent(event);
    setInfoLoading(true);
    const result = await eventsApi.getDestinationsForEvent(event.event_id);
    if (result.data) {
      const mapped = result.data.map((d: any) => ({
        ...d,
        latitude: d.latitude || d.lat || d.Lat,
        longitude: d.longitude || d.lng || d.Lng,
      })).sort((a: any, b: any) => a.order_in_route - b.order_in_route);
      setDestinations(mapped);
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
      <View style={styles.cardStats}>
         <View style={styles.statItem}>
            <Ionicons name="people" size={14} color="#007AFF" />
            <Text style={styles.statText}>{item.participant_count} Katılımcı</Text>
         </View>
         <View style={styles.statItem}>
            <Ionicons name="walk" size={14} color="#28a745" />
            <Text style={styles.statText}>
                {((item.route_distance_meters || item.route_distance * 1000) / 1000).toFixed(1)} km
            </Text>
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

      {/* YENİ: FİLTRELEME PANELİ */}
      <View style={styles.filterSection}>
        <TouchableOpacity 
          style={styles.filterToggle} 
          onPress={() => setIsFilterVisible(!isFilterVisible)}
        >
          <Ionicons name="options-outline" size={20} color="#333" />
          <Text style={styles.filterToggleText}>Mesafe Filtrele (KM)</Text>
          {isFiltered && <View style={styles.filterDot} />}
        </TouchableOpacity>

        {isFilterVisible && (
  <View style={styles.filterInputs}>
    <TextInput 
      style={styles.smallInput} 
      placeholder="Min km" // "Min" eklendi
      keyboardType="numeric"
      value={minDist}
      onChangeText={setMinDist}
    />
    <TextInput 
      style={styles.smallInput} 
      placeholder="Max km" // "Max" eklendi
      keyboardType="numeric"
      value={maxDist}
      onChangeText={setMaxDist}
    />
    <TouchableOpacity style={styles.applyBtn} onPress={handleFilter}>
      <Text style={styles.applyBtnText}>Uygula</Text>
    </TouchableOpacity>
    {isFiltered && (
      <TouchableOpacity onPress={clearFilter}>
        <Ionicons name="close-circle" size={24} color="#FF3B30" />
      </TouchableOpacity>
    )}
  </View>
)}
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader}>{isFiltered ? "Filtrelenmiş Sonuçlar" : "Keşfet"}</Text>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
               <Ionicons name="map-outline" size={50} color="#ccc" />
               <Text style={styles.emptyText}>Kriterlere uygun etkinlik bulunamadı.</Text>
            </View>
          }
        />
      )}

      {/* Modal Kısmı Aynı Kalıyor... */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  joinPanel: { flexDirection: 'row', padding: 20, paddingTop: 50, backgroundColor: '#fff', gap: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  joinInput: { flex: 1, backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10 },
  joinBtn: { backgroundColor: '#007AFF', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 10 },
  joinBtnText: { color: '#fff', fontWeight: 'bold' },
  // FİLTRELEME STİLLERİ
  filterSection: { paddingHorizontal: 20, marginTop: 15 },
  filterToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterToggleText: { fontSize: 14, fontWeight: '600', color: '#333' },
  filterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007AFF' },
  filterInputs: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10, backgroundColor: '#fff', padding: 10, borderRadius: 12, elevation: 1 },
  smallInput: { flex: 1, backgroundColor: '#f5f5f5', padding: 8, borderRadius: 8, fontSize: 13, borderWidth: 1, borderColor: '#eee' },
  applyBtn: { backgroundColor: '#333', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
  applyBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  // DİĞER STİLLER
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', padding: 20, paddingBottom: 0 },
  countBadge: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 18 },
  countText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
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