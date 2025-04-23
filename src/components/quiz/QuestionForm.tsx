
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, CircleCheck } from 'lucide-react';
import { Question } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface QuestionFormProps {
  question: Question;
  onUpdate: (updatedQuestion: Question) => void;
  onDelete: () => void;
  index: number;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  question,
  onUpdate,
  onDelete,
  index
}) => {
  const [options, setOptions] = useState<string[]>(question.options);
  const [correctOption, setCorrectOption] = useState<number>(question.correctOption);
  const [questionText, setQuestionText] = useState<string>(question.text);

  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setQuestionText(newText);
    onUpdate({
      ...question,
      text: newText
    });
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
    onUpdate({
      ...question,
      options: newOptions
    });
  };

  const handleCorrectOptionChange = (value: string) => {
    const index = parseInt(value, 10);
    setCorrectOption(index);
    onUpdate({
      ...question,
      correctOption: index
    });
  };

  const handleAddOption = () => {
    if (options.length < 6) {
      const newOptions = [...options, ''];
      setOptions(newOptions);
      onUpdate({
        ...question,
        options: newOptions
      });
    }
  };

  const handleDeleteOption = (index: number) => {
    if (options.length <= 2) return; // Minimum 2 options
    
    const newOptions = [...options];
    newOptions.splice(index, 1);
    
    // Update the correctOption if it was the deleted one or after it
    let newCorrectOption = correctOption;
    if (correctOption === index) {
      newCorrectOption = 0;
    } else if (correctOption > index) {
      newCorrectOption -= 1;
    }
    
    setOptions(newOptions);
    setCorrectOption(newCorrectOption);
    
    onUpdate({
      ...question,
      options: newOptions,
      correctOption: newCorrectOption
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Question {index + 1}</h3>
        <Button 
          variant="destructive" 
          size="icon"
          onClick={onDelete}
          title="Delete question"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mb-4">
        <Input
          placeholder="Enter your question..."
          value={questionText}
          onChange={handleQuestionTextChange}
          className="mb-2"
        />
      </div>
      
      <div className="space-y-4">
        <div className="mb-2">
          <h4 className="text-sm font-medium mb-3">Options</h4>
          <RadioGroup 
            value={correctOption.toString()} 
            onValueChange={handleCorrectOptionChange}
            className="space-y-3"
          >
            {options.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <div className="flex-grow flex items-center gap-3">
                  <RadioGroupItem value={idx.toString()} id={`option-${question.id}-${idx}`} />
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    value={option}
                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                    className="flex-grow"
                  />
                </div>
                {options.length > 2 && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteOption(idx)}
                    title="Delete option"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </RadioGroup>
        </div>
        
        {options.length < 6 && (
          <Button 
            variant="outline" 
            onClick={handleAddOption}
            className="w-full"
            type="button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        )}
      </div>
      
      <div className="mt-4 flex items-center text-sm text-gray-500 p-2 bg-gray-50 rounded">
        <CircleCheck className="h-4 w-4 mr-2 text-green-500" />
        <span>Correct answer: Option {correctOption + 1}</span>
      </div>
    </div>
  );
};

export default QuestionForm;
