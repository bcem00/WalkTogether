import { StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Kullanıcı Profili</Text>
      <Text style={styles.subText}>Puanlar: 1500 | Rozetler: 5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' },
  subText: { fontSize: 16, marginTop: 10 }
});