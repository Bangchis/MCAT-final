import React, { useState } from 'react';
import { StartPage } from './components/StartPage';
import { QuizPage } from './components/QuizPage';
import { ResultsPage } from './components/ResultsPage';
import './App.css';

function App() {
    const [currentPage, setCurrentPage] = useState('start');
    const [quizResult, setQuizResult] = useState(null);
    const [quizSession, setQuizSession] = useState(null); // NEW: Lưu dữ liệu khởi tạo quiz

    const handleStart = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://backend:5000'}/start`);
            if (!response.ok) throw new Error('API /start trả về lỗi');

            const data = await response.json();
            console.log('Quiz session started:', data);
            setQuizSession(data); // Lưu session nếu QuizPage cần
            setCurrentPage('quiz');
        } catch (err) {
            alert('Failed to start quiz. Please check if the API is running.');
            console.error(err);
        }
    };

    const handleFinish = (result) => {
        console.log('Quiz finished with result:', result);
        setQuizResult(result);
        setCurrentPage('results');
    };

    const handleRestart = () => {
        setQuizResult(null);
        setQuizSession(null);
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
                {currentPage === 'quiz' && <QuizPage onFinish={handleFinish} session={quizSession} />}
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
