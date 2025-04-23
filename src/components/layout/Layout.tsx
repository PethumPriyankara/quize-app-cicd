
import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Don't show navbar/footer for the quiz-taking page
  const isQuizPage = location.pathname.startsWith('/quiz/');
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {!isQuizPage && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      {!isQuizPage && <Footer />}
    </div>
  );
};

export default Layout;
