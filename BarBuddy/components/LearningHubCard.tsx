import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LearningHubCard() {
  const router = useRouter();
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  
  const totalModules = 3;
  const totalQuizzes = 2;
  
  useEffect(() => {
    loadProgress();
  }, []);
  
  const loadProgress = async () => {
    try {
      const modules = await AsyncStorage.getItem('completedModules');
      const quizzes = await AsyncStorage.getItem('completedQuizzes');
      
      if (modules) setCompletedModules(JSON.parse(modules));
      if (quizzes) setCompletedQuizzes(JSON.parse(quizzes));
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };
  
  const getUserLevel = () => {
    const totalCompleted = completedModules.length + completedQuizzes.length;
    if (totalCompleted === 0) return 'Beginner';
    if (totalCompleted <= 2) return 'Beginner';
    if (totalCompleted <= 4) return 'Intermediate';
    return 'Advanced';
  };
  
  const moduleProgress = (completedModules.length / totalModules) * 100;
  const quizProgress = (completedQuizzes.length / totalQuizzes) * 100;
  
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => router.push('/learning')}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Learning Hub</Text>
        <Ionicons name="school-outline" size={24} color="#5c5c9a" />
      </View>
      
      <Text style={styles.level}>Current Level: {getUserLevel()}</Text>
      
      <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>Modules: {completedModules.length}/{totalModules}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${moduleProgress}%` }]} />
        </View>
      </View>
      
      <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>Quizzes: {completedQuizzes.length}/{totalQuizzes}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${quizProgress}%` }]} />
        </View>
      </View>
      
      <Text style={styles.subtitle}>Tap to continue learning</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f9',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5c5c9a',
  },
  level: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5c5c9a',
    borderRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});