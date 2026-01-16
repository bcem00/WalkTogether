import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, Alert, FlatList, StyleSheet, 
  Text, TextInput, TouchableOpacity, View, useColorScheme,
  Share 
} from 'react-native';
import { Colors } from '../../constants/theme';
import { authApi, eventsApi } from '../apiClient';

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  
  const [allEvents, setAllEvents] = useState<any[]>([]); 
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [searchTitle, setSearchTitle] = useState('');
  const [searchUser, setSearchUser] = useState('');
  
  const navigation = useNavigation();

  useEffect(() => {
    loadAllEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTitle, searchUser, allEvents]);

  const loadAllEvents = async () => {
    setLoading(true);
    const result = await eventsApi.getUpcomingEvents();
    if (result.data) {
      setAllEvents(result.data);
      setFilteredEvents(result.data);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let temp = allEvents;
    if (searchTitle) {
      temp = temp.filter(e => e.title.toLowerCase().includes(searchTitle.toLowerCase()));
    }
    if (searchUser) {
      temp = temp.filter(e => e.creator_username.toLowerCase().includes(searchUser.toLowerCase()));
    }
    setFilteredEvents(temp);
  };

  // --- ÇIKIŞ YAPMA FONKSİYONU (EKLENDİ) ---
  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Oturumu kapatmak istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      { 
        text: "Çıkış Yap", 
        style: "destructive", 
        onPress: async () => {
          await authApi.logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'index' as never }],
          });
        } 
      }
    ]);
  };

  const generateReport = () => {
    const totalEvents = allEvents.length;
    const totalParticipants = allEvents.reduce((acc, curr) => acc + (curr.participant_count || 0), 0);
    const avgDistance = (allEvents.reduce((acc, curr) => acc + (curr.route_distance_meters || 0), 0) / (totalEvents || 1) / 1000).toFixed(2);
    const topEvent = allEvents.length > 0 ? [...allEvents].sort((a, b) => b.participant_count - a.participant_count)[0] : null;

    const reportMessage = `
📊 SİSTEM GENEL RAPORU
-------------------------
📅 Tarih: ${new Date().toLocaleDateString('tr-TR')}
🏃 Toplam Etkinlik: ${totalEvents}
👥 Toplam Katılımcı: ${totalParticipants}
📏 Ort. Parkur: ${avgDistance} km
🔥 En Popüler: ${topEvent ? topEvent.title : 'Yok'} (@${topEvent ? topEvent.creator_username : '-'})
    `;

    Alert.alert("Sistem Raporu", reportMessage, [
      { text: "Tamam" },
      { text: "Paylaş", onPress: () => Share.share({ message: reportMessage }) }
    ]);
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    Alert.alert('Etkinliği Sil', `"${eventTitle}" silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
          const result = await eventsApi.deleteEvent(eventId);
          if (result.data) { loadAllEvents(); }
      }},
    ]);
  };

  const renderAdminItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}>
      <View style={styles.info}>
        <Text style={[styles.title, { color: themeColors.text }]}>{item.title}</Text>
        <Text style={[styles.creator, { color: themeColors.tint }]}>Oluşturan: @{item.creator_username}</Text>
        <Text style={[styles.details, { color: themeColors.placeholder }]}>
          Kod: {item.invitation_code} | Katılımcı: {item.participant_count}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleDeleteEvent(item.event_id, item.title)}>
        <Ionicons name="trash-outline" size={22} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.headerContainer}>
        <View style={{flex: 1}}>
          <Text style={[styles.header, { color: themeColors.text }]}>Admin Paneli</Text>
          <Text style={styles.subHeader}>Yönetim ve İstatistikler</Text>
        </View>
        
        {/* BUTON GRUBU: Loglar, Rapor, Çıkış */}
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.logsBtn} onPress={() => router.push('/admin/system-logs' as any)}>
            <Ionicons name="list-outline" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportBtn} onPress={generateReport}>
            <Ionicons name="document-text-outline" size={20} color="#fff" />
          </TouchableOpacity>

          {/* EKLENEN ÇIKIŞ BUTONU */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBox}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={16} color="#888" />
          <TextInput 
            style={styles.input} 
            placeholder="Başlığa göre ara..." 
            value={searchTitle} 
            onChangeText={setSearchTitle}
          />
        </View>
        <View style={styles.inputContainer}>
          <Ionicons name="person" size={16} color="#888" />
          <TextInput 
            style={styles.input} 
            placeholder="Kullanıcıya göre ara..." 
            value={searchUser} 
            onChangeText={setSearchUser}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={themeColors.tint} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderAdminItem}
          keyExtractor={(item) => item.event_id.toString()}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Sonuç bulunamadı.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  header: { fontSize: 22, fontWeight: 'bold' },
  subHeader: { fontSize: 13, color: '#888' },
  headerButtons: { flexDirection: 'row', gap: 8 },
  
  // Buton stilleri (Sadece ikon olacak şekilde güncellendi, yer kazanmak için)
  logsBtn: { backgroundColor: '#6c757d', padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  reportBtn: { backgroundColor: '#28a745', padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  logoutBtn: { backgroundColor: '#FF3B30', padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }, // Yeni stil

  searchBox: { paddingHorizontal: 20, gap: 10, marginBottom: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 12, height: 40 },
  input: { flex: 1, marginLeft: 8, fontSize: 14 },
  card: { flexDirection: 'row', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: 'bold' },
  creator: { fontSize: 12, marginTop: 4 },
  details: { fontSize: 11, marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});