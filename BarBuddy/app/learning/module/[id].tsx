import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { modules } from '@/utils/learningData';

export default function ModuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [module, setModule] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  
  useEffect(() => {
    const foundModule = modules.find(m => m.id === id);
    setModule(foundModule);
    checkIfCompleted();
  }, [id]);
  
  const checkIfCompleted = async () => {
    try {
      const completed = await AsyncStorage.getItem('completedModules');
      if (completed) {
        const completedArray = JSON.parse(completed);
        setIsCompleted(completedArray.includes(id));
      }
    } catch (error) {
      console.error('Error checking completion status:', error);
    }
  };
  
  const handleComplete = async () => {
    if (id && !isCompleted) {
      try {
        const completed = await AsyncStorage.getItem('completedModules');
        const completedArray = completed ? JSON.parse(completed) : [];
        completedArray.push(id);
        await AsyncStorage.setItem('completedModules', JSON.stringify(completedArray));
        setIsCompleted(true);
      } catch (error) {
        console.error('Error marking module as complete:', error);
      }
    }
    router.back();
  };
  
  if (!module) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#5c5c9a" />
        </TouchableOpacity>
        <Text style={styles.title}>{module.title}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.moduleTitle}>{module.title}</Text>
        <Text style={styles.description}>{module.description}</Text>
        
        {module.content.map((section: any, index: number) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionText}>{section.text}</Text>
            {section.tips && (
              <View style={styles.tipContainer}>
                <Text style={styles.tipTitle}>💡 Pro Tip</Text>
                <Text style={styles.tipText}>{section.tips}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, isCompleted && styles.completedButton]}
          onPress={handleComplete}
        >
          <Text style={styles.buttonText}>
            {isCompleted ? 'Completed ✓' : 'Mark as Complete'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5c5c9a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  moduleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  tipContainer: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#2E7D32',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#5c5c9a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completedButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});