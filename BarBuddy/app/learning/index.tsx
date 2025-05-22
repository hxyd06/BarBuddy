import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { modules, quizzes } from '@/utils/learningData';

export default function LearningHub() {
  const router = useRouter();
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  
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
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#4CAF50';
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#5c5c9a" />
        </TouchableOpacity>
        <Text style={styles.title}>Learning Hub</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.progressContainer}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <Text style={styles.progressText}>
            Modules: {completedModules.length}/{modules.length}
          </Text>
          <Text style={styles.progressText}>
            Quizzes: {completedQuizzes.length}/{quizzes.length}
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>Learning Modules</Text>
        {modules.map(module => (
          <TouchableOpacity
            key={module.id}
            style={styles.card}
            onPress={() => router.push(`/learning/module/${module.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{module.title}</Text>
              {completedModules.includes(module.id) && (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              )}
            </View>
            <Text style={styles.cardDescription}>{module.description}</Text>
            <View style={[styles.badge, { backgroundColor: getLevelColor(module.level) }]}>
              <Text style={styles.badgeText}>{module.level}</Text>
            </View>
          </TouchableOpacity>
        ))}
        
        <Text style={styles.sectionTitle}>Quizzes</Text>
        {quizzes.map(quiz => (
          <TouchableOpacity
            key={quiz.id}
            style={styles.card}
            onPress={() => router.push(`/learning/quiz/${quiz.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{quiz.title}</Text>
              {completedQuizzes.includes(quiz.id) && (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              )}
            </View>
            <Text style={styles.cardDescription}>{quiz.description}</Text>
            <Text style={styles.questionCount}>
              {quiz.questions.length} questions
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5c5c9a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    backgroundColor: '#f0f0f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5c5c9a',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  questionCount: {
    fontSize: 12,
    color: '#666',
  },
});