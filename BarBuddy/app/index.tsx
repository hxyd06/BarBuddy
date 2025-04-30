import { useAuth } from '@/context/authContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const { user, authInitialized } = useAuth();

  useEffect(() => {
    if (!authInitialized) return; // ⏳ Wait until auth is ready
  
    if (user) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/auth/login');
    }
  }, [authInitialized, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}