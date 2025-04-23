
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut, User, PlusCircle } from 'lucide-react';

const Navbar: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-brand-600" />
          <span className="text-xl font-bold text-brand-600">QuizItQuick</span>
        </Link>
        
        {currentUser ? (
          <div className="flex items-center space-x-4">
            <Link to="/create">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4 mr-1" />
                New Quiz
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <div className="flex items-center space-x-3">
              <Link to="/profile" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-brand-600" />
                  )}
                </div>
                <span className="text-sm font-medium hidden md:block">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
