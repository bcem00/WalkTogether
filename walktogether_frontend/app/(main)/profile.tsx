import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { authApi } from '../apiClient';

export default function ProfileScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    identifier: '',
    password: '',
    firstName: '',
    lastName: '',
    username: '',
    email: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async () => {
    if (isLogin) {
      const result = await authApi.login({ identifier: form.identifier, password: form.password });
      if (result.data) {
        Alert.alert('Success', 'Logged in successfully!');
  
      } else {
        Alert.alert('Error', result.error || 'Login failed');
      }
    } else {
      const result = await authApi.register({
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        email: form.email,
        password: form.password,
      });
      if (result.data) {
        Alert.alert('Success', 'Registered successfully!');
      } else {
        Alert.alert('Error', result.error || 'Registration failed');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>

      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={form.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={form.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={form.username}
            onChangeText={(value) => handleInputChange('username', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={form.email}
            onChangeText={(value) => handleInputChange('email', value)}
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder={isLogin ? "Email or Username" : "Password"}
        value={form.identifier}
        onChangeText={(value) => handleInputChange('identifier', value)}
        secureTextEntry={!isLogin}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={form.password}
        onChangeText={(value) => handleInputChange('password', value)}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Register'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  button: { backgroundColor: '#007bff', padding: 15, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#fff', fontSize: 16 },
  switchText: { color: '#007bff', textAlign: 'center' },
});