import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quizzes } from '@/utils/learningData';
import { isQuizUnlocked, getLockedQuizMessage, isLastQuiz, finalCompletionMessage } from '@/utils/completionMessages';
import { StatusBar } from 'react-native';

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  const [showLockedMessage, setShowLockedMessage] = useState(false);
  const [showFinalCompletion, setShowFinalCompletion] = useState(false);
  
  useEffect(() => {
    checkQuizAccess();
  }, [id]);

  const checkQuizAccess = async () => {
    try {
      const completed = await AsyncStorage.getItem('completedQuizzes');
      const completedArray = completed ? JSON.parse(completed) : [];
      setCompletedQuizzes(completedArray);

      if (!isQuizUnlocked(id as string, completedArray)) {
        setShowLockedMessage(true);
        return;
      }

      const foundQuiz = quizzes.find(q => q.id === id);
      if (foundQuiz) {
        setQuiz(foundQuiz);
        setSelectedAnswers(new Array(foundQuiz.questions.length).fill(-1));
      }
    } catch (error) {
      console.error('Error checking quiz access:', error);
    }
  };
  
  const handleSelectAnswer = (answerIndex: number) => {
    if (showAnswerFeedback) return; // Prevent changing answer after feedback is shown
    
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newSelectedAnswers);
  };
  
  const handleNext = () => {
    if (!showAnswerFeedback) {
      // First click: Show answer feedback
      setShowAnswerFeedback(true);
    } else {
      // Second click: Move to next question or finish
      setShowAnswerFeedback(false);
      
      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        calculateScore();
        setShowResult(true);
      }
    }
  };
  
  const calculateScore = async () => {
    let correctAnswers = 0;
    quiz.questions.forEach((question: any, index: number) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    const calculatedScore = Math.round((correctAnswers / quiz.questions.length) * 100);
    setScore(calculatedScore);
    
    // Save quiz as completed if score >= 70%
    if (calculatedScore >= 70 && id) {
      try {
        const completed = await AsyncStorage.getItem('completedQuizzes');
        const completedArray = completed ? JSON.parse(completed) : [];
        if (!completedArray.includes(id)) {
          completedArray.push(id);
          await AsyncStorage.setItem('completedQuizzes', JSON.stringify(completedArray));
          
          // Check if this is the final quiz
          if (isLastQuiz(id as string)) {
            setShowFinalCompletion(true);
          }
        }
      } catch (error) {
        console.error('Error saving quiz completion:', error);
      }
    }
  };

  const handleTryAgain = () => {
    setShowResult(false);
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
    setScore(0);
    setShowAnswerFeedback(false);
  };

  const getAnswerStyle = (answerIndex: number) => {
    const question = quiz.questions[currentQuestion];
    const isSelected = selectedAnswers[currentQuestion] === answerIndex;
    const isCorrect = answerIndex === question.correctAnswer;
    
    if (!showAnswerFeedback) {
      // Before showing feedback, just show selected state
      return [
        styles.answerOption,
        isSelected && styles.selectedAnswer
      ];
    } else {
      // After showing feedback, highlight correct/incorrect
      if (isCorrect) {
        return [styles.answerOption, styles.correctAnswer];
      } else if (isSelected && !isCorrect) {
        return [styles.answerOption, styles.wrongAnswer];
      } else {
        return [styles.answerOption, styles.fadedAnswer];
      }
    }
  };

  const getAnswerTextStyle = (answerIndex: number) => {
    const question = quiz.questions[currentQuestion];
    const isSelected = selectedAnswers[currentQuestion] === answerIndex;
    const isCorrect = answerIndex === question.correctAnswer;
    
    if (!showAnswerFeedback) {
      return [
        styles.answerText,
        isSelected && styles.selectedAnswerText
      ];
    } else {
      if (isCorrect) {
        return [styles.answerText, styles.correctAnswerText];
      } else if (isSelected && !isCorrect) {
        return [styles.answerText, styles.wrongAnswerText];
      } else {
        return [styles.answerText, styles.fadedAnswerText];
      }
    }
  };
  
  // Show locked message
  if (showLockedMessage) {
    const lockedMessage = getLockedQuizMessage(id as string, completedQuizzes);
    
    return (
      <SafeAreaView style={styles.container}>
        {/* Status bar visible */}
	      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/learning')}>
            <Ionicons name="arrow-back" size={24} color="#5c5c9a" />
          </TouchableOpacity>
          <Text style={styles.title}>Quiz Locked</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedEmoji}>🔒</Text>
          <Text style={styles.lockedTitle}>{lockedMessage?.title}</Text>
          <Text style={styles.lockedMessage}>{lockedMessage?.message}</Text>
          
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>Current Progress:</Text>
            <Text style={styles.progressText}>
              {lockedMessage?.progress}: {lockedMessage?.currentProgress}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/learning')}>
            <Text style={styles.backButtonText}>Back to Learning Hub</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!quiz) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  // Show final completion message
  if (showFinalCompletion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.finalCompletionOverlay}>
          <View style={styles.finalCompletionModal}>
            <Text style={styles.finalCompletionEmoji}>{finalCompletionMessage.emoji}</Text>
            <Text style={styles.finalCompletionTitle}>{finalCompletionMessage.title}</Text>
            <Text style={styles.finalCompletionSubtitle}>{finalCompletionMessage.subtitle}</Text>
            
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Your Journey:</Text>
              {finalCompletionMessage.summary.map((item, index) => (
                <Text key={index} style={styles.summaryItem}>✅ {item}</Text>
              ))}
            </View>
            
            <View style={styles.masteredSection}>
              <Text style={styles.masteredTitle}>You've mastered:</Text>
              {finalCompletionMessage.mastered.map((item, index) => (
                <Text key={index} style={styles.masteredItem}>• {item}</Text>
              ))}
            </View>
            
            <Text style={styles.finalMessage}>{finalCompletionMessage.finalMessage}</Text>
            
            <TouchableOpacity style={styles.finalBackButton} onPress={() => router.replace('/learning')}>
              <Text style={styles.finalBackButtonText}>Back to Learning Hub</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  if (showResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/learning')}>
            <Ionicons name="arrow-back" size={24} color="#5c5c9a" />
          </TouchableOpacity>
          <Text style={styles.title}>Quiz Results</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.resultContainer}>
          <Text style={styles.scoreText}>{score}%</Text>
          <Text style={styles.resultTitle}>
            {score >= 70 ? 'Well Done!' : 'Keep Learning!'}
          </Text>
          <Text style={styles.resultDescription}>
            {score >= 70 
              ? 'You passed the quiz!' 
              : 'You need 70% to pass. Keep learning!'}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.replace('/learning')}
            >
              <Text style={styles.buttonText}>Back to Learning Hub</Text>
            </TouchableOpacity>
            
            {score < 70 && (
              <TouchableOpacity 
                style={[styles.button, styles.retryButton]}
                onPress={handleTryAgain}
              >
                <Text style={[styles.buttonText, styles.retryButtonText]}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  const question = quiz.questions[currentQuestion];
  const hasSelectedAnswer = selectedAnswers[currentQuestion] !== -1;
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/learning')}>
          <Ionicons name="arrow-back" size={24} color="#5c5c9a" />
        </TouchableOpacity>
        <Text style={styles.title}>{quiz.title}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }
          ]} 
        />
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.questionNumber}>
          Question {currentQuestion + 1} of {quiz.questions.length}
        </Text>
        <Text style={styles.questionText}>{question.text}</Text>
        
        {showAnswerFeedback && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>
              {selectedAnswers[currentQuestion] === question.correctAnswer 
                ? '✅ Correct!' 
                : '❌ Incorrect!'}
            </Text>
            {selectedAnswers[currentQuestion] !== question.correctAnswer && (
              <Text style={styles.correctAnswerLabel}>
                Correct answer: {question.answers[question.correctAnswer]}
              </Text>
            )}
          </View>
        )}
        
        {question.answers.map((answer: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={getAnswerStyle(index)}
            onPress={() => handleSelectAnswer(index)}
            disabled={showAnswerFeedback}
          >
            <View style={styles.answerContent}>
              <Text style={getAnswerTextStyle(index)}>
                {answer}
              </Text>
              {showAnswerFeedback && index === question.correctAnswer && (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              )}
              {showAnswerFeedback && 
               selectedAnswers[currentQuestion] === index && 
               index !== question.correctAnswer && (
                <Ionicons name="close-circle" size={20} color="#F44336" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.button,
            !hasSelectedAnswer && styles.disabledButton
          ]}
          onPress={handleNext}
          disabled={!hasSelectedAnswer}
        >
          <Text style={styles.buttonText}>
            {!showAnswerFeedback 
              ? (currentQuestion < quiz.questions.length - 1 ? 'Next' : 'Finish')
              : (currentQuestion < quiz.questions.length - 1 ? 'Continue' : 'Finish Quiz')
            }
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
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5c5c9a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  feedbackContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#5c5c9a',
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  correctAnswerLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  answerOption: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAnswer: {
    backgroundColor: '#e8f0fe',
    borderColor: '#5c5c9a',
  },
  correctAnswer: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  wrongAnswer: {
    backgroundColor: '#ffebee',
    borderColor: '#F44336',
  },
  fadedAnswer: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  answerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedAnswerText: {
    color: '#5c5c9a',
    fontWeight: '500',
  },
  correctAnswerText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  wrongAnswerText: {
    color: '#C62828',
    fontWeight: '500',
  },
  fadedAnswerText: {
    color: '#999',
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
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#5c5c9a',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  resultDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    backgroundColor: 'transparent',
    borderColor: '#5c5c9a',
    borderWidth: 2,
  },
  retryButtonText: {
    color: '#5c5c9a',
  },
  // LOCKED QUIZ STYLES
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockedEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  lockedMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  progressInfo: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // FINAL COMPLETION STYLES
  finalCompletionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  finalCompletionModal: {
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
    maxWidth: 420,
  },
  finalCompletionEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  finalCompletionTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  finalCompletionSubtitle: {
    fontSize: 16,
    color: '#6366f1',
    marginBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  summarySection: {
    width: '100%',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  summaryItem: {
    fontSize: 15,
    color: '#10b981',
    marginBottom: 6,
    fontWeight: '600',
  },
  masteredSection: {
    width: '100%',
    marginBottom: 20,
  },
  masteredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  masteredItem: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    lineHeight: 20,
  },
  finalMessage: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  finalBackButton: {
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
  finalBackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});