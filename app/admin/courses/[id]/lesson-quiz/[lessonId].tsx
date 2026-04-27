import { Button } from '@/components/shared';
import { fieldPlain } from '@/constants/theme';
import { asSingleParam } from '@/lib/expoParams';
import { createLessonQuiz, getQuizEditorBundleByLesson, updateLessonQuiz } from '@/services/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminLessonQuizEditorScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id: courseIdParam, lessonId: lessonIdParam } = useLocalSearchParams<{
    id: string | string[];
    lessonId: string | string[];
  }>();
  const courseId = useMemo(() => asSingleParam(courseIdParam), [courseIdParam]);
  const lessonId = useMemo(() => asSingleParam(lessonIdParam), [lessonIdParam]);

  const [quizTitle, setQuizTitle] = useState('');
  const [quizPassScore, setQuizPassScore] = useState('60');
  const [questions, setQuestions] = useState<
    Array<{
      id?: string;
      text: string;
      options: [string, string, string, string];
      correctOption: 'A' | 'B' | 'C' | 'D';
    }>
  >([{ text: '', options: ['', '', '', ''], correctOption: 'A' }]);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  const { data: existingQuiz, isLoading: quizLoading, refetch: refetchQuiz } = useQuery({
    queryKey: ['admin-lesson-quiz-editor', lessonId],
    queryFn: () => getQuizEditorBundleByLesson(lessonId),
    enabled: !!lessonId,
  });

  useEffect(() => {
    if (!existingQuiz) {
      setQuizTitle('');
      setQuizPassScore('60');
      setQuestions([{ text: '', options: ['', '', '', ''], correctOption: 'A' }]);
      return;
    }
    setQuizTitle(existingQuiz.title ?? '');
    setQuizPassScore(String(existingQuiz.pass_score ?? 60));
    const editorQuestions = existingQuiz.questions.map((question) => {
      const sortedOptions = [...(question.options ?? [])].sort((a, b) => a.order_index - b.order_index);
      const correctIndex = sortedOptions.findIndex((option) => option.is_correct);
      return {
        id: question.id,
        text: question.text ?? '',
        options: [
          sortedOptions[0]?.text ?? '',
          sortedOptions[1]?.text ?? '',
          sortedOptions[2]?.text ?? '',
          sortedOptions[3]?.text ?? '',
        ] as [string, string, string, string],
        correctOption: (['A', 'B', 'C', 'D'][correctIndex] as 'A' | 'B' | 'C' | 'D') || 'A',
      };
    });
    setQuestions(editorQuestions.length ? editorQuestions : [{ text: '', options: ['', '', '', ''], correctOption: 'A' }]);
  }, [existingQuiz?.id]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { text: '', options: ['', '', '', ''], correctOption: 'A' }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const setQuestionText = (index: number, text: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, text } : q)));
  };

  const setQuestionOption = (questionIndex: number, optionIndex: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options.map((option, oi) => (oi === optionIndex ? text : option)) as [string, string, string, string],
            }
          : q
      )
    );
  };

  const setQuestionCorrectOption = (questionIndex: number, value: 'A' | 'B' | 'C' | 'D') => {
    setQuestions((prev) => prev.map((q, i) => (i === questionIndex ? { ...q, correctOption: value } : q)));
  };

  const onSaveQuiz = async () => {
    if (!lessonId) {
      Alert.alert('Missing lesson', 'Open this screen from a lesson to continue.');
      return;
    }
    const titleTrimmed = quizTitle.trim();
    if (!titleTrimmed) {
      Alert.alert('Missing fields', 'Please add a quiz title.');
      return;
    }
    const passScore = Number.parseInt(quizPassScore.trim(), 10);
    if (!Number.isFinite(passScore) || passScore < 0 || passScore > 100) {
      Alert.alert('Invalid pass score', 'Pass score must be between 0 and 100.');
      return;
    }

    const questionPayload = questions
      .map((question) => ({
        id: question.id,
        text: question.text.trim(),
        options: question.options.map((option, idx) => ({
          text: option.trim(),
          isCorrect: ['A', 'B', 'C', 'D'][idx] === question.correctOption,
        })),
      }))
      .filter((question) => question.text.length > 0);
    if (questionPayload.length === 0) {
      Alert.alert('Missing questions', 'Please add at least one question.');
      return;
    }
    for (const question of questionPayload) {
      const validOptions = question.options.filter((option) => option.text.length > 0);
      if (validOptions.length < 2) {
        Alert.alert('More options needed', 'Each question needs at least two answer options.');
        return;
      }
      if (!validOptions.some((option) => option.isCorrect)) {
        Alert.alert('Select correct answer', 'Each question needs a correct answer.');
        return;
      }
    }

    setIsSavingQuiz(true);
    try {
      if (!existingQuiz) {
        const created = await createLessonQuiz({
          lessonId,
          title: titleTrimmed,
          passScore,
          questions: questionPayload.map((question) => ({
            text: question.text,
            options: question.options,
          })),
        });
        if (!created) throw new Error('Quiz could not be created.');
        Alert.alert('Quiz created', 'Students can now write this quiz after the lesson.');
      } else {
        const updated = await updateLessonQuiz({
          quizId: existingQuiz.id,
          title: titleTrimmed,
          passScore,
          questions: questionPayload.map((question) => ({
            id: question.id,
            text: question.text,
            options: question.options,
          })),
        });
        if (!updated) throw new Error('Quiz could not be updated.');
        Alert.alert('Quiz updated', 'Quiz changes saved.');
      }

      await refetchQuiz();
      void queryClient.invalidateQueries({ queryKey: ['lesson-quiz-bundle', lessonId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-lesson-quiz-editor', lessonId] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Could not save quiz', message);
    } finally {
      setIsSavingQuiz(false);
    }
  };

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 py-4 flex-row items-center">
          <TouchableOpacity
            onPress={() =>
              courseId && lessonId
                ? router.replace(`/admin/courses/${courseId}/lesson/${lessonId}`)
                : router.back()
            }
            className="w-10 h-10 rounded-full bg-earth-900/5 items-center justify-center"
            activeOpacity={0.8}
          >
            <ChevronLeft size={22} color="#1c1917" strokeWidth={1.5} />
          </TouchableOpacity>
          <View className="ml-3 flex-1">
            <Text className="text-black text-xl font-semibold">Quiz editor</Text>
            <Text className="text-earth-800 text-sm">Create or update lesson quiz structure</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
          <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Quiz title</Text>
          <TextInput value={quizTitle} onChangeText={setQuizTitle} placeholder="Quiz title" placeholderTextColor="#a8a29e" className={`${fieldPlain} mb-4`} />

          <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Pass score (0-100)</Text>
          <TextInput value={quizPassScore} onChangeText={setQuizPassScore} placeholder="e.g. 60" placeholderTextColor="#a8a29e" keyboardType="number-pad" className={`${fieldPlain} mb-4`} />
          {questions.map((question, questionIndex) => (
            <View key={`${question.id ?? 'new'}-${questionIndex}`} className="mb-6 border border-earth-300/70 rounded-xl p-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-earth-800 font-medium">Question {questionIndex + 1}</Text>
                {questions.length > 1 ? (
                  <TouchableOpacity onPress={() => removeQuestion(questionIndex)} className="px-2 py-1">
                    <Text className="text-red-700 text-xs font-medium">Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <TextInput
                value={question.text}
                onChangeText={(text) => setQuestionText(questionIndex, text)}
                placeholder="Question students must answer"
                placeholderTextColor="#a8a29e"
                className={`${fieldPlain} mb-3`}
              />
              <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Answer options</Text>
              <TextInput value={question.options[0]} onChangeText={(text) => setQuestionOption(questionIndex, 0, text)} placeholder="Option A" placeholderTextColor="#a8a29e" className={`${fieldPlain} mb-2`} />
              <TextInput value={question.options[1]} onChangeText={(text) => setQuestionOption(questionIndex, 1, text)} placeholder="Option B" placeholderTextColor="#a8a29e" className={`${fieldPlain} mb-2`} />
              <TextInput value={question.options[2]} onChangeText={(text) => setQuestionOption(questionIndex, 2, text)} placeholder="Option C (optional)" placeholderTextColor="#a8a29e" className={`${fieldPlain} mb-2`} />
              <TextInput value={question.options[3]} onChangeText={(text) => setQuestionOption(questionIndex, 3, text)} placeholder="Option D (optional)" placeholderTextColor="#a8a29e" className={`${fieldPlain} mb-2`} />
              <Text className="text-earth-700 text-xs font-semibold uppercase tracking-wide mb-2">Correct answer</Text>
              <View className="flex-row flex-wrap">
                {(['A', 'B', 'C', 'D'] as const).map((choice) => (
                  <TouchableOpacity
                    key={`${questionIndex}-${choice}`}
                    onPress={() => setQuestionCorrectOption(questionIndex, choice)}
                    className={`mr-2 mb-2 px-3 py-2 rounded-full border ${question.correctOption === choice ? 'bg-primary-600 border-primary-600' : 'border-earth-400/60'}`}
                  >
                    <Text className={question.correctOption === choice ? 'text-white font-medium' : 'text-earth-700'}>
                      {choice}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <View className="mb-6">
            <Button label="Add question" variant="outline" onPress={addQuestion} fullWidth />
          </View>

          <Button
            label={isSavingQuiz || quizLoading ? 'Saving quiz...' : existingQuiz ? 'Update quiz' : 'Create quiz'}
            onPress={() => void onSaveQuiz()}
            disabled={isSavingQuiz || quizLoading}
            fullWidth
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
