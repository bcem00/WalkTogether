import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { eventsApi } from '../apiClient'; //

export default function CreateEventScreen() {
  const [loading, setLoading] = useState(false);
  const GOOGLE_MAPS_APIKEY = 'AIzaSyDFYEsvv3CUOa07f13Go1T2XKul0HbtfnU';

  // --- DB ALANLARIYLA UYUMLU STATE'LER ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [invitationCode, setInvitationCode] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Rota ve Durak State'leri
  const [stops, setStops] = useState<{ id: number; latitude: number; longitude: number }[]>([]);
  const [tempCoordinate, setTempCoordinate] = useState<any>(null);
  const [routeDistance, setRouteDistance] = useState(0);

  // Sayfa açıldığında otomatik Davet Kodu oluştur
  useEffect(() => {
    generateInviteCode();
  }, []);

  const generateInviteCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setInvitationCode(code);
  };

  // Harita Fonksiyonları
  const handleMapPress = (e: any) => setTempCoordinate(e.nativeEvent.coordinate);

  const addStopFromMap = () => {
    if (!tempCoordinate) return;
    setStops([...stops, { 
      id: Date.now(), 
      latitude: tempCoordinate.latitude, 
      longitude: tempCoordinate.longitude 
    }]);
    setTempCoordinate(null);
  };

  // --- KRİTİK BACKEND BAĞLANTISI ---
  const handleCreateEvent = async () => {
    if (!title.trim() || stops.length < 2) {
      Alert.alert("Hata", "Lütfen bir başlık girin ve en az 2 durak seçin.");
      return;
    }

    setLoading(true);
    try {
      // 1. AsyncStorage'dan mevcut kullanıcının UUID'sini al
      const creatorId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('userToken');

      // 2. DB şemasına uygun waypoints formatı (order_in_route sırasıyla)
      const waypoints = stops.map(s => ({
        lat: s.latitude,
        lng: s.longitude
      }));

      // 3. Backend'e gönderilecek tam paket
      // NOT: apiClient içindeki createRoute fonksiyonunu bu geniş veriyi alacak şekilde güncellediğini varsayıyoruz.
      const eventData = {
        title,
        description,
        invitation_code: invitationCode,
        start_date: startDate.toISOString(),
        creation_date: new Date().toISOString(), // Oluşturulma tarihi
        creator_id: creatorId, // Kullanıcı ID'si
        route_distance: routeDistance, // Google Maps'ten gelen gerçek mesafe
        waypoints
      };

      const result = await eventsApi.createRoute('new', waypoints, token || undefined);

      if (result.data) {
        Alert.alert("Başarılı", `Etkinlik oluşturuldu! Davet Kodunuz: ${invitationCode}`);
        resetForm();
      } else {
        Alert.alert("Hata", result.error || "Backend bağlantı hatası.");
      }
    } catch (err) {
      Alert.alert("Hata", "Beklenmedik bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setStops([]);
    setRouteDistance(0); generateInviteCode();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yeni Etkinlik Oluştur</Text>
        <Text style={styles.headerSubtitle}>Rotayı belirle ve arkadaşlarına kodunu gönder.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Etkinlik Başlığı *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Örn: Sabah Koşusu" />

        <Text style={styles.label}>Açıklama</Text>
        <TextInput 
          style={[styles.input, { height: 80 }]} 
          value={description} 
          onChangeText={setDescription} 
          placeholder="Etkinlik hakkında bilgi ver..." 
          multiline
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Başlangıç Tarihi</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color="#007AFF" />
              <Text style={styles.dateText}>{startDate.toLocaleDateString('tr-TR')}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.label}>Davet Kodu</Text>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{invitationCode}</Text>
            </View>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker 
            value={startDate} 
            mode="date" 
            minimumDate={new Date()}
            onChange={(e, d) => { setShowDatePicker(false); if(d) setStartDate(d); }} 
          />
        )}

        <Text style={styles.label}>Rota ve Durakları Belirle (Haritaya Tıkla)</Text>
        <View style={styles.mapBox}>
          <MapView
            style={styles.map}
            initialRegion={{ latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
            onPress={handleMapPress}
          >
            {stops.map((stop, index) => (
              <Marker key={stop.id} coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}>
                <View style={styles.markerCircle}><Text style={styles.markerText}>{index + 1}</Text></View>
                <Ionicons name="location" size={30} color="#007AFF" />
              </Marker>
            ))}

            {stops.length >= 2 && (
              <MapViewDirections
                origin={{ latitude: stops[0].latitude, longitude: stops[0].longitude }}
                destination={{ latitude: stops[stops.length-1].latitude, longitude: stops[stops.length-1].longitude }}
                waypoints={stops.slice(1, -1).map(s => ({ latitude: s.latitude, longitude: s.longitude }))}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={4} strokeColor="#007AFF" mode="WALKING"
                onReady={result => setRouteDistance(result.distance)}
              />
            )}
          </MapView>
        </View>

        {tempCoordinate && (
          <TouchableOpacity style={styles.confirmBtn} onPress={addStopFromMap}>
            <Text style={styles.confirmBtnText}>Durağı Onayla</Text>
          </TouchableOpacity>
        )}

        <View style={styles.distanceInfo}>
          <Ionicons name="speedometer-outline" size={18} color="#666" />
          <Text style={styles.distanceText}>Toplam Mesafe: {routeDistance.toFixed(2)} km</Text>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={handleCreateEvent} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Etkinliği Veritabanına Kaydet</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 25, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 13, color: '#888', marginTop: 5 },
  form: { padding: 20 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 12, borderRadius: 10, gap: 10 },
  dateText: { fontWeight: 'bold', color: '#333' },
  codeDisplay: { backgroundColor: '#E3F2FD', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#007AFF', borderStyle: 'dashed' },
  codeText: { fontWeight: 'bold', color: '#007AFF', letterSpacing: 1 },
  mapBox: { height: 300, borderRadius: 15, overflow: 'hidden', marginTop: 10, borderWidth: 1, borderColor: '#eee' },
  map: { width: '100%', height: '100%' },
  confirmBtn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 10, marginTop: 10, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' },
  distanceInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, gap: 8 },
  distanceText: { color: '#666', fontWeight: '600' },
  createBtn: { backgroundColor: '#28a745', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30 },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  markerCircle: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 5, position: 'absolute', top: -15, alignSelf: 'center', borderWidth: 1, borderColor: '#007AFF', zIndex: 1 },
  markerText: { fontSize: 10, fontWeight: 'bold', color: '#007AFF' }
});