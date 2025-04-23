
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { firestore } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Quiz } from '@/types';
import { deleteOldQuizzes, deleteInactiveQuizzes } from '@/utils/quizCleanup';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError('');
        
        const quizzesRef = collection(firestore, 'quizzes');
        const q = query(quizzesRef, where('createdBy', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const quizList: Quiz[] = [];
        querySnapshot.forEach((doc) => {
          const quizData = doc.data() as Omit<Quiz, 'id'>;
          const createdAt = quizData.createdAt instanceof Timestamp ? 
            quizData.createdAt.toDate() : 
            (quizData.createdAt instanceof Date ? quizData.createdAt : new Date());
            
          quizList.push({
            id: doc.id,
            ...quizData,
            createdAt
          });
        });
        
        setQuizzes(quizList);
      } catch (err) {
        console.error('Error fetching quizzes:', err);
        setError('Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [currentUser]);

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      // Delete the quiz from Firestore
      const quizRef = doc(firestore, 'quizzes', quizId);
      await deleteDoc(quizRef);
      
      // Update the local state to remove the deleted quiz
      setQuizzes(quizzes.filter((quiz) => quiz.id !== quizId));
      
      toast({
        title: 'Quiz Deleted',
        description: 'The quiz has been successfully deleted.',
      });
    } catch (err) {
      console.error('Error deleting quiz:', err);
      toast({
        title: 'Failed to Delete Quiz',
        description: 'There was an error deleting the quiz. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOldQuizzes = async () => {
    if (!currentUser) return;

    setIsCleaningUp(true);
    try {
      const result = await deleteOldQuizzes(currentUser.uid);
      
      toast({
        title: 'Cleanup Complete',
        description: `Deleted ${result.deletedQuizCount} old quizzes.`
      });
    } catch (error) {
      toast({
        title: 'Cleanup Failed',
        description: 'Could not delete old quizzes.',
        variant: 'destructive'
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleDeleteInactiveQuizzes = async () => {
    if (!currentUser) return;

    setIsCleaningUp(true);
    try {
      const result = await deleteInactiveQuizzes(currentUser.uid);
      
      toast({
        title: 'Cleanup Complete',
        description: `Deleted ${result.deletedQuizCount} inactive quizzes.`
      });
    } catch (error) {
      toast({
        title: 'Cleanup Failed',
        description: 'Could not delete inactive quizzes.',
        variant: 'destructive'
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container max-w-3xl py-12">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-32 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-10 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container max-w-3xl py-12">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          <div className="text-red-500">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-3xl py-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={() => navigate('/create')}>Create New Quiz</Button>
        </div>
        
        {quizzes.length === 0 ? (
          <div className="text-gray-500">No quizzes created yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="bg-white shadow-md rounded-md overflow-hidden">
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
                  <p className="text-gray-600 mb-4">{quiz.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => navigate(`/quiz/${quiz.id}/share`)}>Share</Button>
                    <Button size="sm" onClick={() => navigate(`/quiz/${quiz.id}/edit`)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteQuiz(quiz.id)}>Delete</Button>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/quiz/${quiz.id}/analytics`)}>Analytics</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Add cleanup buttons */}
        <div className="mt-4 space-x-2">
          <Button 
            variant="outline" 
            onClick={handleDeleteOldQuizzes}
            disabled={isCleaningUp}
          >
            Delete Quizzes Older than 90 Days
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDeleteInactiveQuizzes}
            disabled={isCleaningUp}
          >
            Delete Quizzes with Few Responses
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
