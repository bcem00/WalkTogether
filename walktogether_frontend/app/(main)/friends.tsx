import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// MOCK DATA: Mevcut arkadaşlarımız
const INITIAL_FRIENDS = [
  { id: '1', username: 'deniz_gezgin', name: 'Deniz Yılmaz' },
  { id: '2', username: 'rota_ustasi', name: 'Caner Demir' },
  { id: '3', username: 'adim_sayar', name: 'Selin Ak' },
];

export default function FriendsScreen() {
  const [friends, setFriends] = useState(INITIAL_FRIENDS);
  const [searchUsername, setSearchUsername] = useState('');

  // ARKADAŞ EKLEME
  const handleAddFriend = () => {
    if (searchUsername.trim() === '') {
      Alert.alert("Hata", "Lütfen bir kullanıcı adı girin.");
      return;
    }

    const newFriend = {
      id: Date.now().toString(),
      username: searchUsername.toLowerCase(),
      name: searchUsername, // Gerçekte backend'den çekilir
    };

    setFriends([newFriend, ...friends]); // Yeni arkadaşı listenin başına ekle
    setSearchUsername('');
    Keyboard.dismiss(); 
    Alert.alert("Başarılı", `${searchUsername} arkadaş olarak eklendi!`);
  };

  // ARKADAŞ SİLME 
  const handleDeleteFriend = (id: string, username: string) => {
    Alert.alert(
      "Arkadaşı Sil",
      `${username} adlı kişiyi silmek istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive", 
          onPress: () => {
            setFriends(friends.filter(f => f.id !== id));
          } 
        }
      ]
    );
  };

  // ARKADAŞ KARTI 
  const renderFriendCard = ({ item }: { item: any }) => (
    <View style={styles.friendCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text>
      </View>
      
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendUsername}>@{item.username}</Text>
      </View>

      <TouchableOpacity 
        style={styles.deleteBtn} 
        onPress={() => handleDeleteFriend(item.id, item.username)}
      >
        <Ionicons name="person-remove-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ARKADAŞ EKLEME BÖLÜMÜ */}
      <View style={styles.addSection}>
        <Text style={styles.sectionTitle}>Yeni Arkadaş Ekle</Text>
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input}
            placeholder="Kullanıcı adı girin..."
            value={searchUsername}
            onChangeText={setSearchUsername}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddFriend}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Arkadaşlarım ({friends.length})</Text>
      </View>

      {/* ARKADAŞ LİSTESİ */}
      <FlatList 
        data={friends}
        renderItem={renderFriendCard}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Henüz hiç arkadaşın yok.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  addSection: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  inputContainer: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10, fontSize: 15 },
  addBtn: { backgroundColor: '#007AFF', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 10 },
  listHeader: { paddingHorizontal: 20, paddingTop: 20 },
  friendCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 10,
    elevation: 1
  },
  avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#007AFF', fontWeight: 'bold', fontSize: 18 },
  friendInfo: { flex: 1, marginLeft: 15 },
  friendName: { fontSize: 16, fontWeight: '600', color: '#333' },
  friendUsername: { fontSize: 13, color: '#888' },
  deleteBtn: { padding: 8 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 }
});