import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Clipboard, FlatList,
  Keyboard,
  RefreshControl,
  StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import MapView from 'react-native-maps';
import { eventsApi } from '../apiClient';

export default function HomeScreen() {
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

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [infoLoading, setInfoLoading] = useState(false);

  const mapRef = useRef<MapView>(null);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

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
        // DÜZELTME: Backend zaten METRE gönderdiği için burada tekrar 1000 ile ÇARPMIYORUZ.
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

  const copyToClipboard = (code: string) => {
    Clipboard.setString(code);
    Alert.alert("Kopyalandı", `Davet kodu kopyalandı: ${code}`);
  };

  const renderEventCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => {}}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <TouchableOpacity 
          style={styles.codeBadge} 
          onPress={() => copyToClipboard(item.invitation_code)}
          activeOpacity={0.7}
        >
          <Ionicons name="copy-outline" size={12} color="#007AFF" style={{marginRight: 4}} />
          <Text style={styles.codeText}>{item.invitation_code}</Text>
        </TouchableOpacity>
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
                {/* Metreyi KM'ye çevirip gösteriyoruz */}
                {(item.route_distance_meters / 1000).toFixed(1)} km
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

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#888" style={{marginLeft: 12}} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Etkinlik başlığına göre ara..."
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      <View style={styles.filterSection}>
        <TouchableOpacity 
          style={styles.filterToggle} 
          onPress={() => setIsFilterVisible(!isFilterVisible)}
        >
          <Ionicons name="options-outline" size={20} color="#333" />
          <Text style={styles.filterToggleText}>Mesafe Filtrele</Text>
          {isFiltered && <View style={styles.filterDot} />}
        </TouchableOpacity>

        {isFilterVisible && (
          <View style={styles.filterContainer}>
            <Text style={styles.filterHint}>Mesafe aralığını KM cinsinden giriniz:</Text>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
               <Ionicons name="map-outline" size={50} color="#ccc" />
               <Text style={styles.emptyText}>Sonuç bulunamadı.</Text>
            </View>
          }
        />
      )}
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
  filterToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  emptyText: { textAlign: 'center', marginTop: 15, color: '#999', fontSize: 14 }
});