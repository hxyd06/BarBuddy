import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LearningHubCard() {
  const router = useRouter();
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  
  const totalModules = 9;
  const totalQuizzes = 6;
  
  const loadProgress = useCallback(async () => {
    try {
      const modules = await AsyncStorage.getItem('completedModules');
      const quizzes = await AsyncStorage.getItem('completedQuizzes');
      
      // KEY FIX: Always set state, whether data exists or not
      setCompletedModules(modules ? JSON.parse(modules) : []);
      setCompletedQuizzes(quizzes ? JSON.parse(quizzes) : []);
    } catch (error) {
      console.error('Error loading progress:', error);
      // On error, reset to empty arrays
      setCompletedModules([]);
      setCompletedQuizzes([]);
    }
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );
  
  const getUserLevel = () => {
    const totalCompleted = completedModules.length + completedQuizzes.length;
    if (totalCompleted === 0) return 'Beginner';
    if (totalCompleted <= 4) return 'Beginner';
    if (totalCompleted <= 9) return 'Intermediate';
    return 'Advanced';
  };

  const getLevelColor = () => {
    const level = getUserLevel();
    switch (level) {
      case 'Beginner': return '#4CAF50';
      case 'Intermediate': return '#FF9800';
      case 'Advanced': return '#F44336';
      default: return '#4CAF50';
    }
  };
  
  const moduleProgress = (completedModules.length / totalModules) * 100;
  const quizProgress = (completedQuizzes.length / totalQuizzes) * 100;
  
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity 
        style={styles.container} 
        onPress={() => router.push('/learning')}
      >
        {/* Header with gradient-like background */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Ionicons name="school" size={28} color="#fff" />
              <Text style={styles.title}>Learning Hub</Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor() }]}>
              <Text style={styles.levelText}>{getUserLevel()}</Text>
            </View>
          </View>
        </View>

        {/* Progress Content */}
        <View style={styles.progressContent}>
          <Text style={styles.progressTitle}>Your Progress</Text>
          
          <View style={styles.progressRow}>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Modules</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${moduleProgress}%` }]} />
              </View>
              <Text style={styles.progressCount}>{completedModules.length}/{totalModules}</Text>
            </View>
            
            <View style={styles.progressDivider} />
            
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Quizzes</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${quizProgress}%` }]} />
              </View>
              <Text style={styles.progressCount}>{completedQuizzes.length}/{totalQuizzes}</Text>
            </View>
          </View>
          
          <View style={styles.actionRow}>
            <Ionicons name="arrow-forward-circle" size={20} color="#6366f1" />
            <Text style={styles.actionText}>Tap to continue</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginTop: 40, // More space from reviews above
    marginBottom: 50,
    paddingHorizontal: 8, // Wider card
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerSection: {
    backgroundColor: '#6366f1', // Distinct indigo color
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContent: {
    padding: 20,
    backgroundColor: '#f8fafc', // Light gray background
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#d1d5db',
    marginHorizontal: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1', // Matching the header color
    borderRadius: 6,
  },
  progressCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
    marginLeft: 8,
  },
});