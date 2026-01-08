import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { authApi } from '../apiClient';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [userModal, setUserModal] = useState({ visible: false, newValue: '' });
  const [passModal, setPassModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const result = await authApi.getUserProfile();
      
      if (result.data) {
        setUser({
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
          username: result.data.username,
          motivationPoint: result.data.motivationPoint,
          hasBadge: result.data.hasBadge
        });
      } else {
        // Fallback to AsyncStorage if API call fails
        const storedUsername = await AsyncStorage.getItem('username');
        const storedFirstName = await AsyncStorage.getItem('firstName');
        const storedLastName = await AsyncStorage.getItem('lastName');
        const storedEmail = await AsyncStorage.getItem('email');
        
        setUser({
          firstName: storedFirstName || 'Ad', 
          lastName: storedLastName || 'Soyad',
          email: storedEmail || 'E-posta tanımlı değil',
          username: storedUsername || 'kullanıcı_adı',
          hasBadge: false 
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Hata', 'Profil bilgileri alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return;

    // apiClient'daki authApi.changeUsername metodunu kullanıyoruz
    const result = await authApi.changeUsername({ newUsername: userModal.newValue });
    
    if (result.data) {
      Alert.alert("Başarılı", "Kullanıcı adınız güncellendi.");
      await AsyncStorage.setItem('username', userModal.newValue);
      setUser({ ...user, username: userModal.newValue });
      setUserModal({ visible: false, newValue: '' });
    } else {
      Alert.alert("Hata", result.error || "Bu kullanıcı adı alınmış olabilir.");
    }
  };

  const handleChangePassword = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const userId = await AsyncStorage.getItem('userId');
    if (!token) return;

    if (!oldPassword || !newPassword) {
        Alert.alert("Hata", "Lütfen tüm şifre alanlarını doldurun.");
        return;
    }

    const result = await authApi.changePassword({ oldPassword, newPassword });
    
    if (result.data) {
      Alert.alert("Başarılı", "Şifreniz başarıyla değiştirildi.");
      setPassModal(false);
      setOldPassword(''); setNewPassword('');
    } else {
      Alert.alert("Hata", result.error || "Mevcut şifreniz hatalı.");
    }
  };

  const handleLogout = async () => {
    // Tüm verileri temizle ve çıkış yap
    await AsyncStorage.clear();
    Alert.alert("Çıkış Yapıldı", "Oturumunuz sonlandırıldı.");
    router.replace('/');
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.fullName}>{user?.firstName} {user?.lastName}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
        
        <ProfileItem 
          label="Kullanıcı Adı" 
          value={user?.username} 
          canEdit={true} 
          onEdit={() => setUserModal({ visible: true, newValue: user.username })} 
        />

        <ProfileItem label="E-posta" value={user?.email} canEdit={false} />
        <ProfileItem label="Ad" value={user?.firstName} canEdit={false} />
        <ProfileItem label="Soyad" value={user?.lastName} canEdit={false} />

       {/* YENİ: ROZETLER BÖLÜMÜ */}
        {user?.hasBadge && (
          <View style={styles.badgeSection}>
            <Text style={styles.sectionTitle}>Kazanılan Rozetler</Text>
            <View style={styles.badgeCard}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <View style={{marginLeft: 12}}>
                <Text style={styles.badgeName}>Usta Yürüyüşçü</Text>
                <Text style={styles.badgeDesc}>Uygulamada ilk etkinliğini tamamladın!</Text>
              </View>
            </View>
          </View>
        )}
        <TouchableOpacity style={styles.passwordRow} onPress={() => setPassModal(true)}>
          <View style={styles.passwordLeft}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" />
            <Text style={styles.passwordText}>Güvenlik ve Şifre</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        
      </View>

      {/* KULLANICI ADI MODAL */}
      <Modal visible={userModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Kullanıcı Adını Değiştir</Text>
            <Text style={styles.inputLabel}>Yeni Kullanıcı Adı</Text>
            <TextInput 
              style={styles.modalInput} 
              value={userModal.newValue} 
              onChangeText={(t) => setUserModal({...userModal, newValue: t})} 
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setUserModal({visible: false, newValue: ''})}><Text style={styles.cancelText}>İptal</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateUsername}><Text style={styles.saveText}>Güncelle</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ŞİFRE MODAL */}
      <Modal visible={passModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Şifre Değiştir</Text>
            
            <Text style={styles.inputLabel}>Mevcut Şifre</Text>
            <TextInput 
                style={styles.modalInput} 
                placeholder="••••••••" 
                secureTextEntry 
                value={oldPassword} 
                onChangeText={setOldPassword} 
            />

            <Text style={styles.inputLabel}>Yeni Şifre</Text>
            <TextInput 
                style={styles.modalInput} 
                placeholder="••••••••" 
                secureTextEntry 
                value={newPassword} 
                onChangeText={setNewPassword} 
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setPassModal(false)}><Text style={styles.cancelText}>Vazgeç</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleChangePassword}><Text style={styles.saveText}>Şifreyi Güncelle</Text></TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  badgeWrapper: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 15, padding: 3, elevation: 3 },
  fullName: { marginTop: 15, fontSize: 22, fontWeight: 'bold', color: '#333' },
  content: { padding: 25 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#aaa', textTransform: 'uppercase', marginBottom: 15 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  itemLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  itemValue: { fontSize: 16, color: '#333', fontWeight: '500' },
  passwordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 12 },
  passwordLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passwordText: { fontWeight: '600', color: '#333' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 },
  modalInput: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelText: { color: '#999', fontWeight: '600', padding: 10 },
  saveText: { color: '#007AFF', fontWeight: 'bold', padding: 10 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, padding: 15, backgroundColor: '#FFECEC', borderRadius: 12, gap: 10 },
  logoutText: { fontWeight: '600', color: '#FF3B30' },
  badgeSection: {
    marginBottom: 25,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6', // Hafif altın tonlu arka plan
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  badgeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#856404',
  },
  badgeDesc: {
    fontSize: 12,
    color: '#856404',
    opacity: 0.8,
  },
});