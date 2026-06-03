import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '@/api/client';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Option = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  text: string;
  options: Option[];
  correctOptionId: string;
  explanation?: string;
};

type Exam = {
  id: string;
  title: string;
  durationMinutes: number;
  questions: Question[];
};

export default function ExamScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await apiClient.get(`/exams/${id}`);
        const examData = response.data;
        setExam(examData);
        setTimeLeft(examData.durationMinutes * 60);
      } catch (err) {
        console.warn('Failed to fetch exam, using mock data.');
        // Mock data for development
        const mockExam: Exam = {
          id: id as string,
          title: 'NEET PG Grand Mock Test',
          durationMinutes: 10,
          questions: [
            {
              id: 'q1',
              text: 'A 45-year-old male presents with acute chest pain radiating to the left arm. What is the most immediate diagnostic test to perform?',
              options: [
                { id: 'o1', text: 'Chest X-Ray' },
                { id: 'o2', text: 'Electrocardiogram (ECG)' },
                { id: 'o3', text: 'Echocardiogram' },
                { id: 'o4', text: 'CT Pulmonary Angiography' }
              ],
              correctOptionId: 'o2',
              explanation: 'An ECG is the most rapid and essential initial test to rule out myocardial infarction.'
            },
            {
              id: 'q2',
              text: 'Which of the following is the most common cause of community-acquired pneumonia in adults?',
              options: [
                { id: 'o1', text: 'Haemophilus influenzae' },
                { id: 'o2', text: 'Staphylococcus aureus' },
                { id: 'o3', text: 'Streptococcus pneumoniae' },
                { id: 'o4', text: 'Mycoplasma pneumoniae' }
              ],
              correctOptionId: 'o3',
              explanation: 'Streptococcus pneumoniae accounts for the vast majority of community-acquired pneumonia cases in typical adult populations.'
            },
            {
              id: 'q3',
              text: 'What is the primary mechanism of action of Omeprazole?',
              options: [
                { id: 'o1', text: 'H2 receptor antagonism' },
                { id: 'o2', text: 'Proton pump inhibition' },
                { id: 'o3', text: 'Antacid neutralization' },
                { id: 'o4', text: 'Prostaglandin analog' }
              ],
              correctOptionId: 'o2',
              explanation: 'Omeprazole is a proton pump inhibitor (PPI) that blocks the H+/K+ ATPase in gastric parietal cells.'
            }
          ]
        };
        setExam(mockExam);
        setTimeLeft(mockExam.durationMinutes * 60);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id]);

  useEffect(() => {
    if (exam && !isSubmitted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [exam, isSubmitted, timeLeft]);

  const handleSelectOption = (optionId: string) => {
    if (isSubmitted) return;
    const questionId = exam!.questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = () => {
    if (!exam) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    let calculatedScore = 0;
    exam.questions.forEach(q => {
      if (answers[q.id] === q.correctOptionId) {
        calculatedScore += 1;
      }
    });
    setScore(calculatedScore);
    setIsSubmitted(true);
  };

  const promptSubmit = () => {
    Alert.alert(
      "Submit Exam?",
      "Are you sure you want to submit your exam? You cannot change your answers after submission.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: handleSubmit, style: "destructive" }
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!exam) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: '#ff3b30' }}>Exam not found.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: colors.tint }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];

  if (isSubmitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Exam Results</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.tint, fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={[styles.scoreCard, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.scoreLabel, { color: colors.text }]}>Your Score</Text>
            <Text style={[styles.scoreValue, { color: colors.tint }]}>
              {score} / {exam.questions.length}
            </Text>
            <Text style={{ color: colors.text, opacity: 0.7, marginTop: 10 }}>
              {Math.round((score / exam.questions.length) * 100)}% Accuracy
            </Text>
          </View>
          
          <Text style={[styles.reviewTitle, { color: colors.text }]}>Review Answers</Text>
          {exam.questions.map((q, idx) => {
            const isCorrect = answers[q.id] === q.correctOptionId;
            const notAnswered = !answers[q.id];
            return (
              <View key={q.id} style={[styles.reviewCard, { backgroundColor: colors.backgroundElement }]}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewQNum, { color: colors.text }]}>Question {idx + 1}</Text>
                  <Text style={{ fontWeight: 'bold', color: isCorrect ? '#34c759' : notAnswered ? '#8e8e93' : '#ff3b30' }}>
                    {isCorrect ? 'Correct' : notAnswered ? 'Skipped' : 'Incorrect'}
                  </Text>
                </View>
                <Text style={[styles.questionText, { color: colors.text, fontSize: 14 }]}>{q.text}</Text>
                
                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: colors.text, opacity: 0.7, fontSize: 12 }}>Your Answer:</Text>
                  <Text style={{ color: isCorrect ? '#34c759' : '#ff3b30', fontWeight: 'bold', marginBottom: 5 }}>
                    {notAnswered ? 'None' : q.options.find(o => o.id === answers[q.id])?.text}
                  </Text>
                  
                  {!isCorrect && (
                    <>
                      <Text style={{ color: colors.text, opacity: 0.7, fontSize: 12 }}>Correct Answer:</Text>
                      <Text style={{ color: '#34c759', fontWeight: 'bold' }}>
                        {q.options.find(o => o.id === q.correctOptionId)?.text}
                      </Text>
                    </>
                  )}
                </View>
                
                {q.explanation && (
                  <View style={styles.explanationBox}>
                    <Text style={{ fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>Explanation:</Text>
                    <Text style={{ color: colors.text, opacity: 0.8, fontSize: 13 }}>{q.explanation}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.examTitle, { color: colors.text }]}>{exam.title}</Text>
          <Text style={{ color: colors.text, opacity: 0.6 }}>
            Question {currentQuestionIndex + 1} of {exam.questions.length}
          </Text>
        </View>
        <View style={[styles.timerBadge, { backgroundColor: timeLeft < 60 ? '#ff3b3020' : colors.tint + '20' }]}>
          <Text style={{ color: timeLeft < 60 ? '#ff3b30' : colors.tint, fontWeight: 'bold' }}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.questionText, { color: colors.text }]}>
          {currentQuestion.text}
        </Text>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map(option => {
            const isSelected = answers[currentQuestion.id] === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  { backgroundColor: colors.backgroundElement, borderColor: isSelected ? colors.tint : 'transparent' },
                  isSelected && { backgroundColor: colors.tint + '10' }
                ]}
                onPress={() => handleSelectOption(option.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.radioCircle, { borderColor: isSelected ? colors.tint : '#888' }]}>
                  {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.tint }]} />}
                </View>
                <Text style={[styles.optionText, { color: colors.text }]}>{option.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.backgroundElement }]}>
        <TouchableOpacity 
          style={[styles.navButton, { opacity: currentQuestionIndex === 0 ? 0.3 : 1 }]}
          disabled={currentQuestionIndex === 0}
          onPress={() => setCurrentQuestionIndex(prev => prev - 1)}
        >
          <Text style={[styles.navButtonText, { color: colors.text }]}>Previous</Text>
        </TouchableOpacity>

        {currentQuestionIndex === exam.questions.length - 1 ? (
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#34c759' }]} onPress={promptSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.navButton, { backgroundColor: colors.tint }]}
            onPress={() => setCurrentQuestionIndex(prev => prev + 1)}
          >
            <Text style={[styles.navButtonText, { color: '#fff' }]}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  examTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scrollContent: {
    padding: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 30,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  radioDot: {
    height: 12,
    width: 12,
    borderRadius: 6,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreCard: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    marginBottom: 30,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewQNum: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  explanationBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  }
});
