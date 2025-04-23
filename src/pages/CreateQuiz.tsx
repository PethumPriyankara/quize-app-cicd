
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Plus, ChevronRight, Save, LayoutDashboard } from 'lucide-react';
import QuestionForm from '@/components/quiz/QuestionForm';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Question } from '@/types';

const CreateQuiz: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: uuidv4(),
      text: '',
      options: ['', ''],
      correctOption: 0
    }
  ]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleQuestionUpdate = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const handleQuestionDelete = (index: number) => {
    if (questions.length <= 1) return; // Keep at least one question
    
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: uuidv4(),
        text: '',
        options: ['', ''],
        correctOption: 0
      }
    ]);
  };

  const validateQuiz = () => {
    if (!title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please provide a title for your quiz.",
        variant: "destructive"
      });
      return false;
    }
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast({
          title: "Incomplete Question",
          description: `Question ${i + 1} is missing a question text.`,
          variant: "destructive"
        });
        return false;
      }
      
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          toast({
            title: "Incomplete Options",
            description: `Option ${j + 1} in Question ${i + 1} is empty.`,
            variant: "destructive"
          });
          return false;
        }
      }
    }
    
    return true;
  };

  const saveQuiz = async (publish: boolean) => {
    if (!validateQuiz()) return;
    
    try {
      publish ? setIsPublishing(true) : setIsSaving(true);
      
      const quizData = {
        title,
        description,
        questions,
        createdBy: currentUser?.uid,
        createdAt: serverTimestamp(),
        isPublished: publish,
        responses: 0
      };
      
      const docRef = await addDoc(collection(firestore, 'quizzes'), quizData);
      
      toast({
        title: publish ? "Quiz Published!" : "Quiz Saved!",
        description: publish ? 
          "Your quiz is now ready to be shared." : 
          "Your quiz has been saved as a draft."
      });
      
      navigate(`/quiz/${docRef.id}/share`);
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast({
        title: "Error",
        description: "Failed to save quiz. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-3xl py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Create a New Quiz</h1>
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
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
          <h2 className="text-lg font-medium mb-4">Quiz Details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Quiz Title
              </label>
              <Input
                id="title"
                placeholder="Enter a title for your quiz"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <Textarea
                id="description"
                placeholder="Provide a short description of your quiz"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>
        
        <h2 className="text-lg font-medium mb-4">Questions</h2>
        
        {questions.map((question, index) => (
          <QuestionForm
            key={question.id}
            question={question}
            onUpdate={(updatedQuestion) => handleQuestionUpdate(index, updatedQuestion)}
            onDelete={() => handleQuestionDelete(index)}
            index={index}
          />
        ))}
        
        <Button 
          variant="outline" 
          className="w-full mb-8"
          onClick={handleAddQuestion}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button 
            variant="outline" 
            onClick={() => saveQuiz(false)}
            disabled={isSaving || isPublishing}
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
            {!isSaving && <Save className="ml-2 h-4 w-4" />}
          </Button>
          
          <Button 
            onClick={() => saveQuiz(true)}
            disabled={isSaving || isPublishing}
          >
            {isPublishing ? 'Publishing...' : 'Publish Quiz'}
            {!isPublishing && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default CreateQuiz;
