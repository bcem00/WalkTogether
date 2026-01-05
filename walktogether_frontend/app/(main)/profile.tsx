import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { authApi } from '../apiClient'; //

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Sadece apiClient'da karşılığı olan düzenleme state'leri
  const [userModal, setUserModal] = useState({ visible: false, newValue: '' });
  const [passModal, setPassModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    // DB şemasına göre sakladığımız verileri simüle ediyoruz
    const storedUsername = await AsyncStorage.getItem('username');
    
    // Veriler DB'deki kullanıcı tablosundan geliyor
    setUser({
      firstName: 'Can', 
      lastName: 'Demir',
      email: 'can@example.com',
      username: storedUsername || 'yürüyüşçü_01',
      hasBadge: true // DB: has_badge
    });
    setLoading(false);
  };

  // KULLANICI ADI GÜNCELLEME (API'de VAR)
  const handleUpdateUsername = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return;

    const result = await authApi.changeUsername(token, { newUsername: userModal.newValue });
    
    if (result.data) {
      Alert.alert("Başarılı", "Kullanıcı adınız güncellendi.");
      await AsyncStorage.setItem('username', userModal.newValue);
      setUser({ ...user, username: userModal.newValue });
      setUserModal({ visible: false, newValue: '' });
    } else {
      Alert.alert("Hata", result.error || "Bu kullanıcı adı alınmış olabilir.");
    }
  };

  // ŞİFRE DEĞİŞTİRME (API'de VAR)
  const handleChangePassword = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return;

    const result = await authApi.changePassword(token, { oldPassword, newPassword });
    
    if (result.data) {
      Alert.alert("Başarılı", "Şifreniz başarıyla değiştirildi.");
      setPassModal(false);
      setOldPassword(''); setNewPassword('');
    } else {
      // Backend mevcut şifreyi kontrol eder
      Alert.alert("Hata", result.error || "Mevcut şifreniz hatalı girildi.");
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.firstName[0]}{user?.lastName[0]}</Text>
          </View>
          {user?.hasBadge && ( // DB: has_badge kolonu kontrolü
            <View style={styles.badgeWrapper}>
              <Ionicons name="medal" size={22} color="#FFD700" />
            </View>
          )}
        </View>
        <Text style={styles.fullName}>{user?.firstName} {user?.lastName}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
        
        {/* Değiştirilebilir Alan: Username */}
        <ProfileItem 
          label="Kullanıcı Adı" 
          value={user?.username} 
          canEdit={true} 
          onEdit={() => setUserModal({ visible: true, newValue: user.username })} 
        />

        {/* Değiştirilemez Alanlar (apiClient'da fonksiyonu yok) */}
        <ProfileItem label="E-posta" value={user?.email} canEdit={false} />
        <ProfileItem label="Ad" value={user?.firstName} canEdit={false} />
        <ProfileItem label="Soyad" value={user?.lastName} canEdit={false} />

        {/* Değiştirilebilir Alan: Password */}
        <TouchableOpacity style={styles.passwordRow} onPress={() => setPassModal(true)}>
          <View style={styles.passwordLeft}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" />
            <Text style={styles.passwordText}>Güvenlik ve Şifre</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* KULLANICI ADI MODAL */}
      <Modal visible={userModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Kullanıcı Adını Değiştir</Text>
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
            <Text style={styles.modalTitle}>Şifre Yenileme</Text>
            <TextInput style={styles.modalInput} placeholder="Mevcut Şifre" secureTextEntry value={oldPassword} onChangeText={setOldPassword} />
            <TextInput style={styles.modalInput} placeholder="Yeni Şifre" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setPassModal(false)}><Text style={styles.cancelText}>Vazgeç</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleChangePassword}><Text style={styles.saveText}>Değiştir</Text></TouchableOpacity>
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
  header: { alignItems: 'center', paddingVertical: 40, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
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
  modalInput: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 12, marginBottom: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelText: { color: '#999', fontWeight: '600' },
  saveText: { color: '#007AFF', fontWeight: 'bold' }
});