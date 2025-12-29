import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleAction = () => {
    if (isLogin) {
      console.log("Giriş yapılıyor:", username, password);
      alert(`Hoş geldin ${username}!`);
      router.replace('/(main)/home');
    } else {
      console.log("Kayıt olunuyor:", username, email, password);
      alert("Hesabınız oluşturuldu! Şimdi giriş yapabilirsiniz.");
      setIsLogin(true); // Kayıt sonrası giriş ekranına at
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        
        <Text style={styles.logo}>PROJE LOGO</Text>
        <Text style={styles.title}>{isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}</Text>

        <View style={styles.form}>
          <TextInput 
            style={styles.input} 
            placeholder="Kullanıcı Adı" 
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          {!isLogin && ( // Sadece Kayıt modundaysak E-posta göster
            <TextInput 
              style={styles.input} 
              placeholder="E-posta" 
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          )}

          <TextInput 
            style={styles.input} 
            placeholder="Şifre" 
            value={password}
            onChangeText={setPassword}
            secureTextEntry // Şifreyi yıldızlı gösterir
          />

          <TouchableOpacity style={styles.button} onPress={handleAction}>
            <Text style={styles.buttonText}>{isLogin ? 'Giriş' : 'Kayıt Ol'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton} 
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten hesabın var mı? Giriş Yap'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#007AFF',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 40,
    color: '#555',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#007AFF',
    fontSize: 14,
  },
});