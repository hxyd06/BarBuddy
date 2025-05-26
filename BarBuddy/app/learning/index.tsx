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
  const [showAllModules, setShowAllModules] = useState(false);
  const [showAllQuizzes, setShowAllQuizzes] = useState(false);
  
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

  const renderModuleItem = (module: any) => (
    <TouchableOpacity
      key={module.id}
      style={styles.listItem}
      onPress={() => router.push(`/learning/module/${module.id}`)}
    >
      <View style={styles.listItemContent}>
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemTitle}>{module.title}</Text>
          {completedModules.includes(module.id) && (
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          )}
        </View>
        <Text style={styles.listItemDescription} numberOfLines={2}>
          {module.description}
        </Text>
        <View style={[styles.levelBadge, { backgroundColor: getLevelColor(module.level) }]}>
          <Text style={styles.levelBadgeText}>{module.level}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderQuizItem = (quiz: any) => (
    <TouchableOpacity
      key={quiz.id}
      style={styles.listItem}
      onPress={() => router.push(`/learning/quiz/${quiz.id}`)}
    >
      <View style={styles.listItemContent}>
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemTitle}>{quiz.title}</Text>
          {completedQuizzes.includes(quiz.id) && (
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          )}
        </View>
        <Text style={styles.listItemDescription} numberOfLines={2}>
          {quiz.description}
        </Text>
        <View style={styles.quizMetadata}>
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor(quiz.difficulty) }]}>
            <Text style={styles.levelBadgeText}>{quiz.difficulty}</Text>
          </View>
          <Text style={styles.questionCount}>{quiz.questions.length} questions</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.title}>Learning Hub</Text>
        <TouchableOpacity onPress={handleResetProgress} style={styles.resetButton}>
          <Ionicons name="refresh-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Progress Section */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressTitle}>Your Learning Journey</Text>
          
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
              {Math.round(getOverallProgress())}% Complete • {completedModules.length + completedQuizzes.length}/{modules.length + quizzes.length} Items
            </Text>
          </View>
        </View>

        {/* Modules Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="school" size={28} color="#6366f1" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Learning Modules</Text>
                <Text style={styles.cardSubtitle}>
                  {modules.length} Available • {completedModules.length} Completed
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => setShowAllModules(!showAllModules)}
            >
              <Text style={styles.expandButtonText}>
                {showAllModules ? 'Show Less' : 'View All'}
              </Text>
              <Ionicons 
                name={showAllModules ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#6366f1" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(completedModules.length / modules.length) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((completedModules.length / modules.length) * 100)}%
            </Text>
          </View>

          {showAllModules && (
            <View style={styles.expandedContent}>
              {modules.map(renderModuleItem)}
            </View>
          )}

          {!showAllModules && (
            <View style={styles.previewContent}>
              <Text style={styles.previewText}>
                Master bartending fundamentals through comprehensive modules covering tools, techniques, and advanced mixology.
              </Text>
            </View>
          )}
        </View>

        {/* Quizzes Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconContainer}>
               <Ionicons name="school" size={28} color="#10b981" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Knowledge Quizzes</Text>
                <Text style={styles.cardSubtitle}>
                  {quizzes.length} Available • {completedQuizzes.length} Completed
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => setShowAllQuizzes(!showAllQuizzes)}
            >
              <Text style={styles.expandButtonText}>
                {showAllQuizzes ? 'Show Less' : 'View All'}
              </Text>
              <Ionicons 
                name={showAllQuizzes ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#10b981" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(completedQuizzes.length / quizzes.length) * 100}%`,
                    backgroundColor: '#10b981'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((completedQuizzes.length / quizzes.length) * 100)}%
            </Text>
          </View>

          {showAllQuizzes && (
            <View style={styles.expandedContent}>
              {quizzes.map(renderQuizItem)}
            </View>
          )}

          {!showAllQuizzes && (
            <View style={styles.previewContent}>
              <Text style={styles.previewText}>
                Test your bartending knowledge with interactive quizzes covering beginner to advanced concepts.
              </Text>
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  resetButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#fef2f2',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  overallProgressSection: {
    alignItems: 'center',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  levelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  largeProgressBar: {
    height: 12,
    width: '100%',
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  largeProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginRight: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    minWidth: 35,
  },
  previewContent: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  listItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  listItemContent: {
    padding: 16,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  listItemDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  quizMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});