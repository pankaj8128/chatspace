import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const AuthScreen = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const { login, register, loginAsGuest, loading, error, clearError } = useAuth();

  useEffect(() => {
    clearError();
    setLocalError('');
  }, [mode, clearError]);

  const validate = () => {
    if (!username.trim()) return 'Username is required';
    if (username.trim().length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return 'Only letters, numbers and underscores';
    if (!password) return 'Password is required';
    if (mode === 'register' && password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError('');
    if (mode === 'login') {
      await login(username.trim(), password);
    } else {
      await register(username.trim(), password);
    }
  };

  const handleGuestLogin = async () => {
    setLocalError('');
    await loginAsGuest();
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandIcon}>◈</Text>
            <Text style={styles.brandName}>ChatSpace</Text>
          </View>

          {/* Toggle Switch */}
          <View style={styles.toggleContainer}>
            <View style={[styles.toggleSlider, mode === 'register' && styles.toggleSliderRight]} />
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => setMode('login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => setMode('register')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>USERNAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. panky_dev"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setLocalError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setLocalError('');
                }}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {!!displayError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠ {displayError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {mode === 'login' ? 'Enter ChatSpace' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.secondaryButton, loading && styles.disabledButton]}
            onPress={handleGuestLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <Text style={styles.secondaryButtonText}>Continue as Guest</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {mode === 'login' ? 'No account? ' : 'Already have one? '}
            </Text>
            <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
              <Text style={styles.footerLink}>
                {mode === 'login' ? 'Register here' : 'Sign in'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  brandIcon: {
    fontSize: 24,
    color: '#2563eb',
    marginRight: 10,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#111827',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 3,
    marginBottom: 28,
    position: 'relative',
  },
  toggleSlider: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: '50%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 6,
  },
  toggleSliderRight: {
    left: '50%',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  toggleTextActive: {
    color: '#111827',
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#9ca3af',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: '#111827',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  footerLink: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
});

export default AuthScreen;
