
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} QuizItQuick. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <Link to="/about" className="text-sm text-gray-500 hover:text-brand-600">
              About
            </Link>
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-brand-600">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm text-gray-500 hover:text-brand-600">
              Terms
            </Link>
            <a 
              href="mailto:support@quizitquick.example" 
              className="text-sm text-gray-500 hover:text-brand-600"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
