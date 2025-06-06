import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { modules } from '@/utils/learningData';
import { moduleCompletionMessages } from '@/utils/completionMessages';
import { StatusBar } from 'react-native';

export default function ModuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [module, setModule] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

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
        setShowCompletionModal(true);
      } catch (error) {
        console.error('Error marking module as complete:', error);
      }
    } else {
      router.replace('/learning');
    }
  };

  const handleBackToHub = () => {
    setShowCompletionModal(false);
    router.replace('/learning');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#4CAF50';
    }
  };

  const getSectionEmoji = (index: number) => {
    const emojis = ['🔨', '🥃', '⚙️', '🧪', '📚', '🏆', '📖', '💡', '⭐'];
    return emojis[index] || '📖';
  };

  if (!module) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show completion modal
  if (showCompletionModal && id) {
    const completionData = moduleCompletionMessages[id as keyof typeof moduleCompletionMessages];

    return (
      <SafeAreaView style={styles.container}>
        {/* Status bar visible */}
	      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.modalOverlay}>
          <View style={styles.completionModal}>
            <Text style={styles.completionEmoji}>{completionData?.emoji || '🎉'}</Text>
            <Text style={styles.completionTitle}>Module Complete!</Text>
            <Text style={styles.completionSubtitle}>{completionData?.title}</Text>

            <View style={styles.learnedSection}>
              <Text style={styles.learnedTitle}>What you learned:</Text>
              {completionData?.learned.map((item, index) => (
                <Text key={index} style={styles.learnedItem}>• {item}</Text>
              ))}
            </View>

            <View style={styles.nextStepSection}>
              <Text style={styles.nextStepTitle}>🚀 Next Step:</Text>
              <Text style={styles.nextStepText}>{completionData?.nextStep}</Text>
            </View>

            <TouchableOpacity style={styles.modalBackButton} onPress={handleBackToHub}>
              <Text style={styles.backButtonText}>Back to Learning Hub</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Clean Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/learning')} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{module.title}</Text>
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor(module.level) }]}>
            <Text style={styles.levelBadgeText}>{module.level.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Text style={styles.heroEmoji}>{getSectionEmoji(0)}</Text>
          </View>
          <Text style={styles.moduleTitle}>{module.title.toUpperCase()}</Text>
          <Text style={styles.description}>{module.description}</Text>
        </View>

        {/* Section Cards */}
        <View style={styles.sectionsContainer}>
          {module.content.map((section: any, index: number) => (
            <View key={index} style={styles.sectionCard}>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEmoji}>{getSectionEmoji(index)}</Text>
                <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
              </View>

              {/* Section Content */}
              <View style={styles.sectionContent}>
                <Text style={styles.sectionText}>{section.text}</Text>

                {/* Enhanced Pro Tip */}
                {section.tips && (
                  <View style={styles.tipContainer}>
                    <View style={styles.tipHeader}>
                      <Text style={styles.tipEmoji}>💡</Text>
                      <Text style={styles.tipTitle}>PRO TIP</Text>
                    </View>
                    <Text style={styles.tipText}>{section.tips}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Clean Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, isCompleted && styles.completedButton]}
          onPress={handleComplete}
        >
          <View style={styles.buttonContent}>
            {isCompleted ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>MODULE COMPLETED ✓</Text>
              </>
            ) : (
              <>
                <Ionicons name="bookmark" size={20} color="#fff" />
                <Text style={styles.buttonText}>MARK AS COMPLETE</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 44,
    alignItems: 'center',
  },
  completedBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  heroIconContainer: {
    marginBottom: 20,
  },
  heroEmoji: {
    fontSize: 64,
  },
  moduleTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  description: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  sectionsContainer: {
    paddingHorizontal: 20,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1e293b',
    letterSpacing: 0.5,
    flex: 1,
  },
  sectionContent: {
    padding: 24,
  },
  sectionText: {
    fontSize: 17,
    color: '#374151',
    lineHeight: 28,
    fontWeight: '400',
    marginBottom: 20,
  },
  tipContainer: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 6,
    borderLeftColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#92400e',
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 16,
    color: '#92400e',
    lineHeight: 24,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completedButton: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  // COMPLETION MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    width: '100%',
    maxWidth: 400,
  },
  completionEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 24,
    textAlign: 'center',
  },
  learnedSection: {
    width: '100%',
    marginBottom: 24,
  },
  learnedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  learnedItem: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 6,
    lineHeight: 22,
  },
  nextStepSection: {
    width: '100%',
    marginBottom: 24,
  },
  nextStepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  nextStepText: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 12,
  },
  availableQuizzes: {
    marginTop: 8,
  },
  quizItem: {
    fontSize: 14,
    color: '#10b981',
    marginBottom: 4,
    fontWeight: '500',
  },
  modalBackButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});