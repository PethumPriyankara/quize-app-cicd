
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { Quiz } from '@/types';
import { Copy, ArrowLeft, LayoutDashboard, ExternalLink } from 'lucide-react';

const ShareQuiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const quizUrl = `${window.location.origin}/quiz/${quizId}/take`;

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
        
        // Check if the current user is the creator
        if (quizData.createdBy !== currentUser?.uid) {
          setError('You do not have permission to access this quiz');
          setLoading(false);
          return;
        }
        
        setQuiz({
          id: quizDoc.id,
          ...quizData,
          createdAt: quizData.createdAt instanceof Date ? quizData.createdAt : quizData.createdAt?.toDate() || new Date()
        });
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, currentUser?.uid]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(quizUrl).then(
      () => {
        toast({
          title: 'Link Copied!',
          description: 'Quiz link copied to clipboard.',
        });
      },
      (err) => {
        toast({
          title: 'Failed to copy',
          description: 'Could not copy the link. Please try again.',
          variant: 'destructive',
        });
      }
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container max-w-lg py-12 text-center">
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
        <div className="container max-w-lg py-12 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">{error}</h2>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  if (!quiz) return null;

  return (
    <Layout>
      <div className="container max-w-lg py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Share Quiz</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
        
        <Card className="p-6 mb-6 text-center">
          <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
          {quiz.description && (
            <p className="text-gray-600 mb-6">{quiz.description}</p>
          )}
          
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-lg border">
              <QRCodeCanvas 
                value={quizUrl}
                size={200}
                level={"H"}
                includeMargin={true}
                imageSettings={{
                  src: "/favicon.ico",
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Quiz Link</h3>
            <div className="flex items-center">
              <code className="bg-gray-100 p-2 rounded text-sm flex-grow truncate mr-2">
                {quizUrl}
              </code>
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-3 mt-6">
            <Button
              className="w-full"
              onClick={() => window.open(quizUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Quiz
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/quiz/${quizId}/edit`)}
            >
              Edit Quiz
            </Button>
            
            <Button
              variant="link"
              className="w-full"
              onClick={() => navigate('/create')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Create Another Quiz
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ShareQuiz;
