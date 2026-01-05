import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
//API KEY: AIzaSyDFYEsvv3CUOa07f13Go1T2XKul0HbtfnU
export default function MyEventsScreen() {
  // --- STATE YÖNETİMİ ---
  const [showForm, setShowForm] = useState(false);
  const [myEvents, setMyEvents] = useState<any[]>([]);

  const GOOGLE_MAPS_APIKEY = 'AIzaSyDFYEsvv3CUOa07f13Go1T2XKul0HbtfnU';
  
  // Form Field State'leri
  const [eventName, setEventName] = useState('');
  const [startLoc, setStartLoc] = useState('');
  const [endLoc, setEndLoc] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [duration, setDuration] = useState('1');
  const [stops, setStops] = useState<{ id: number; name: string; latitude: number; longitude: number }[]>([]);
  const [tempCoordinate, setTempCoordinate] = useState<any>(null);

  const origin = stops.length > 0 ? { latitude: stops[0].latitude, longitude: stops[0].longitude } : null; // İlk durak başlangıç
  const destination = stops.length > 1 ? { latitude: stops[stops.length - 1].latitude, longitude: stops[stops.length - 1].longitude } : null; // Son durak bitiş
  const waypoints = stops.length > 2 ? stops.slice(1, -1).map(s => ({ latitude: s.latitude, longitude: s.longitude })) : []; // Aradaki duraklar
  // --- DURAK VE HESAPLAMA FONKSİYONLARI ---


  const handleMapPress = (e: any) => {
  // Haritaya tıklandığında koordinatı temp state'e atar
  setTempCoordinate(e.nativeEvent.coordinate);
};

const addStopFromMap = () => {
  if (!tempCoordinate) return;
  
  // Eğer kullanıcı TextInput'a isim yazmışsa onu kullan, yazmamışsa numara ver
  const stopName = `${stops.length + 1}. Durak`;
  
  setStops([...stops, { 
    id: Date.now(), 
    name: stopName, 
    latitude: tempCoordinate.latitude, 
    longitude: tempCoordinate.longitude 
  }]);
  
  setTempCoordinate(null); 
};

  const deleteStop = (id: number) => {
    setStops(stops.filter(stop => stop.id !== id));
  };

  const moveStop = (index: number, direction: 'up' | 'down') => {
    const newStops = [...stops];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStops.length) return;
    const temp = newStops[index];
    newStops[index] = newStops[targetIndex];
    newStops[targetIndex] = temp;
    setStops(newStops);
  };

  const calculateEndTime = () => {
    const end = new Date(startDate.getTime());
    end.setHours(end.getHours() + parseInt(duration || '0'));
    return end.toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

  const handleSaveEvent = () => {
    if (!eventName || !startLoc || !endLoc) {
      Alert.alert("Hata", "Lütfen temel bilgileri doldurun.");
      return;
    }

    const newEvent = {
      id: Date.now().toString(),
      title: eventName,
      start: startLoc,
      end: endLoc,
      date: startDate.toLocaleDateString('tr-TR'),
      stopsCount: stops.length,
      fullDetails: { duration, stops } // Tüm detayları burada saklıyoruz
    };

    setMyEvents([newEvent, ...myEvents]);
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setEventName(''); setStartLoc(''); setEndLoc('');
    setStops([]); setDuration('1'); setStartDate(new Date());
  };

  // --- UI BİLEŞENLERİ ---

  if (showForm) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setShowForm(false)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
            <Text style={styles.backBtnText}>Geri Dön</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yeni Etkinlik</Text>
        </View>

        <View style={styles.formBody}>
          <Text style={styles.label}>Etkinlik Adı</Text>
          <TextInput style={styles.input} value={eventName} onChangeText={setEventName} placeholder="Etkinlik başlığı..." />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Başlangıç</Text>
              <TextInput style={styles.input} value={startLoc} onChangeText={setStartLoc} placeholder="Nokta A" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.label}>Bitiş</Text>
              <TextInput style={styles.input} value={endLoc} onChangeText={setEndLoc} placeholder="Nokta B" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Başlangıç Tarihi</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar" size={18} color="#666" />
                <Text>{startDate.toLocaleDateString('tr-TR')}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ width: 80, marginLeft: 10 }}>
              <Text style={styles.label}>Süre (Saat)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={duration} onChangeText={setDuration} placeholder="Saat" />
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="time-outline" size={18} color="#2E7D32" />
            <Text style={styles.infoText}>Tahmini Bitiş: {calculateEndTime()}</Text>
          </View>

          {showDatePicker && (
            <DateTimePicker value={startDate} mode="date" onChange={(e, d) => { setShowDatePicker(false); if(d) setStartDate(d); }} />
          )}


          {/* Harita Bölümü */}
<Text style={styles.label}>Haritadan Durak Seç (Tıkla ve Ekle)</Text>
<View style={styles.mapContainer}>
    <MapView
  style={styles.map}
  initialRegion={{
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }}
  onPress={handleMapPress}
>
  {/* Mevcut Durak Marker'ların */}
  {stops.map((stop, index) => (
  <Marker 
    key={stop.id} 
    coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
  >
    {/* Unity'deki 'Custom Sprite + Text' yapısı gibi düşünebilirsin */}
    <View style={styles.customMarkerContainer}>
      <View style={styles.markerLabelBox}>
        <Text style={styles.markerLabelText}>{stop.name}</Text>
      </View>
      <Ionicons name="location" size={30} color="#007AFF" />
    </View>
  </Marker>
))}

  {/* GERÇEK ROTA ÇİZİMİ */}
  {origin && destination && (
    <MapViewDirections
      origin={origin}
      destination={destination}
      waypoints={waypoints}
      apikey={GOOGLE_MAPS_APIKEY}
      strokeWidth={4}
      strokeColor="#007AFF"
      mode="WALKING" // Yaya yollarını takip etmesi için çok önemli
      optimizeWaypoints={true} // Google'ın sırayı en kısa yola göre optimize etmesini sağlar
      onReady={(result) => {
        console.log(`Mesafe: ${result.distance} km`);
        console.log(`Süre: ${result.duration} dk`);
      }}
      onError={(errorMessage) => {
        console.error("Rota Hatası:", errorMessage);
      }}
    />
  )}
</MapView>
  </View>

{/* Eğer haritadan bir yer seçildiyse butonu göster */}
{tempCoordinate && (
  <TouchableOpacity style={styles.confirmMapBtn} onPress={addStopFromMap}>
    <Ionicons name="checkmark-circle" size={20} color="white" />
    <Text style={styles.confirmMapBtnText}>Bu Noktayı Durak Olarak Onayla</Text>
  </TouchableOpacity>
)}

          <View style={styles.stopList}>
            {stops.map((stop, index) => (
              <View key={stop.id} style={styles.stopItem}>
                <Text style={styles.indexText}>{index + 1}.</Text>
                <Text style={styles.stopText}>{stop.name}</Text>
                <View style={styles.stopActions}>
                  <TouchableOpacity onPress={() => moveStop(index, 'up')} disabled={index === 0}>
                    <Ionicons name="chevron-up-circle" size={24} color={index === 0 ? "#ccc" : "#007AFF"} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => moveStop(index, 'down')} disabled={index === stops.length - 1}>
                    <Ionicons name="chevron-down-circle" size={24} color={index === stops.length - 1 ? "#ccc" : "#007AFF"} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteStop(stop.id)}>
                    <Ionicons name="trash" size={22} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEvent}>
            <Text style={styles.saveBtnText}>Etkinliği Kaydet ve Yayınla</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // LİSTE GÖRÜNÜMÜ
  return (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <Text style={styles.headerTitle}>Oluşturduğum Etkinlikler</Text>
        <TouchableOpacity style={styles.addEventBtn} onPress={() => setShowForm(true)}>
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.addEventBtnText}>Yeni Oluştur</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={myEvents}
        renderItem={({ item }) => (
          <View style={styles.myEventCard}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardRoute}>{item.start} ➔ {item.end}</Text>
              <Text style={styles.cardDate}>{item.date} • {item.stopsCount} Durak</Text>
            </View>
            <TouchableOpacity onPress={() => setMyEvents(myEvents.filter(e => e.id !== item.id))}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Henüz bir etkinlik oluşturmadın.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  formHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', gap: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  formBody: { padding: 20 },
  label: { fontSize: 13, fontWeight: 'bold', marginBottom: 5, marginTop: 15, color: '#666' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 5 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', gap: 8 },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginTop: 15, justifyContent: 'center' },
  infoText: { color: '#2E7D32', fontWeight: 'bold', marginLeft: 8 },
  stopInputContainer: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 5 },
  addStopBtn: { backgroundColor: '#007AFF', padding: 10, borderRadius: 8 },
  stopList: { marginTop: 15 },
  stopItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  indexText: { fontWeight: 'bold', color: '#007AFF', marginRight: 8 },
  stopText: { flex: 1, fontSize: 15 },
  stopActions: { flexDirection: 'row', gap: 10 },
  saveBtn: { backgroundColor: '#28a745', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, marginBottom: 50 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  myEventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardRoute: { fontSize: 14, color: '#007AFF', marginVertical: 4 },
  cardDate: { fontSize: 12, color: '#888' },
  addEventBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5 },
  addEventBtnText: { color: 'white', fontWeight: 'bold' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backBtnText: { color: '#007AFF', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, color: '#999' },
  mapContainer: { 
  height: 300, 
  width: '100%', 
  borderRadius: 15, 
  overflow: 'hidden', 
  marginTop: 10,
  borderWidth: 1,
  borderColor: '#ddd'
},
map: { 
  width: '100%', 
  height: '100%' 
},
confirmMapBtn: { 
  flexDirection: 'row',
  backgroundColor: '#007AFF', 
  padding: 12, 
  borderRadius: 10, 
  marginTop: 10, 
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8
},
confirmMapBtnText: { 
  color: 'white', 
  fontWeight: 'bold' 
},
customMarkerContainer: {
  alignItems: 'center',
  justifyContent: 'center',
},
markerLabelBox: {
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 5,
  borderWidth: 1,
  borderColor: '#007AFF',
  marginBottom: 2, // Pin'in biraz üzerinde durması için
},
markerLabelText: {
  color: '#007AFF',
  fontSize: 12,
  fontWeight: 'bold',
},
});