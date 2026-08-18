import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import { authService } from '../../services/api/auth';
import { AuthContext } from '../../App';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      signIn(data.token);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50 justify-center px-6"
    >
      <View className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
            <Lock color="#15803d" size={32} />
          </View>
          <Text className="text-2xl font-bold text-gray-900">Admin Login</Text>
          <Text className="text-gray-500 mt-2">Sign in to manage attendance</Text>
        </View>

        {error ? (
          <View className="mb-6 p-4 bg-red-50 rounded-xl flex-row items-center gap-3">
            <AlertCircle color="#b91c1c" size={20} />
            <Text className="text-red-700 text-sm font-medium flex-1">{error}</Text>
          </View>
        ) : null}

        <View className="space-y-4 mb-6">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Email Address</Text>
            <View className="relative flex-row items-center border border-gray-200 rounded-xl bg-gray-50 px-3 py-3">
              <Mail color="#9ca3af" size={20} className="mr-2" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="admin@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 text-base text-gray-900"
              />
            </View>
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
            <View className="relative flex-row items-center border border-gray-200 rounded-xl bg-gray-50 px-3 py-3">
              <Lock color="#9ca3af" size={20} className="mr-2" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                className="flex-1 text-base text-gray-900"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                {showPassword ? <EyeOff color="#9ca3af" size={20} /> : <Eye color="#9ca3af" size={20} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleLogin}
          disabled={loading}
          className={`bg-green-600 rounded-xl py-4 items-center justify-center flex-row ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" className="mr-2" />
          ) : null}
          <Text className="text-white font-bold text-lg">{loading ? 'Signing in...' : 'Login'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
