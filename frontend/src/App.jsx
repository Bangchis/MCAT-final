import React, { useState } from 'react';
import { StartPage } from './components/StartPage';
import { QuizPage } from './components/QuizPage';
import { ResultsPage } from './components/ResultsPage';
import './App.css';

function App() {
    const [currentPage, setCurrentPage] = useState('start');
    const [quizResult, setQuizResult] = useState(null);

    const handleStart = () => {
        setCurrentPage('quiz');
    };

    const handleFinish = (result) => {
        console.log('Quiz finished with result:', result);
        setQuizResult(result);
        setCurrentPage('results');
    };

    const handleRestart = () => {
        setQuizResult(null);
        setCurrentPage('start');
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>MCAT Demo Application</h1>
                <nav style={{ marginTop: 10 }}>
                    {currentPage === 'quiz' && (
                        <button
                            onClick={handleRestart}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer'
                            }}
                        >
                            End Quiz
                        </button>
                    )}
                    {currentPage === 'results' && (
                        <button
                            onClick={handleRestart}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer'
                            }}
                        >
                            Start New Quiz
                        </button>
                    )}
                </nav>
            </header>

            <main className="App-main">
                {currentPage === 'start' && <StartPage onStart={handleStart} />}
                {currentPage === 'quiz' && <QuizPage onFinish={handleFinish} />}
                {currentPage === 'results' && <ResultsPage result={quizResult} />}
            </main>

            <footer className="App-footer" style={{ marginTop: 50, padding: 20, textAlign: 'center', color: '#666' }}>
                <p>MHCAT Demo - Multidimensional Hybrid Computerized Adaptive Testing</p>
                <p style={{ fontSize: '12px' }}>
                    Current page: {currentPage} |
                    {currentPage === 'results' && quizResult && ` Questions answered: ${quizResult.administered?.length || 0}`}
                </p>
            </footer>
        </div>
    );
}

export default App;