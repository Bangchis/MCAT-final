import React, { useMemo, useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import { Radar, Bar, Line } from 'react-chartjs-2';
import './ResultsPage.css';

// Register chart components
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

export function ResultsPage({ result }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [showQuestionDetails, setShowQuestionDetails] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    // Add states for better image handling in question details
    const [imagesLoaded, setImagesLoaded] = useState(new Set());
    const [questionCardsVisible, setQuestionCardsVisible] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    // Add delay for question cards animation when they become visible
    useEffect(() => {
        if (showQuestionDetails) {
            const timer = setTimeout(() => {
                setQuestionCardsVisible(true);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setQuestionCardsVisible(false);
        }
    }, [showQuestionDetails]);

    const handleImageLoad = (questionId) => {
        setImagesLoaded(prev => new Set([...prev, questionId]));
    };

    const handleImageError = (e, questionId) => {
        console.error(`❌ Failed to load: ${questionId}.jpg`);
        e.target.style.display = 'none';

        // Show the placeholder
        const placeholder = e.target.nextElementSibling;
        if (placeholder && placeholder.classList.contains('image-placeholder-flex')) {
            placeholder.style.display = 'flex';
        }
    };

    const handleQuestionClick = (question) => {
        setSelectedQuestion(question);
        setShowQuestionModal(true);
    };

    const closeModal = () => {
        setShowQuestionModal(false);
        setSelectedQuestion(null);
    };

    // Calculate detailed statistics
    const stats = useMemo(() => {
        if (!result) return null;

        const administered = result.administered || [];
        const responses = result.responses || [];
        const userAnswers = result.user_answers || [];
        const subjects = result.subjects || [];
        const correctAnswers = result.correct_answers || [];

        console.log('ResultsPage - Processing data:', {
            administered: administered.length,
            responses: responses.length,
            userAnswers: userAnswers.length,
            subjects: subjects.length,
            correctAnswers: correctAnswers.length,
            sampleSubjects: subjects.slice(0, 5),
            sampleAdministered: administered.slice(0, 5)
        });

        // Group by subject
        const subjectStats = {};
        const questionDetails = {};

        administered.forEach((qid, idx) => {
            const subject = subjects[idx] || 'Unknown';
            if (!subjectStats[subject]) {
                subjectStats[subject] = {
                    correct: 0,
                    total: 0,
                    questions: [],
                    accuracy: 0
                };
            }

            const isCorrect = responses[idx] === 1;
            subjectStats[subject].total++;
            if (isCorrect) subjectStats[subject].correct++;

            // Convert user answer from 1-4 to A-D (ensure valid range)
            const userAnswerIdx = Math.max(1, Math.min(4, userAnswers[idx] || 1));
            const userAnswerLetter = String.fromCharCode(64 + userAnswerIdx);
            const correctAnswerLetter = correctAnswers[idx];

            const questionDetail = {
                qid,
                isCorrect,
                userAnswer: userAnswerLetter,
                correctAnswer: correctAnswerLetter,
                subject,
                index: idx
            };

            subjectStats[subject].questions.push(questionDetail);
            questionDetails[qid] = questionDetail;
        });

        // Calculate accuracy after all questions are grouped
        Object.keys(subjectStats).forEach(subject => {
            const stat = subjectStats[subject];
            stat.accuracy = Math.round((stat.correct / stat.total) * 100);
        });

        console.log('ResultsPage - Subject stats after processing:', subjectStats);

        // Debug each subject's questions
        Object.entries(subjectStats).forEach(([subject, stat]) => {
            console.log(`Subject ${subject}: ${stat.questions.length} questions`, stat.questions);
        });

        // Calculate overall stats
        const totalCorrect = responses.filter(r => r === 1).length;
        const totalAccuracy = Math.round((totalCorrect / responses.length) * 100);

        // Scale theta vector by 1.5
        const scaledTheta = result.theta.map(t => t * 1.5);
        const avgTheta = scaledTheta.reduce((sum, val) => sum + val, 0) / scaledTheta.length;

        // Format timing data
        const formatTime = (seconds) => {
            if (!seconds) return 'N/A';
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        };

        const formattedTotalTime = formatTime(result.total_time);
        const timePerQuestion = result.time_per_question ? formatTime(result.time_per_question) : 'N/A';

        // Calculate percentile based on normal distribution (mean=0, sd=1)
        const calculatePercentile = (zScore) => {
            // Approximate normal CDF using error function approximation
            const t = 1 / (1 + 0.3275911 * Math.abs(zScore));
            const a1 = 0.254829592;
            const a2 = -0.284496736;
            const a3 = 1.421413741;
            const a4 = -1.453152027;
            const a5 = 1.061405429;

            const erf = 1 - (a1 * t + a2 * t * t + a3 * t * t * t + a4 * t * t * t * t + a5 * t * t * t * t * t) * Math.exp(-zScore * zScore);

            return 50 * (1 + (zScore >= 0 ? erf : -erf));
        };

        const percentile = Math.round(calculatePercentile(avgTheta));

        // Create normal distribution data inline with scaled theta
        const points = [];
        const shadedPoints = [];
        const range = 9; // Expanded range for scaled values (-4.5 to 4.5)
        const steps = 200;

        for (let i = 0; i <= steps; i++) {
            const x = -range / 2 + (range * i / steps);
            // Adjust normal distribution for scaled theta (scale down by 1.5)
            const scaledX = x / 1.5;
            const y = Math.exp(-0.5 * scaledX * scaledX) / Math.sqrt(2 * Math.PI);

            points.push({ x, y });

            // Add to shaded area if below user's scaled theta
            if (x <= avgTheta) {
                shadedPoints.push({ x, y });
            }
        }

        const normalDistData = { points, shadedPoints };

        // Calculate theta interpretation with scaled thresholds (1.5x)
        const getAbilityLevel = (theta) => {
            if (theta < -1.5) return { level: 'Beginner', color: '#EF4444', description: 'Need more practice' };
            if (theta < 0) return { level: 'Below Average', color: '#F59E0B', description: 'Room for improvement' };
            if (theta < 0.75) return { level: 'Average', color: '#3B82F6', description: 'Good foundation' };
            if (theta < 1.5) return { level: 'Above Average', color: '#8B5CF6', description: 'Strong performance' };
            return { level: 'Advanced', color: '#10B981', description: 'Excellent mastery' };
        };

        const abilityInfo = getAbilityLevel(avgTheta);

        // Get correct subject names for display
        const subjectNames = {
            '0': { name: 'Number Concepts', icon: '🔢', color: '#3B82F6' },
            '1': { name: 'Arithmetic Operations', icon: '➕', color: '#8B5CF6' },
            '2': { name: 'Algebra & Functions', icon: '📐', color: '#10B981' },
            '3': { name: 'Geometry & Properties', icon: '📏', color: '#F59E0B' }
        };

        return {
            subjectStats,
            questionDetails,
            totalAccuracy,
            totalCorrect,
            totalQuestions: responses.length,
            scaledTheta,  // Add scaled theta
            avgTheta,     // This is now the scaled average
            percentile,
            normalDistData,
            abilityInfo,
            formattedTotalTime,
            timePerQuestion,
            dimensionNames: ['Number Concepts', 'Arithmetic Operations', 'Algebra & Functions', 'Geometry & Properties'],
            subjectNames
        };
    }, [result]);

    if (!result || !stats) {
        return (
            <div className="results-page-error">
                <div className="error-content">
                    <div className="error-icon">😔</div>
                    <h2>No results available</h2>
                    <p>Please complete a quiz first.</p>
                </div>
            </div>
        );
    }

    // Prepare chart data with scaled theta
    const radarData = {
        labels: stats.dimensionNames,
        datasets: [{
            label: 'Ability Level (θ × 1.5)',
            data: stats.scaledTheta, // Use scaled theta
            fill: true,
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderColor: 'rgba(79, 70, 229, 1)',
            pointBackgroundColor: 'rgba(79, 70, 229, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(79, 70, 229, 1)',
            pointRadius: 6,
            pointHoverRadius: 8,
            borderWidth: 3
        }]
    };

    const barData = {
        labels: Object.entries(stats.subjectStats).map(([id, _]) => stats.subjectNames[id]?.name || `Subject ${id}`),
        datasets: [
            {
                label: 'Correct Answers',
                data: Object.values(stats.subjectStats).map(s => s.correct),
                backgroundColor: Object.entries(stats.subjectStats).map(([id, _]) =>
                    `${stats.subjectNames[id]?.color || '#6B7280'}88`
                ),
                borderColor: Object.entries(stats.subjectStats).map(([id, _]) =>
                    stats.subjectNames[id]?.color || '#6B7280'
                ),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }
        ]
    };

    // Normal distribution chart data
    const normalDistData = {
        datasets: [
            {
                type: 'line',
                label: 'Normal Distribution',
                data: stats.normalDistData.points,
                borderColor: 'rgba(79, 70, 229, 1)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 0,
                tension: 0.4
            },
            {
                type: 'line',
                label: `Your Score (${stats.percentile}th percentile)`,
                data: stats.normalDistData.shadedPoints,
                borderColor: 'rgba(79, 70, 229, 0.8)',
                backgroundColor: 'rgba(79, 70, 229, 0.3)',
                fill: 'origin',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 0,
                tension: 0.4
            },
            {
                type: 'line',
                label: 'Your Theta',
                data: [
                    { x: stats.avgTheta, y: 0 },
                    { x: stats.avgTheta, y: Math.exp(-0.5 * stats.avgTheta * stats.avgTheta) / Math.sqrt(2 * Math.PI) }
                ],
                borderColor: 'rgba(239, 68, 68, 1)',
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                showLine: true
            }
        ]
    };

    const normalDistOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(79, 70, 229, 0.8)',
                borderWidth: 2,
                cornerRadius: 8,
                padding: 12
            }
        },
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                min: -4.5,      // Scaled range
                max: 4.5,       // Scaled range
                title: {
                    display: true,
                    text: 'Theta (θ × 1.5)',  // Updated label
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            y: {
                min: 0,
                max: 0.45,
                title: {
                    display: true,
                    text: 'Probability Density',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            }
        }
    };

    return (
        <div className={`results-page ${isLoaded ? 'loaded' : ''}`}>
            <div className="results-container">
                {/* Header */}
                <div className="results-header">
                    <div className="success-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1>Quiz Complete! 🎉</h1>
                    <p>Here's how you performed</p>
                </div>

                {/* Performance Summary Cards */}
                <div className="performance-grid">
                    <div className="performance-card accuracy-card">
                        <div className="card-icon">🎯</div>
                        <div className="card-content">
                            <div className="metric-value">{stats.totalAccuracy}%</div>
                            <div className="metric-label">Overall Accuracy</div>
                            <div className="metric-detail">{stats.totalCorrect}/{stats.totalQuestions} questions</div>
                        </div>
                    </div>

                    <div className="performance-card ability-card">
                        <div className="card-icon">🧠</div>
                        <div className="card-content">
                            <div className="metric-value" style={{ color: stats.abilityInfo.color }}>
                                {stats.abilityInfo.level}
                            </div>
                            <div className="metric-label">Performance Level</div>
                            <div className="metric-detail">{stats.abilityInfo.description}</div>
                        </div>
                    </div>

                    <div className="performance-card theta-card">
                        <div className="card-icon">📊</div>
                        <div className="card-content">
                            <div className="metric-value">{stats.avgTheta.toFixed(2)}</div>
                            <div className="metric-label">Average Theta</div>
                            <div className="metric-detail">{stats.percentile}th percentile</div>
                        </div>
                    </div>

                    {/* New Time Card */}
                    {result.total_time && (
                        <div className="performance-card time-card">
                            <div className="card-icon">⏱️</div>
                            <div className="card-content">
                                <div className="metric-value">{stats.formattedTotalTime}</div>
                                <div className="metric-label">Total Time</div>
                                <div className="metric-detail">{stats.timePerQuestion}/question</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Normal Distribution Chart */}
                <div className="normal-dist-section">
                    <h3>📈 Your Performance in Context</h3>
                    <div className="chart-container normal-dist-container">
                        <div className="chart-info">
                            <p>This chart shows your scaled theta score (θ × 1.5 = {stats.avgTheta.toFixed(2)}) in the context of a normal distribution. The shaded area represents the percentage of people you've outperformed.</p>
                        </div>
                        <div className="normal-dist-chart">
                            <Line data={normalDistData} options={normalDistOptions} height={300} />
                        </div>
                        <div className="percentile-info">
                            <span>You scored better than <strong>{stats.percentile}%</strong> of test-takers!</span>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="charts-section">
                    <div className="chart-container">
                        <h3>🎯 Ability Profile</h3>
                        <div className="radar-chart-wrapper">
                            <Radar
                                data={radarData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        r: {
                                            beginAtZero: true,
                                            max: 4.5,      // Scaled max: 3 × 1.5 = 4.5
                                            min: -4.5,     // Scaled min: -3 × 1.5 = -4.5
                                            ticks: {
                                                stepSize: 0.75,  // Scaled step: 0.5 × 1.5 = 0.75
                                                color: '#6B7280',
                                                display: false  // Hide the tick labels on radar axes
                                            },
                                            grid: {
                                                color: '#E5E7EB'
                                            },
                                            angleLines: {
                                                color: '#E5E7EB'
                                            },
                                            pointLabels: {
                                                color: '#374151',
                                                font: {
                                                    size: 14,
                                                    weight: '500'
                                                }
                                            }
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            display: false
                                        },
                                        tooltip: {
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            titleColor: 'white',
                                            bodyColor: 'white',
                                            borderColor: 'rgba(79, 70, 229, 0.8)',
                                            borderWidth: 2,
                                            cornerRadius: 8,
                                            padding: 12,
                                            callbacks: {
                                                label: function (context) {
                                                    return `${context.dataset.label}: ${context.parsed.r.toFixed(2)}`;
                                                }
                                            }
                                        }
                                    }
                                }}
                                height={400}
                            />
                        </div>
                    </div>

                    <div className="chart-container">
                        <h3>📈 Subject Performance</h3>
                        <div className="bar-chart-wrapper">
                            <Bar
                                data={barData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false
                                        },
                                        tooltip: {
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            titleColor: 'white',
                                            bodyColor: 'white',
                                            borderColor: 'rgba(79, 70, 229, 0.8)',
                                            borderWidth: 2,
                                            cornerRadius: 8,
                                            padding: 12
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            max: Math.max(...Object.values(stats.subjectStats).map(s => s.total)),
                                            ticks: {
                                                color: '#6B7280',
                                                font: {
                                                    size: 12
                                                }
                                            },
                                            grid: {
                                                color: '#F3F4F6'
                                            }
                                        },
                                        x: {
                                            ticks: {
                                                color: '#374151',
                                                font: {
                                                    size: 14,
                                                    weight: '500'
                                                }
                                            },
                                            grid: {
                                                display: false
                                            }
                                        }
                                    }
                                }}
                                height={300}
                            />
                        </div>
                    </div>
                </div>

                {/* Subject Breakdown */}
                <div className="subject-breakdown">
                    <h3>📚 Subject Breakdown</h3>
                    <div className="subject-cards">
                        {Object.entries(stats.subjectStats).map(([subjectId, stat]) => {
                            const subjectInfo = stats.subjectNames[subjectId] || { name: `Subject ${subjectId}`, icon: '📝', color: '#6B7280' };
                            return (
                                <div key={subjectId} className="subject-card">
                                    <div className="subject-header">
                                        <span className="subject-icon">{subjectInfo.icon}</span>
                                        <h4>{subjectInfo.name}</h4>
                                    </div>
                                    <div className="subject-stats">
                                        <div className="stat-item">
                                            <span className="stat-value" style={{ color: subjectInfo.color }}>
                                                {stat.accuracy}%
                                            </span>
                                            <span className="stat-label">Accuracy</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">{stat.correct}/{stat.total}</span>
                                            <span className="stat-label">Correct</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Debug Raw Data */}
                {process.env.NODE_ENV === 'development' && (
                    <div style={{
                        background: '#f8f9fa',
                        padding: '1rem',
                        margin: '1rem 0',
                        borderRadius: '8px',
                        fontSize: '12px'
                    }}>
                        <h4>Raw Result Data:</h4>
                        <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                            {JSON.stringify({
                                administered: result.administered,
                                subjects: result.subjects,
                                responses: result.responses,
                                user_answers: result.user_answers,
                                correct_answers: result.correct_answers
                            }, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Question Details Toggle */}
                <div className="details-toggle">
                    <button
                        className="toggle-button"
                        onClick={() => setShowQuestionDetails(!showQuestionDetails)}
                    >
                        {showQuestionDetails ? 'Hide' : 'Show'} Question Details
                        <span className={`toggle-icon ${showQuestionDetails ? 'rotated' : ''}`}>
                            ▼
                        </span>
                    </button>
                </div>

                {/* Detailed Question Analysis - FIXED SECTION */}
                {showQuestionDetails && (
                    <div className="question-details slide-up">
                        <h3>📋 Detailed Question Analysis</h3>

                        {/* Debug Information */}
                        {process.env.NODE_ENV === 'development' && (
                            <div style={{ background: '#f0f0f0', padding: '10px', marginBottom: '20px', borderRadius: '5px' }}>
                                <h4>Debug Info:</h4>
                                <p>Total administered: {result.administered?.length || 0}</p>
                                <p>Total responses: {result.responses?.length || 0}</p>
                                <p>Total subjects: {result.subjects?.length || 0}</p>
                                <p>Total user_answers: {result.user_answers?.length || 0}</p>
                                <p>First few subjects: {JSON.stringify(result.subjects?.slice(0, 5))}</p>
                                <p>First few administered: {JSON.stringify(result.administered?.slice(0, 5))}</p>
                                <p>Subject stats keys: {JSON.stringify(Object.keys(stats.subjectStats))}</p>
                                <p>Questions per subject: {JSON.stringify(
                                    Object.entries(stats.subjectStats).map(([key, stat]) =>
                                        `${key}: ${stat.questions.length} questions`
                                    )
                                )}</p>
                            </div>
                        )}

                        {Object.entries(stats.subjectStats).map(([subjectId, stat]) => {
                            const subjectInfo = stats.subjectNames[subjectId] || { name: `Subject ${subjectId}`, icon: '📝', color: '#6B7280' };
                            console.log(`Rendering subject ${subjectId}:`, stat);

                            return (
                                <div key={subjectId} className="question-subject-group">
                                    <h4 className="subject-group-header">
                                        <span className="subject-icon">{subjectInfo.icon}</span>
                                        {subjectInfo.name} ({stat.accuracy}% correct) - {stat.questions.length} questions
                                    </h4>

                                    {/* Fixed Flexbox container for questions */}
                                    <div className="question-flexbox">
                                        {stat.questions.map((q, idx) => {
                                            const imagePath = `/images/${q.qid}.jpg`;
                                            console.log(`📸 Question ${idx} for subject ${subjectId}:`, q);
                                            console.log(`📍 Image path: ${imagePath}`);

                                            return (
                                                <div
                                                    key={`${subjectId}-${idx}`}
                                                    className={`question-card-flex ${questionCardsVisible ? 'visible' : ''}`}
                                                    style={{
                                                        animationDelay: `${idx * 0.1}s`,
                                                        opacity: questionCardsVisible ? 1 : 0,
                                                        transform: questionCardsVisible ? 'translateY(0)' : 'translateY(20px)',
                                                        transition: 'all 0.6s ease-out'
                                                    }}
                                                >
                                                    <div className="question-image-container">
                                                        <img
                                                            src={imagePath}
                                                            alt={`Question ${q.qid}`}
                                                            className={`question-image-interactive ${q.isCorrect ? 'correct' : 'incorrect'}`}
                                                            onClick={() => handleQuestionClick(q)}
                                                            onError={(e) => handleImageError(e, q.qid)}
                                                            onLoad={() => handleImageLoad(q.qid)}
                                                            style={{ display: 'block' }}
                                                        />
                                                        <div
                                                            className="image-placeholder-flex"
                                                            style={{
                                                                display: 'none',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => handleQuestionClick(q)}
                                                        >
                                                            <span style={{ fontSize: '2rem' }}>📷</span>
                                                            <p style={{ margin: '0.5rem 0', fontSize: '14px', fontWeight: 'bold' }}>
                                                                Question {q.qid}
                                                            </p>
                                                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                                                {q.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                                                            </p>
                                                            <p style={{ margin: '0.25rem 0', fontSize: '11px', color: '#999' }}>
                                                                Your answer: {q.userAnswer} | Correct: {q.correctAnswer}
                                                            </p>
                                                        </div>
                                                        <div className={`question-status-overlay ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                                                            <span className="status-icon-overlay">
                                                                {q.isCorrect ? '✓' : '✗'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Question Detail Modal */}
                {showQuestionModal && selectedQuestion && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Question Details</h3>
                                <button className="modal-close" onClick={closeModal}>✕</button>
                            </div>
                            <div className="modal-body">
                                <div className="modal-image-section">
                                    <img
                                        src={`/images/${selectedQuestion.qid}.jpg`}
                                        alt="question"
                                        className="modal-question-image"
                                    />
                                </div>
                                <div className="modal-info-section">
                                    <div className={`modal-status ${selectedQuestion.isCorrect ? 'correct' : 'incorrect'}`}>
                                        <span className="modal-status-icon">
                                            {selectedQuestion.isCorrect ? '✓' : '✗'}
                                        </span>
                                        <span className="modal-status-text">
                                            {selectedQuestion.isCorrect ? 'Correct!' : 'Incorrect'}
                                        </span>
                                    </div>
                                    <div className="modal-answers">
                                        <div className="modal-answer-row">
                                            <span className="answer-label">Your answer:</span>
                                            <span className={`answer-badge ${selectedQuestion.isCorrect ? 'correct' : 'incorrect'}`}>
                                                {selectedQuestion.userAnswer}
                                            </span>
                                        </div>
                                        <div className="modal-answer-row">
                                            <span className="answer-label">Correct answer:</span>
                                            <span className="answer-badge correct">
                                                {selectedQuestion.correctAnswer}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="modal-placeholder">
                                        <div className="future-feature">
                                            <h4>Coming Soon 🚀</h4>
                                            <ul>
                                                <li>AI-powered explanation</li>
                                                <li>Similar practice questions</li>
                                                <li>Learning recommendations</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}