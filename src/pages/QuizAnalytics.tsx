
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Quiz, QuizSubmission, QuizStats } from '@/types';
import { 
  BarChart3, 
  Users, 
  Share2,
  LayoutDashboard
} from 'lucide-react';

// Import specific components from Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const QuizAnalytics: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuizAndSubmissions = async () => {
      try {
        if (!quizId || !currentUser) {
          setError('Invalid quiz or not authorized');
          setLoading(false);
          return;
        }
        
        // Fetch quiz data
        const quizRef = doc(firestore, 'quizzes', quizId);
        const quizDoc = await getDoc(quizRef);
        
        if (!quizDoc.exists()) {
          setError('Quiz not found');
          setLoading(false);
          return;
        }
        
        const quizData = quizDoc.data() as Omit<Quiz, 'id'>;
        
        // Check if the current user is the creator
        if (quizData.createdBy !== currentUser.uid) {
          setError('You do not have permission to access this quiz');
          setLoading(false);
          return;
        }
        
        const createdAt = quizData.createdAt instanceof Timestamp ? 
          quizData.createdAt.toDate() : 
          (quizData.createdAt instanceof Date ? quizData.createdAt : new Date());
        
        const quiz = {
          id: quizDoc.id,
          ...quizData,
          createdAt
        } as Quiz;
        
        setQuiz(quiz);
        
        // Fetch submissions
        const submissionsRef = collection(firestore, 'submissions');
        const q = query(submissionsRef, where('quizId', '==', quizId));
        const submissionsSnapshot = await getDocs(q);
        
        const fetchedSubmissions: QuizSubmission[] = [];
        submissionsSnapshot.forEach((doc) => {
          const data = doc.data();
          const submittedAt = data.submittedAt instanceof Timestamp ?
            data.submittedAt.toDate() :
            (data.submittedAt instanceof Date ? data.submittedAt : new Date());
            
          fetchedSubmissions.push({
            id: doc.id,
            ...data,
            submittedAt
          } as QuizSubmission);
        });
        
        setSubmissions(fetchedSubmissions);
        
        // Calculate stats
        calculateStats(quiz, fetchedSubmissions);
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError('Failed to load quiz data');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAndSubmissions();
  }, [quizId, currentUser]);

  const calculateStats = (quiz: Quiz, submissions: QuizSubmission[]) => {
    if (submissions.length === 0) {
      setStats(null);
      return;
    }
    
    // Initialize question performance
    const questionPerformance: { [questionId: string]: { correctCount: number; totalAnswers: number } } = {};
    quiz.questions.forEach(question => {
      questionPerformance[question.id] = { correctCount: 0, totalAnswers: 0 };
    });
    
    // Calculate scores
    const scores = submissions.map(submission => submission.score);
    const totalResponses = submissions.length;
    const averageScore = scores.reduce((a, b) => a + b, 0) / totalResponses;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    
    // Calculate per-question performance
    submissions.forEach(submission => {
      submission.answers.forEach(answer => {
        const qPerf = questionPerformance[answer.questionId];
        qPerf.totalAnswers += 1;
        if (answer.isCorrect) {
          qPerf.correctCount += 1;
        }
      });
    });
    
    setStats({
      totalResponses,
      averageScore,
      highestScore,
      lowestScore,
      questionPerformance
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-32 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-600">{error}</h2>
            <Button onClick={() => navigate('/dashboard')}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!quiz) return null;

  // Prepare chart data
  const scoreDistributionData = stats ? 
    Array.from({ length: quiz.questions.length + 1 }, (_, i) => {
      const scoreCount = submissions.filter(sub => sub.score === i).length;
      return { score: i, count: scoreCount };
    }) : [];

  const pieData = [
    { name: 'Correct', value: 0, color: '#10B981' },
    { name: 'Incorrect', value: 0, color: '#EF4444' }
  ];

  if (stats) {
    let totalCorrect = 0;
    let totalIncorrect = 0;
    
    Object.values(stats.questionPerformance).forEach(perf => {
      totalCorrect += perf.correctCount;
      totalIncorrect += perf.totalAnswers - perf.correctCount;
    });
    
    pieData[0].value = totalCorrect;
    pieData[1].value = totalIncorrect;
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <p className="text-gray-500">Analytics & Performance</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              onClick={() => navigate(`/quiz/${quizId}/share`)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Quiz
            </Button>
          </div>
        </div>
        
        {submissions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No responses yet</h3>
            <p className="text-gray-500 mb-6">Share your quiz to collect responses</p>
            <Button onClick={() => navigate(`/quiz/${quizId}/share`)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Quiz
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="h-8 w-8 text-brand-500 mx-auto mb-2" />
                    <h3 className="text-3xl font-bold">{stats?.totalResponses}</h3>
                    <p className="text-gray-500 text-sm">Total Responses</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="text-3xl font-bold">
                      {stats ? (stats.averageScore / quiz.questions.length * 100).toFixed(1) + '%' : '0%'}
                    </h3>
                    <p className="text-gray-500 text-sm">Average Score</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <h3 className="text-3xl font-bold">
                      {stats ? stats.highestScore : 0}/{quiz.questions.length}
                    </h3>
                    <p className="text-gray-500 text-sm">Highest Score</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <h3 className="text-3xl font-bold">
                      {stats ? stats.lowestScore : 0}/{quiz.questions.length}
                    </h3>
                    <p className="text-gray-500 text-sm">Lowest Score</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={scoreDistributionData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="score" 
                        label={{ 
                          value: 'Score', 
                          position: 'insideBottom', 
                          offset: -10 
                        }} 
                      />
                      <YAxis 
                        label={{ 
                          value: 'Number of Students', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle' }
                        }} 
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Answer Correctness</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Question Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && quiz.questions.map((question, index) => {
                    const perf = stats.questionPerformance[question.id];
                    if (!perf) return null;
                    
                    const correctPercentage = perf.totalAnswers > 0 
                      ? (perf.correctCount / perf.totalAnswers) * 100 
                      : 0;
                    
                    return (
                      <div key={question.id} className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">Question {index + 1}</span>
                          <span>{correctPercentage.toFixed(1)}% Correct</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-brand-500 rounded-full" 
                            style={{ width: `${correctPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Student</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-right py-3 px-4">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions
                        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
                        .slice(0, 10)
                        .map(submission => (
                        <tr key={submission.id} className="border-b">
                          <td className="py-3 px-4">{submission.studentName}</td>
                          <td className="py-3 px-4">
                            {submission.submittedAt.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`${
                              submission.score / submission.totalQuestions >= 0.7 
                                ? 'text-green-600' 
                                : submission.score / submission.totalQuestions >= 0.4 
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            } font-medium`}>
                              {submission.score}/{submission.totalQuestions}
                            </span>
                          </td>
                        </tr>
                      ))}
                      
                      {submissions.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-gray-500">
                            No submissions yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QuizAnalytics;
