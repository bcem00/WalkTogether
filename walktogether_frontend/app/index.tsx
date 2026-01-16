import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme
} from 'react-native';
import { Colors } from '../constants/theme';
import { authApi, getUserInfoFromToken } from './apiClient'; // getUserInfoFromToken eklendi

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const validateEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleAction = async () => {
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
        // loginWithStorage: Token'ı alır, decode eder ve AsyncStorage'a (userToken, userRole vb.) kaydeder.
        const result = await authApi.loginWithStorage({ identifier: username, password });

        if (result.data) {
          // ✅ DOĞRU YÖNTEM: Rolü token'dan alıyoruz
          const userInfo = getUserInfoFromToken(result.data.token);
          const role = userInfo.role; 

          // Rol kontrolüne göre yönlendirme
          if (role === 'admin') {
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView contentContainerStyle={[styles.inner, { backgroundColor: themeColors.background }]}>
        <Image
          source={require('../assets/images/walktogether-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: themeColors.text }]}>{isLogin ? 'Oturum Aç' : 'Hesap Oluştur'}</Text>

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
            <TextInput 
              style={[styles.passwordInput, { color: themeColors.text }]} 
              placeholder="••••••••" 
              placeholderTextColor={themeColors.placeholder}
              value={password} 
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showPasswordButton}>
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
  container: { flex: 1 },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  logoImage: { width: 300, height: 150, alignSelf: 'center', marginBottom: 5 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, marginLeft: 5 },
  input: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderRadius: 10, borderWidth: 1 },
  passwordInput: { flex: 1, padding: 15, fontSize: 16 },
  showPasswordButton: { padding: 10 },
  eyeIcon: { fontSize: 20 },
  button: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { fontWeight: 'bold', fontSize: 16 },
  switchContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  switchTextNormal: { fontSize: 15 },
  switchTextBlue: { fontSize: 15, fontWeight: 'bold' },
});