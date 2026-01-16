import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native'; 
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity, View, useColorScheme
} from 'react-native';
import { Colors } from '../../constants/theme';
import { authApi, eventsApi } from '../apiClient';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userModal, setUserModal] = useState({ visible: false, newValue: '' });
  const [passModal, setPassModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [attendedEvents, setAttendedEvents] = useState<any[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<any[]>([]);
  const [totalEventCount, setTotalEventCount] = useState(0);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      fetchAttendedEvents();
      checkAdminRole();
    }, [])
  );

  const checkAdminRole = async () => {
    const role = await AsyncStorage.getItem('userRole');
    setUserRole(role);
  };

  const fetchAttendedEvents = async () => {
    const result = await eventsApi.getAttendedEvents();
    if (result.data) {
      setAttendedEvents(result.data);
    }
  };

  const fetchAdminData = async () => {
    const usersResult = await eventsApi.getInactiveUsers();
    const countResult = await eventsApi.getTotalEventCount();
    if (usersResult.data) setInactiveUsers(usersResult.data);
    if (countResult.data) setTotalEventCount(countResult.data.totalEventCount);
  };

  const fetchUserProfile = async () => {
    try {
      if (!user) setLoading(true);
      const result = await authApi.getUserProfile();
      
      if (result.data) {
        setUser({
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
          username: result.data.username,
          motivationPoint: result.data.motivationPoint, // ✅ Puan buradan geliyor
          hasBadge: result.data.hasBadge 
        });
      } else {
        const storedUsername = await AsyncStorage.getItem('username');
        setUser({
          firstName: 'Kullanıcı', 
          lastName: '',
          email: 'Tanımlı değil',
          username: storedUsername || 'kullanıcı',
          motivationPoint: 0,
          hasBadge: false 
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    const result = await authApi.changeUsername({ newUsername: userModal.newValue });
    if (result.data) {
      Alert.alert("Başarılı", "Kullanıcı adınız güncellendi.");
      await AsyncStorage.setItem('username', userModal.newValue);
      setUser({ ...user, username: userModal.newValue });
      setUserModal({ visible: false, newValue: '' });
    } else {
      Alert.alert("Hata", result.error || "Güncelleme başarısız.");
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
        Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
        return;
    }
    const result = await authApi.changePassword({ oldPassword, newPassword });
    if (result.data) {
      Alert.alert("Başarılı", "Şifreniz değiştirildi.");
      setPassModal(false);
      setOldPassword(''); setNewPassword('');
    } else {
      Alert.alert("Hata", result.error || "Mevcut şifre hatalı.");
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#007AFF" /></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { backgroundColor: themeColors.inputBackground, borderBottomColor: themeColors.border }]}>
        <View style={styles.avatar}>
           <Text style={styles.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
        </View>
        <Text style={[styles.fullName, { color: themeColors.text }]}>{user?.firstName} {user?.lastName}</Text>
        
        {/* ✅ YENİ: MOTİVASYON PUANI ROZETİ */}
        <View style={styles.pointsBadge}>
          <Ionicons name="flash" size={16} color="#FFD700" />
          <Text style={styles.pointsText}>{user?.motivationPoint || 0} Motivasyon Puanı</Text>
        </View>
      </View>

      <View style={[styles.content, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Hesap Bilgileri</Text>
        
        <ProfileItem 
          label="Kullanıcı Adı" 
          value={user?.username} 
          canEdit={true} 
          onEdit={() => setUserModal({ visible: true, newValue: user.username })} 
        />
        <ProfileItem label="E-posta" value={user?.email} canEdit={false} />
        
        {/* ✅ YENİ: MOTİVASYON PUANI SATIRI */}
        <View style={styles.item}>
           <View>
             <Text style={styles.itemLabel}>Motivasyon Puanı</Text>
             <Text style={[styles.itemValue, { color: '#FFD700', fontWeight: 'bold' }]}>{user?.motivationPoint || 0} MP</Text>
           </View>
           <Ionicons name="analytics-outline" size={20} color="#FFD700" />
        </View>

        <ProfileItem label="Ad" value={user?.firstName} canEdit={false} />
        <ProfileItem label="Soyad" value={user?.lastName} canEdit={false} />

        {user?.hasBadge && (
          <View style={styles.badgeSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Kazanılan Rozetler</Text>
            <View style={styles.badgeCard}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <View style={{marginLeft: 12}}>
                <Text style={styles.badgeName}>Usta Yürüyüşçü</Text>
                <Text style={styles.badgeDesc}>Uygulamada ilk etkinliğini tamamladın!</Text>
              </View>
            </View>
          </View>
        )}

        {/* Admin Paneli ve Diğer Butonlar Aynı Kalıyor... */}
        {userRole === 'admin' && (
          <TouchableOpacity style={styles.adminBtn} onPress={() => {
            setShowAdminPanel(!showAdminPanel);
            if (!showAdminPanel) fetchAdminData();
          }}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#FF9500" />
            <Text style={styles.adminBtnText}>Admin Paneli</Text>
          </TouchableOpacity>
        )}

        {showAdminPanel && (
          <View style={styles.adminPanel}>
            <View style={styles.adminStat}>
              <Text style={styles.adminLabel}>Toplam Etkinlik</Text>
              <Text style={styles.adminValue}>{totalEventCount}</Text>
            </View>
            <View style={styles.adminStat}>
              <Text style={styles.adminLabel}>Pasif Kullanıcılar</Text>
              <Text style={styles.adminValue}>{inactiveUsers.length}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.passwordRow} onPress={() => setPassModal(true)}>
          <View style={styles.passwordLeft}>
            <Ionicons name="lock-closed-outline" size={20} color="#333" />
            <Text style={styles.passwordText}>Güvenlik ve Şifre</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
      
      {/* Username Change Modal */}
      <Modal visible={userModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Kullanıcı Adını Değiştir</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Yeni kullanıcı adı"
              value={userModal.newValue}
              onChangeText={(text) => setUserModal({ ...userModal, newValue: text })}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setUserModal({ visible: false, newValue: '' })}>
                <Text style={styles.cancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateUsername}>
                <Text style={styles.saveText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal visible={passModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Şifre Değiştir</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Mevcut şifre"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Yeni şifre"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => {
                setPassModal(false);
                setOldPassword('');
                setNewPassword('');
              }}>
                <Text style={styles.cancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleChangePassword}>
                <Text style={styles.saveText}>Değiştir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const ProfileItem = ({ label, value, canEdit, onEdit }: any) => (
  <View style={styles.item}>
    <View>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.itemValue}>{value}</Text>
    </View>
    {canEdit && (
      <TouchableOpacity onPress={onEdit}>
        <Ionicons name="pencil-sharp" size={18} color="#007AFF" />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingVertical: 30, borderBottomWidth: 1 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  fullName: { marginTop: 15, fontSize: 20, fontWeight: 'bold' },
  
  // ✅ YENİ: PUAN ROZETİ STİLLERİ
  pointsBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 215, 0, 0.1)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFD700'
  },
  pointsText: { color: '#b8860b', fontWeight: 'bold', fontSize: 13, marginLeft: 5 },

  content: { padding: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#999', textTransform: 'uppercase', marginBottom: 15, marginTop: 10 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemLabel: { fontSize: 12, color: '#999' },
  itemValue: { fontSize: 15, fontWeight: '500', marginTop: 2 },
  badgeSection: { marginTop: 20 },
  badgeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E6', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#FFE082' },
  badgeName: { fontSize: 14, fontWeight: 'bold', color: '#856404' },
  badgeDesc: { fontSize: 11, color: '#856404', opacity: 0.7 },
  passwordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 12 },
  passwordLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passwordText: { fontWeight: '600' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, padding: 15, backgroundColor: '#FFECEC', borderRadius: 12, gap: 10 },
  logoutText: { fontWeight: '600', color: '#FF3B30' },
  adminBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 15, backgroundColor: '#FFF3E0', borderRadius: 12, gap: 10, borderWidth: 1, borderColor: '#FFB74D' },
  adminBtnText: { fontWeight: '600', color: '#FF9500' },
  adminPanel: { backgroundColor: '#FFF9E6', padding: 15, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#FFE082' },
  adminStat: { marginBottom: 8 },
  adminLabel: { fontSize: 11, color: '#856404' },
  adminValue: { fontSize: 16, fontWeight: 'bold', color: '#FF9500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
  modalBox: { backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalInput: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelText: { color: '#999', padding: 10 },
  saveText: { color: '#007AFF', fontWeight: 'bold', padding: 10 }
});