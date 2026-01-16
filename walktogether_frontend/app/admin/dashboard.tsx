import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, Alert, FlatList, Modal, StyleSheet, 
  Text, TextInput, TouchableOpacity, View, useColorScheme,
  Share, ScrollView
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
  
  // Arama State'leri
  const [searchTitle, setSearchTitle] = useState('');
  const [searchUser, setSearchUser] = useState('');

  // Katılımcı Modalı State'leri
  const [participants, setParticipants] = useState<any[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  
  // Detay ve Rapor State'leri
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<any>(null); 
  const [eventReportLoading, setEventReportLoading] = useState(false);

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

  // --- GLOBAL SİSTEM RAPORU ---
  const generateGlobalReport = () => {
    const totalEvents = allEvents.length;
    const totalParticipants = allEvents.reduce((acc, curr) => acc + (curr.participant_count || 0), 0);
    // Metreyi KM'ye çevirip gösteriyoruz
    const totalDistanceMeters = allEvents.reduce((acc, curr) => acc + (curr.route_distance_meters || 0), 0);
    const avgDistanceKm = (totalDistanceMeters / (totalEvents || 1) / 1000).toFixed(2);
    
    const topEvent = allEvents.length > 0 ? [...allEvents].sort((a, b) => b.participant_count - a.participant_count)[0] : null;

    const reportMessage = `
📊 SİSTEM GENEL RAPORU
-------------------------
📅 Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}
-------------------------
🏃 Toplam Etkinlik Sayısı: ${totalEvents}
👥 Toplam Katılımcı Sayısı: ${totalParticipants}
📏 Ortalama Parkur Uzunluğu: ${avgDistanceKm} km
-------------------------
🔥 En Popüler Etkinlik:
   - Başlık: ${topEvent ? topEvent.title : 'Yok'}
   - Oluşturan: @${topEvent ? topEvent.creator_username : '-'}
   - Katılımcı: ${topEvent ? topEvent.participant_count : 0}
    `;

    Alert.alert("Sistem Raporu", reportMessage, [
      { text: "Tamam" },
      { text: "Paylaş", onPress: () => Share.share({ message: reportMessage }) }
    ]);
  };

  // --- ✅ YENİ: TEKİL ETKİNLİK RAPORU (API TABANLI) ---
  const handleGenerateSpecificEventReport = async () => {
    if (!selectedDetailEvent) return;
    
    setEventReportLoading(true);
    // API çağrısı: Backend zaten formatlanmış string döndürüyor { report: string }
    const result = await eventsApi.getEventReport(selectedDetailEvent.event_id || selectedDetailEvent.id);
    setEventReportLoading(false);

    if (result.data) {
      // API'den gelen hazır raporu değişkene atıyoruz
      const apiReportString = result.data.report;

      Alert.alert(
        "Etkinlik Raporu", 
        apiReportString, // Doğrudan API yanıtını göster
        [
          { text: "Kapat" },
          { text: "Paylaş", onPress: () => Share.share({ message: apiReportString }) }
        ]
      );
    } else {
      Alert.alert("Hata", result.error || "Rapor oluşturulamadı.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Oturumu kapatmak istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      { 
        text: "Çıkış Yap", 
        style: "destructive", 
        onPress: async () => {
          await authApi.logout();
          navigation.reset({ index: 0, routes: [{ name: 'index' as never }] });
        } 
      }
    ]);
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    Alert.alert('Etkinliği Sil', `"${eventTitle}" silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
          const result = await eventsApi.deleteEvent(eventId);
          if (result.data) { 
            loadAllEvents(); 
            setSelectedDetailEvent(null); 
          }
      }},
    ]);
  };

  const handleViewParticipants = async (eventId: string) => {
    setParticipantsLoading(true);
    setShowParticipants(true);
    const result = await eventsApi.getEventParticipants(eventId); 
    setParticipantsLoading(false);
    if (result.data) {
      setParticipants(result.data);
    } else {
      Alert.alert("Hata", "Katılımcılar yüklenemedi.");
      setShowParticipants(false);
    }
  };

  const renderAdminItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}>
      <TouchableOpacity style={styles.info} onPress={() => setSelectedDetailEvent(item)}>
        <Text style={[styles.title, { color: themeColors.text }]}>{item.title}</Text>
        <Text style={[styles.creator, { color: themeColors.tint }]}>Oluşturan: @{item.creator_username}</Text>
        <Text style={[styles.details, { color: themeColors.placeholder }]}>
          Kod: {item.invitation_code} | Katılımcı: {item.participant_count}
        </Text>
        <Text style={styles.clickHint}>Detaylar için dokun</Text>
      </TouchableOpacity>

      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => handleViewParticipants(item.event_id)} style={styles.actionBtn}>
          <Ionicons name="people-outline" size={22} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteEvent(item.event_id, item.title)} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.headerContainer}>
        <View style={{flex: 1}}>
          <Text style={[styles.header, { color: themeColors.text }]}>Admin Paneli</Text>
          <Text style={styles.subHeader}>Yönetim ve İstatistikler</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.logsBtn} onPress={() => router.push('/admin/system-logs' as any)}>
            <Ionicons name="list-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.reportBtn} onPress={generateGlobalReport}>
            <Ionicons name="document-text-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBox}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={16} color="#888" />
          <TextInput style={styles.input} placeholder="Başlık ara..." value={searchTitle} onChangeText={setSearchTitle} />
        </View>
        <View style={styles.inputContainer}>
          <Ionicons name="person" size={16} color="#888" />
          <TextInput style={styles.input} placeholder="Kullanıcı ara..." value={searchUser} onChangeText={setSearchUser} />
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

      {/* --- DETAY MODALI --- */}
      <Modal visible={!!selectedDetailEvent} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModalContent, { backgroundColor: themeColors.inputBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Etkinlik Detayları</Text>
              <TouchableOpacity onPress={() => setSelectedDetailEvent(null)}>
                <Ionicons name="close-circle" size={32} color={themeColors.placeholder} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedDetailEvent && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Başlık:</Text>
                    <Text style={[styles.value, {color: themeColors.text}]}>{selectedDetailEvent.title}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Açıklama:</Text>
                    <Text style={[styles.value, {color: themeColors.text}]}>{selectedDetailEvent.description || "Açıklama yok."}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Oluşturan:</Text>
                    <Text style={[styles.value, {color: themeColors.tint}]}>@{selectedDetailEvent.creator_username}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Tarih:</Text>
                    <Text style={[styles.value, {color: themeColors.text}]}>
                      {new Date(selectedDetailEvent.start_date).toLocaleString('tr-TR')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Davet Kodu:</Text>
                    <Text style={[styles.value, {fontWeight: 'bold', color: themeColors.text}]}>{selectedDetailEvent.invitation_code}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Mesafe:</Text>
                    <Text style={[styles.value, {color: themeColors.text}]}>
                      {(selectedDetailEvent.route_distance_meters / 1000).toFixed(2)} km
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Katılımcı Sayısı:</Text>
                    <Text style={[styles.value, {color: themeColors.text}]}>{selectedDetailEvent.participant_count}</Text>
                  </View>

                  <View style={styles.divider} />

                  {/* ÖZEL RAPOR BUTONU */}
                  <TouchableOpacity 
                    style={[styles.specificReportBtn, eventReportLoading && {opacity: 0.7}]} 
                    onPress={handleGenerateSpecificEventReport}
                    disabled={eventReportLoading}
                  >
                    {eventReportLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="stats-chart" size={20} color="#fff" />
                        <Text style={styles.specificReportText}>Bu Etkinliğin Raporunu Çıkar</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* SİLME BUTONU */}
                  <TouchableOpacity 
                    style={styles.deleteDetailBtn} 
                    onPress={() => handleDeleteEvent(selectedDetailEvent.event_id, selectedDetailEvent.title)}
                  >
                    <Ionicons name="trash" size={20} color="#fff" />
                    <Text style={styles.specificReportText}>Etkinliği Sil</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- KATILIMCILAR MODALI --- */}
      <Modal visible={showParticipants} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.participantsModalContent, { backgroundColor: themeColors.inputBackground }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>Katılımcılar</Text>
                <Text style={[styles.modalSubtitle, { color: themeColors.placeholder }]}>
                   Liste Görüntüleniyor
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setShowParticipants(false); setParticipants([]); }}>
                <Ionicons name="close-circle" size={32} color={themeColors.placeholder} />
              </TouchableOpacity>
            </View>
            
            {participantsLoading ? (
              <ActivityIndicator size="large" color={themeColors.tint} style={{ marginTop: 50 }} />
            ) : (
              <FlatList
                data={participants}
                keyExtractor={(item) => item.userId || Math.random().toString()}
                renderItem={({ item }) => (
                  <View style={[styles.participantItem, { borderBottomColor: themeColors.border }]}>
                    <View style={[styles.participantAvatar, { backgroundColor: themeColors.tint }]}>
                      <Text style={styles.participantAvatarText}>
                        {item.firstName?.[0]}{item.lastName?.[0]}
                      </Text>
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={[styles.participantName, { color: themeColors.text }]}>
                        {item.firstName} {item.lastName}
                      </Text>
                      <Text style={[styles.participantUsername, { color: themeColors.placeholder }]}>
                        @{item.username}
                      </Text>
                    </View>
                    <View style={[styles.completionBadge, { backgroundColor: item.hasCompleted ? '#4CAF50' : '#FF9800' }]}>
                      <Text style={styles.completionText}>
                        {item.hasCompleted ? 'Tamamladı' : 'Devam Ediyor'}
                      </Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: themeColors.placeholder }]}>
                    Henüz katılımcı yok.
                  </Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  header: { fontSize: 22, fontWeight: 'bold' },
  subHeader: { fontSize: 13, color: '#888' },
  headerButtons: { flexDirection: 'row', gap: 8 },
  logsBtn: { backgroundColor: '#6c757d', padding: 8, borderRadius: 8 },
  reportBtn: { backgroundColor: '#28a745', padding: 8, borderRadius: 8 },
  logoutBtn: { backgroundColor: '#FF3B30', padding: 8, borderRadius: 8 },
  searchBox: { paddingHorizontal: 20, gap: 10, marginBottom: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 12, height: 40 },
  input: { flex: 1, marginLeft: 8, fontSize: 14 },
  
  card: { flexDirection: 'row', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', borderWidth: 1 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: 'bold' },
  creator: { fontSize: 12, marginTop: 4 },
  details: { fontSize: 11, marginTop: 4 },
  clickHint: { fontSize: 10, color: '#999', marginTop: 6, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: 10, paddingLeft: 10 },
  actionBtn: { padding: 5 },

  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  
  // DETAY MODALI STİLLERİ
  detailModalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '75%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 8 },
  label: { color: '#888', fontSize: 14 },
  value: { fontSize: 14, flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  
  specificReportBtn: { backgroundColor: '#9C27B0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, gap: 10, marginBottom: 10 },
  deleteDetailBtn: { backgroundColor: '#FF3B30', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, gap: 10, marginBottom: 30 },
  specificReportText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // KATILIMCI MODALI STİLLERİ
  participantsModalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '60%', padding: 20 },
  modalSubtitle: { fontSize: 13, marginTop: 2 },
  participantItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  participantAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  participantAvatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  participantInfo: { flex: 1, marginLeft: 12 },
  participantName: { fontSize: 15, fontWeight: '600' },
  participantUsername: { fontSize: 12, marginTop: 2 },
  completionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  completionText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
});