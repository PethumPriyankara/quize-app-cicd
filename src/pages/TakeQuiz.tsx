
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, increment, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { Quiz, QuizSubmission, StudentAnswer } from '@/types';
import { BookOpen, ChevronRight, Check, X } from 'lucide-react';

const TakeQuiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0); // 0: intro, 1-n: questions, n+1: results
  const [studentName, setStudentName] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [results, setResults] = useState<{
    score: number;
    totalQuestions: number;
    answers: StudentAnswer[];
  } | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        if (!quizId) return;
        
        const quizRef = doc(firestore, 'quizzes', quizId);
        const quizDoc = await getDoc(quizRef);
        
        if (!quizDoc.exists()) {
          setError('Quiz not found');
          setLoading(false);
          return;
        }
        
        const quizData = quizDoc.data() as Omit<Quiz, 'id'>;
        
        if (!quizData.isPublished) {
          setError('This quiz is not available');
          setLoading(false);
          return;
        }
        
        const createdAt = quizData.createdAt instanceof Timestamp ? 
          quizData.createdAt.toDate() : 
          (quizData.createdAt instanceof Date ? quizData.createdAt : new Date());
        
        setQuiz({
          id: quizDoc.id,
          ...quizData,
          createdAt
        });
        
        // Initialize selected options array with -1 (nothing selected)
        setSelectedOptions(Array(quizData.questions.length).fill(-1));
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const startQuiz = () => {
    if (!studentName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name to begin the quiz.',
        variant: 'destructive'
      });
      return;
    }
    
    setCurrentStep(1);
  };

  const handleOptionSelect = (optionIndex: number) => {
    const questionIndex = currentStep - 1;
    const updatedOptions = [...selectedOptions];
    updatedOptions[questionIndex] = optionIndex;
    setSelectedOptions(updatedOptions);
  };

  const nextQuestion = () => {
    if (!quiz) return;
    
    // If option not selected
    if (selectedOptions[currentStep - 1] === -1) {
      toast({
        title: 'Selection Required',
        description: 'Please select an answer to continue.',
        variant: 'destructive'
      });
      return;
    }
    
    // If this is the last question, calculate results
    if (currentStep === quiz.questions.length) {
      calculateResults();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const calculateResults = async () => {
    if (!quiz) return;
    
    const answers = quiz.questions.map((question, index) => {
      const selectedOption = selectedOptions[index];
      return {
        questionId: question.id,
        selectedOption,
        isCorrect: selectedOption === question.correctOption
      };
    });
    
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const score = correctAnswers;
    const totalQuestions = quiz.questions.length;
    
    setResults({
      score,
      totalQuestions,
      answers
    });
    
    try {
      // Create submission record
      const submission: Omit<QuizSubmission, 'id'> = {
        quizId: quiz.id,
        submittedAt: new Date(),
        studentName,
        answers,
        score,
        totalQuestions
      };
      
      await addDoc(collection(firestore, 'submissions'), submission);
      
      // Update quiz response count
      const quizRef = doc(firestore, 'quizzes', quiz.id);
      await updateDoc(quizRef, {
        responses: increment(1)
      });
    } catch (err) {
      console.error('Error saving results:', err);
    }
    
    // Move to results screen
    setCurrentStep(quiz.questions.length + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-32 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-10 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-lg text-center">
          <div className="flex justify-center mb-4">
            <X className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">{error}</h2>
          <p className="text-gray-600 mb-6">
            The quiz you're looking for might have been removed or is not published.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  // Introduction step
  if (currentStep === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-brand-600" />
            </div>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            {quiz.description && (
              <p className="text-gray-600 mt-2">{quiz.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Your Name
                </label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <h3 className="font-medium mb-1">Quiz Information:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>{quiz.questions.length} multiple choice questions</li>
                  <li>Results will be shown immediately after completion</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={startQuiz}
            >
              Begin Quiz
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Results step
  if (currentStep > quiz.questions.length && results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {results.score === results.totalQuestions ? (
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
              ) : results.score >= results.totalQuestions / 2 ? (
                <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
                  <Check className="h-10 w-10 text-yellow-600" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <X className="h-10 w-10 text-red-600" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">Quiz Results</CardTitle>
            <p className="text-gray-600 mt-2">
              Thank you for completing the quiz, {studentName}!
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-5xl font-bold mb-2">
                {results.score}/{results.totalQuestions}
              </div>
              <p className="text-lg text-gray-600">
                {results.score === results.totalQuestions
                  ? 'Perfect score! Excellent work!'
                  : results.score >= results.totalQuestions / 2
                  ? 'Good job!'
                  : 'Better luck next time!'}
              </p>
            </div>
            
            <div className="space-y-4 mt-6">
              <h3 className="font-medium">Question Summary:</h3>
              {quiz.questions.map((question, index) => {
                const answer = results.answers[index];
                return (
                  <div 
                    key={question.id} 
                    className={`p-3 rounded-md ${
                      answer.isCorrect ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 ${
                        answer.isCorrect ? 'bg-green-200' : 'bg-red-200'
                      }`}>
                        {answer.isCorrect ? (
                          <Check className="h-3 w-3 text-green-700" />
                        ) : (
                          <X className="h-3 w-3 text-red-700" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{question.text}</p>
                        <p className="text-sm">
                          {answer.isCorrect 
                            ? `Correct: ${question.options[question.correctOption]}`
                            : `Your answer: ${question.options[answer.selectedOption]}`}
                        </p>
                        {!answer.isCorrect && (
                          <p className="text-sm text-green-700">
                            Correct answer: {question.options[question.correctOption]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Take Quiz Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Question steps
  const questionIndex = currentStep - 1;
  const currentQuestion = quiz.questions[questionIndex];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              Question {currentStep} of {quiz.questions.length}
            </span>
            <span className="text-sm font-medium">{studentName}</span>
          </div>
          <CardTitle>{currentQuestion.text}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <div 
                key={idx}
                className={`p-4 border rounded-md cursor-pointer transition-all ${
                  selectedOptions[questionIndex] === idx 
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleOptionSelect(idx)}
              >
                <div className="flex items-center">
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center mr-3 ${
                    selectedOptions[questionIndex] === idx 
                      ? 'border-brand-500 bg-brand-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedOptions[questionIndex] === idx && (
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full"
            onClick={nextQuestion}
          >
            {currentStep === quiz.questions.length ? 'Submit' : 'Next'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TakeQuiz;
