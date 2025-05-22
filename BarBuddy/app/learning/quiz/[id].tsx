import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quizzes } from '@/utils/learningData';

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  
  useEffect(() => {
    const foundQuiz = quizzes.find(q => q.id === id);
    if (foundQuiz) {
      setQuiz(foundQuiz);
      setSelectedAnswers(new Array(foundQuiz.questions.length).fill(-1));
    }
  }, [id]);
  
  const handleSelectAnswer = (answerIndex: number) => {
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newSelectedAnswers);
  };
  
  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
      setShowResult(true);
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
        }
      } catch (error) {
        console.error('Error saving quiz completion:', error);
      }
    }
  };
  
  if (!quiz) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }
  
  if (showResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#5c5c9a" />
          </TouchableOpacity>
          <Text style={styles.title}>Quiz Results</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.resultContainer}>
          <Text style={styles.scoreText}>{score}%</Text>
          <Text style={styles.resultTitle}>
            {score >= 70 ? 'Well Done!' : 'Try Again'}
          </Text>
          <Text style={styles.resultDescription}>
            {score >= 70 
              ? 'You passed the quiz!' 
              : 'You need 70% to pass. Keep learning!'}
          </Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const question = quiz.questions[currentQuestion];
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
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
        
        {question.answers.map((answer: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.answerOption,
              selectedAnswers[currentQuestion] === index && styles.selectedAnswer
            ]}
            onPress={() => handleSelectAnswer(index)}
          >
            <Text style={[
              styles.answerText,
              selectedAnswers[currentQuestion] === index && styles.selectedAnswerText
            ]}>
              {answer}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.button,
            selectedAnswers[currentQuestion] === -1 && styles.disabledButton
          ]}
          onPress={handleNext}
          disabled={selectedAnswers[currentQuestion] === -1}
        >
          <Text style={styles.buttonText}>
            {currentQuestion < quiz.questions.length - 1 ? 'Next' : 'Finish'}
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
  answerText: {
    fontSize: 16,
    color: '#333',
  },
  selectedAnswerText: {
    color: '#5c5c9a',
    fontWeight: '500',
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
});