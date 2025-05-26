import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { modules, quizzes } from '@/utils/learningData';

export default function LearningHub() {
  const router = useRouter();
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  
  const loadProgress = useCallback(async () => {
    try {
      const modules = await AsyncStorage.getItem('completedModules');
      const quizzes = await AsyncStorage.getItem('completedQuizzes');
      
      if (modules) setCompletedModules(JSON.parse(modules));
      if (quizzes) setCompletedQuizzes(JSON.parse(quizzes));
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  const handleResetProgress = () => {
    Alert.alert(
      "Reset Progress",
      "Are you sure? You will lose all progress if you proceed.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('completedModules');
              await AsyncStorage.removeItem('completedQuizzes');
              setCompletedModules([]);
              setCompletedQuizzes([]);
              Alert.alert("Success", "All progress has been reset.");
            } catch (error) {
              console.error('Error resetting progress:', error);
              Alert.alert("Error", "Failed to reset progress. Please try again.");
            }
          }
        }
      ]
    );
  };
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#4CAF50';
    }
  };

  const getOverallProgress = () => {
    const totalItems = modules.length + quizzes.length;
    const completedItems = completedModules.length + completedQuizzes.length;
    return (completedItems / totalItems) * 100;
  };

  const getProgressColor = () => {
    const progress = getOverallProgress();
    if (progress < 30) return '#F44336'; // Red
    if (progress < 70) return '#FF9800'; // Orange
    return '#4CAF50'; // Green
  };

  const getProgressLevel = () => {
    const progress = getOverallProgress();
    if (progress < 30) return 'Beginner';
    if (progress < 70) return 'Intermediate';
    return 'Advanced';
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#5c5c9a" />
        </TouchableOpacity>
        <Text style={styles.title}>Learning Hub</Text>
        <TouchableOpacity onPress={handleResetProgress} style={styles.resetButton}>
          <Ionicons name="refresh-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Enhanced Progress Section */}
        <View style={styles.progressContainer}>
          <Text style={styles.sectionTitle}>Your Learning Journey</Text>
          
          {/* Overall Progress Bar */}
          <View style={styles.overallProgressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <Text style={[styles.levelText, { color: getProgressColor() }]}>
                {getProgressLevel()}
              </Text>
            </View>
            <View style={styles.largeProgressBar}>
              <View 
                style={[
                  styles.largeProgressFill, 
                  { 
                    width: `${getOverallProgress()}%`,
                    backgroundColor: getProgressColor()
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressPercentage}>
              {Math.round(getOverallProgress())}% Complete
            </Text>
          </View>

          {/* Individual Progress Bars */}
          <View style={styles.individualProgress}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Modules</Text>
              <View style={styles.progressBarSmall}>
                <View 
                  style={[
                    styles.progressFillSmall, 
                    { width: `${(completedModules.length / modules.length) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressCount}>
                {completedModules.length}/{modules.length}
              </Text>
            </View>
            
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Quizzes</Text>
              <View style={styles.progressBarSmall}>
                <View 
                  style={[
                    styles.progressFillSmall, 
                    { width: `${(completedQuizzes.length / quizzes.length) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressCount}>
                {completedQuizzes.length}/{quizzes.length}
              </Text>
            </View>
          </View>
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
        
        <Text style={styles.sectionTitle}>Knowledge Tests</Text>
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
            <View style={styles.quizInfo}>
              <View style={[styles.badge, { backgroundColor: getLevelColor(quiz.difficulty) }]}>
                <Text style={styles.badgeText}>{quiz.difficulty}</Text>
              </View>
              <Text style={styles.questionCount}>
                {quiz.questions.length} questions
              </Text>
            </View>
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
  resetButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#ffebee',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5c5c9a',
    marginBottom: 16,
  },
  overallProgressSection: {
    marginBottom: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  largeProgressBar: {
    height: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  largeProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressPercentage: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  individualProgress: {
    gap: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarSmall: {
    flex: 1,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: '#5c5c9a',
    borderRadius: 4,
  },
  progressCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
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
  quizInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  questionCount: {
    fontSize: 12,
    color: '#666',
  },
});