import React, { useState, useEffect } from 'react';
import { StartPage } from './components/StartPage';
import { QuizPage } from './components/QuizPage';
import { ResultsPage } from './components/ResultsPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('start');
  const [quizResult, setQuizResult] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStart = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage('quiz');
      setIsTransitioning(false);
    }, 300);
  };

  const handleFinish = (result) => {
    console.log('Quiz finished with result:', result);
    setQuizResult(result);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage('results');
      setIsTransitioning(false);
    }, 300);
  };

  const handleRestart = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setQuizResult(null);
      setCurrentPage('start');
      setIsTransitioning(false);
    }, 300);
  };

  // Dynamic theme based on page
  useEffect(() => {
    const themes = {
      start: 'theme-start',
      quiz: 'theme-quiz',
      results: 'theme-results'
    };
    document.body.className = themes[currentPage];
  }, [currentPage]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="logo">🧠</span>
            MCAT Demo
          </h1>
          <div className="page-indicator">
            <span className={`indicator ${currentPage === 'start' ? 'active' : ''}`}>1</span>
            <span className="indicator-line"></span>
            <span className={`indicator ${currentPage === 'quiz' ? 'active' : ''}`}>2</span>
            <span className="indicator-line"></span>
            <span className={`indicator ${currentPage === 'results' ? 'active' : ''}`}>3</span>
          </div>
          {currentPage === 'quiz' && (
            <button
              className="btn-danger"
              onClick={handleRestart}
            >
              🚪 Exit Quiz
            </button>
          )}
          {currentPage === 'results' && (
            <button
              className="btn-success"
              onClick={handleRestart}
            >
              🔄 New Quiz
            </button>
          )}
        </div>
      </header>

      <main className={`App-main ${isTransitioning ? 'transitioning' : ''}`}>
        <div className="page-container">
          {!isTransitioning && currentPage === 'start' && <StartPage onStart={handleStart} />}
          {!isTransitioning && currentPage === 'quiz' && <QuizPage onFinish={handleFinish} />}
          {!isTransitioning && currentPage === 'results' && <ResultsPage result={quizResult} />}
          {isTransitioning && (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          )}
        </div>
      </main>

      <footer className="App-footer">
        <div className="footer-content">
          <p>📚 MHCAT Demo - Multidimensional Hybrid Computerized Adaptive Testing</p>
          <div className="footer-stats">
            {currentPage === 'results' && quizResult && (
              <span>✅ Questions answered: {quizResult.administered?.length || 0}</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;