import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme
} from 'react-native';
import { Colors } from '../constants/theme';
import { authApi } from './apiClient';
import WalkingBackground from '../components/WalkingBackground';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form State'leri - TypeScript otomatik olarak 'string' atar
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Parametreye ': string' ekleyerek hatayı çözüyoruz
  const validateEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleAction = async () => {
    // Validasyon
    if (isLogin) {
      if (!username.trim() || !password.trim()) {
        Alert.alert("Eksik Bilgi", "Lütfen kullanıcı adı ve şifrenizi girin.");
        return;
      }
    } else {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !username.trim() || !password.trim()) {
        Alert.alert("Eksik Bilgi", "Lütfen tüm alanları doldurun.");
        return;
      }
      if (!validateEmail(email)) {
        Alert.alert("Geçersiz E-posta", "Lütfen geçerli bir e-posta adresi girin.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        // --- GİRİŞ İŞLEMİ ---
        const result = await authApi.loginWithStorage({ identifier: username, password });

        if (result.data) {
          await AsyncStorage.setItem('userToken', result.data.token);
          await AsyncStorage.setItem('username', username);
          
          if (username.toLowerCase() === 'admin') {
            router.replace('/admin/dashboard');
          } else {
            router.replace('/(main)/home');
          }
        } else {
          Alert.alert("Giriş Başarısız", result.error || "Hatalı bilgiler.");
        }
      } else {
        
        const result = await authApi.register({
          firstName,
          lastName,
          username,
          email,
          password
        });

        if (result.data) {
          Alert.alert("Başarılı", "Hesabınız oluşturuldu!", [
            { text: "Tamam", onPress: () => setIsLogin(true) }
          ]);
        } else {
          Alert.alert("Kayıt Hatası", result.error || "İşlem başarısız.");
        }
      }
    } catch (err: any) {
      
      Alert.alert("Bağlantı Hatası", "Sunucuya ulaşılamıyor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: themeColors.background }]}>
      <WalkingBackground />
      <ScrollView contentContainerStyle={[styles.inner, { backgroundColor: themeColors.background }]}>
        <Text style={styles.logo}>WALK TOGETHER</Text>
        <Text style={styles.title}>{isLogin ? 'Oturum Aç' : 'Hesap Oluştur'}</Text>

        <View style={styles.form}>
          {!isLogin && (
            <>
              <Text style={[styles.label, { color: themeColors.label }]}>Ad</Text>
              <TextInput style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder, color: themeColors.text }]} placeholder="Ad" placeholderTextColor={themeColors.placeholder} value={firstName} onChangeText={setFirstName} />
              
              <Text style={[styles.label, { color: themeColors.label }]}>Soyad</Text>
              <TextInput style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder, color: themeColors.text }]} placeholder="Soyad" placeholderTextColor={themeColors.placeholder} value={lastName} onChangeText={setLastName} />

              <Text style={[styles.label, { color: themeColors.label }]}>E-posta</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder, color: themeColors.text }]} 
                placeholder="email@example.com" 
                placeholderTextColor={themeColors.placeholder}
                value={email} 
                onChangeText={setEmail} 
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </>
          )}

          <Text style={[styles.label, { color: themeColors.label }]}>Kullanıcı Adı</Text>
          <TextInput style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder, color: themeColors.text }]} placeholder="Kullanıcı adı" placeholderTextColor={themeColors.placeholder} value={username} onChangeText={setUsername} autoCapitalize="none" />

          <Text style={[styles.label, { color: themeColors.label }]}>Şifre</Text>
          <View style={[styles.passwordContainer, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder }]}>
            {showPassword ? (
              <TextInput 
                style={[styles.passwordInput, { color: themeColors.text }]} 
                placeholder="••••••••" 
                placeholderTextColor={themeColors.placeholder}
                value={password} 
                onChangeText={setPassword}
                secureTextEntry={false}
              />
            ) : (
              <TextInput 
                style={[styles.passwordInput, { color: themeColors.text }]} 
                placeholder="••••••••" 
                placeholderTextColor={themeColors.placeholder}
                value={password} 
                onChangeText={setPassword}
                secureTextEntry={true}
              />
            )}
            <TouchableOpacity 
              style={styles.showPasswordButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🔒' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.button, { backgroundColor: themeColors.buttonBackground }]} onPress={handleAction} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, { color: themeColors.buttonText }]}>{isLogin ? 'Giriş Yap' : 'Kaydol'}</Text>}
          </TouchableOpacity>

          <View style={styles.switchContainer}>
            <Text style={[styles.switchTextNormal, { color: themeColors.lightText }]}>{isLogin ? 'Hesabın yok mu?' : 'Zaten üye misin?'}</Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={[styles.switchTextBlue, { color: themeColors.tint }]}>{isLogin ? ' Kayıt Ol' : ' Giriş Yap'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#B3D9FF' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  logo: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#007AFF', marginBottom: 10, textShadowColor: 'rgba(255, 255, 255, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  title: { fontSize: 18, textAlign: 'center', marginBottom: 30, color: '#555' },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 15 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#f9f9f9', borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  passwordInput: { flex: 1, padding: 15, fontSize: 16 },
  showPasswordButton: { padding: 10, marginRight: 5 },
  eyeIcon: { width: 24, height: 24 },
  button: { backgroundColor: '#007AFF', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  switchTextNormal: { color: '#666', fontSize: 15 },
  switchTextBlue: { color: '#007AFF', fontSize: 15, fontWeight: 'bold' },
});