import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { eventsApi } from '../apiClient';

export default function CreateEventScreen() {
  const [loading, setLoading] = useState(false);
  const GOOGLE_MAPS_APIKEY = 'AIzaSyDFYEsvv3CUOa07f13Go1T2XKul0HbtfnU';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  
  // Selector states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false); 
  
  const [stops, setStops] = useState<{ id: number; latitude: number; longitude: number }[]>([]);
  const [tempCoordinate, setTempCoordinate] = useState<any>(null);
  const [routeDistance, setRouteDistance] = useState(0);

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

  const moveStop = (index: number, direction: 'up' | 'down') => {
    const newStops = [...stops];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stops.length) return;

    [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];
    setStops(newStops);
  };

  const removeStop = (index: number) => {
    const newStops = stops.filter((_, i) => i !== index);
    setStops(newStops);
  };

  const handleCreateEvent = async () => {
    if (!title.trim() || stops.length < 2) {
      Alert.alert("Hata", "Lütfen bir başlık girin ve en az 2 durak seçin.");
      return;
    }

    setLoading(true);

    try {
      const creatorId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('userToken');

      if (!creatorId || !token) {
        Alert.alert("Hata", "Kullanıcı girişi yapılmamış. Lütfen giriş yapın.");
        return;
      }



      const eventData = {
        CreatorId: creatorId,
        Title: title,
        Description: description,
        StartDate: startDate.toISOString(),
      };

      
      const createResult = await eventsApi.createEvent(eventData);

      if (!createResult.data) {
        Alert.alert("Hata", createResult.error || "Etkinlik oluşturulamadı.");
        return;
      }

      const eventId = createResult.data.eventId;
      
      const backendGeneratedCode = createResult.data.invitationCode;

      const waypoints = stops.map(s => ({
        latitude: s.latitude,
        longitude: s.longitude
      }));

      const routeResult = await eventsApi.createRoute(eventId, waypoints, token || undefined);

      if (routeResult.data) {
        
        Alert.alert(
          "Başarılı", 
          `Etkinlik oluşturuldu!\n\nDavet Kodunuz: ${backendGeneratedCode}`,
          [
            { 
              text: "Tamam", 
              onPress: () => resetForm() 
            }
          ]
        );
      } else {
        Alert.alert("Hata", routeResult.error || "Rota kaydedilemedi.");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Hata", "Beklenmedik bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setStops([]);
    setRouteDistance(0); setStartDate(new Date()); 
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
            <Text style={styles.label}>Tarih</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color="#007AFF" />
              <Text style={styles.dateText}>{startDate.toLocaleDateString('tr-TR')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.label}>Saat</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={18} color="#007AFF" />
              <Text style={styles.dateText}>
                {startDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker 
            value={startDate} 
            mode="date" 
            minimumDate={new Date()}
            onChange={(e, d) => { 
                setShowDatePicker(false); 
                if(d) {
                    const nextDate = new Date(startDate);
                    nextDate.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                    setStartDate(nextDate);
                }
            }} 
          />
        )}

        {showTimePicker && (
          <DateTimePicker 
            value={startDate} 
            mode="time" 
            is24Hour={true}
            onChange={(e, d) => { 
                setShowTimePicker(false); 
                if(d) {
                    const nextDate = new Date(startDate);
                    nextDate.setHours(d.getHours(), d.getMinutes());
                    setStartDate(nextDate);
                }
            }} 
          />
        )}

        {/* The Invitation Code View has been removed from here */}

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

            {tempCoordinate && (
              <Marker coordinate={tempCoordinate}>
                <Ionicons name="location" size={35} color="#FF9500" />
                <View style={[styles.markerCircle, {borderColor: '#FF9500'}]}><Text style={[styles.markerText, {color: '#FF9500'}]}>?</Text></View>
              </Marker>
            )}

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
            <Text style={styles.confirmBtnText}>Seçilen Konumu Durak Olarak Ekle</Text>
          </TouchableOpacity>
        )}

        {stops.length > 0 && (
          <View style={styles.stopListContainer}>
            <Text style={styles.label}>Durak Sıralaması</Text>
            {stops.map((stop, index) => (
              <View key={stop.id} style={styles.stopItem}>
                <Text style={styles.stopNumber}>{index + 1}</Text>
                <Text style={styles.stopCoords} numberOfLines={1}>
                  {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                </Text>
                <View style={styles.stopActions}>
                  <TouchableOpacity onPress={() => moveStop(index, 'up')} disabled={index === 0}>
                    <Ionicons name="arrow-up-circle" size={24} color={index === 0 ? "#ccc" : "#007AFF"} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => moveStop(index, 'down')} disabled={index === stops.length - 1}>
                    <Ionicons name="arrow-down-circle" size={24} color={index === stops.length - 1 ? "#ccc" : "#007AFF"} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeStop(index)}>
                    <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
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
  dateText: { fontWeight: 'bold', color: '#333', fontSize: 14 },
  mapBox: { height: 300, borderRadius: 15, overflow: 'hidden', marginTop: 10, borderWidth: 1, borderColor: '#eee' },
  map: { width: '100%', height: '100%' },
  confirmBtn: { backgroundColor: '#FF9500', padding: 12, borderRadius: 10, marginTop: 10, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' },
  distanceInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, gap: 8 },
  distanceText: { color: '#666', fontWeight: '600' },
  createBtn: { backgroundColor: '#28a745', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30 },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  markerCircle: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 5, position: 'absolute', top: -15, alignSelf: 'center', borderWidth: 1, borderColor: '#007AFF', zIndex: 1 },
  markerText: { fontSize: 10, fontWeight: 'bold', color: '#007AFF' },
  stopListContainer: { marginTop: 10, backgroundColor: '#fdfdfd', borderRadius: 12, padding: 5 },
  stopItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 5, borderWidth: 1, borderColor: '#f0f0f0' },
  stopNumber: { width: 25, fontWeight: 'bold', color: '#007AFF' },
  stopCoords: { flex: 1, fontSize: 12, color: '#666' },
  stopActions: { flexDirection: 'row', alignItems: 'center', gap: 10 }
});