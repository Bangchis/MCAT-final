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

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    // Calculate detailed statistics
    const stats = useMemo(() => {
        if (!result) return null;

        const administered = result.administered || [];
        const responses = result.responses || [];
        const userAnswers = result.user_answers || [];
        const subjects = result.subjects || [];
        const correctAnswers = result.correct_answers || [];

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

            // Convert user answer from 1-4 to A-D
            const userAnswerLetter = String.fromCharCode(64 + userAnswers[idx]);
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

        // Calculate accuracy percentages
        Object.keys(subjectStats).forEach(subject => {
            const stat = subjectStats[subject];
            stat.accuracy = Math.round((stat.correct / stat.total) * 100);
        });

        // Calculate overall stats
        const totalCorrect = responses.filter(r => r === 1).length;
        const totalAccuracy = Math.round((totalCorrect / responses.length) * 100);
        const avgTheta = result.theta.reduce((sum, val) => sum + val, 0) / result.theta.length;

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

        // Create normal distribution data inline
        const points = [];
        const shadedPoints = [];
        const range = 6; // -3 to 3 standard deviations
        const steps = 200;

        for (let i = 0; i <= steps; i++) {
            const x = -range / 2 + (range * i / steps);
            const y = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

            points.push({ x, y });

            // Add to shaded area if below user's theta
            if (x <= avgTheta) {
                shadedPoints.push({ x, y });
            }
        }

        const normalDistData = { points, shadedPoints };

        // Calculate theta interpretation
        const getAbilityLevel = (theta) => {
            if (theta < -1) return { level: 'Beginner', color: '#EF4444', description: 'Need more practice' };
            if (theta < 0) return { level: 'Below Average', color: '#F59E0B', description: 'Room for improvement' };
            if (theta < 0.5) return { level: 'Average', color: '#3B82F6', description: 'Good foundation' };
            if (theta < 1) return { level: 'Above Average', color: '#8B5CF6', description: 'Strong performance' };
            return { level: 'Advanced', color: '#10B981', description: 'Excellent mastery' };
        };

        const abilityInfo = getAbilityLevel(avgTheta);

        // Get subject names for display
        const subjectNames = {
            '0': { name: 'Mathematics', icon: '🔢', color: '#3B82F6' },
            '1': { name: 'Physics', icon: '⚛️', color: '#8B5CF6' },
            '2': { name: 'Chemistry', icon: '🧪', color: '#10B981' },
            '3': { name: 'Biology', icon: '🧬', color: '#F59E0B' }
        };

        return {
            subjectStats,
            questionDetails,
            totalAccuracy,
            totalCorrect,
            totalQuestions: responses.length,
            avgTheta,
            percentile,
            normalDistData,
            abilityInfo,
            formattedTotalTime,
            timePerQuestion,
            dimensionNames: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
            subjectNames
        };
    }, [result]);

    // Create normal distribution data with shaded area
    const createNormalDistribution = (userTheta) => {
        const points = [];
        const shadedPoints = [];
        const range = 6; // -3 to 3 standard deviations
        const steps = 200;

        for (let i = 0; i <= steps; i++) {
            const x = -range / 2 + (range * i / steps);
            const y = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

            points.push({ x, y });

            // Add to shaded area if below user's theta
            if (x <= userTheta) {
                shadedPoints.push({ x, y });
            }
        }

        return { points, shadedPoints };
    };

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

    // Prepare chart data
    const radarData = {
        labels: stats.dimensionNames,
        datasets: [{
            label: 'Ability Level (θ)',
            data: result.theta,
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
                min: -3,
                max: 3,
                title: {
                    display: true,
                    text: 'Theta (θ)',
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
                            <p>This chart shows your theta score (θ = {stats.avgTheta.toFixed(2)}) in the context of a normal distribution. The shaded area represents the percentage of people you've outperformed.</p>
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
                                            max: 3,
                                            min: -3,
                                            ticks: {
                                                stepSize: 0.5,
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

                {/* Detailed Question Analysis */}
                {showQuestionDetails && (
                    <div className="question-details slide-up">
                        <h3>📋 Detailed Question Analysis</h3>
                        {Object.entries(stats.subjectStats).map(([subjectId, stat]) => {
                            const subjectInfo = stats.subjectNames[subjectId] || { name: `Subject ${subjectId}`, icon: '📝', color: '#6B7280' };
                            return (
                                <div key={subjectId} className="question-subject-group">
                                    <h4 className="subject-group-header">
                                        <span className="subject-icon">{subjectInfo.icon}</span>
                                        {subjectInfo.name} ({stat.accuracy}% correct)
                                    </h4>
                                    <div className="question-grid">
                                        {stat.questions.map((q, idx) => (
                                            <div key={idx} className={`question-card ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                                                <div className="question-status">
                                                    <span className={`status-icon ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                                                        {q.isCorrect ? '✓' : '✗'}
                                                    </span>
                                                    <span className="status-text">
                                                        {q.isCorrect ? 'Correct' : 'Wrong'}
                                                    </span>
                                                </div>

                                                <div className="question-image">
                                                    <img
                                                        src={`/images/${q.qid}.jpg`}
                                                        alt="question"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextElementSibling.style.display = 'block';
                                                        }}
                                                    />
                                                    <div className="image-placeholder" style={{ display: 'none' }}>
                                                        <span>📷</span>
                                                        <p>Question {q.qid}</p>
                                                    </div>
                                                </div>

                                                <div className="question-answers">
                                                    <div className="answer-row">
                                                        <span className="answer-label">Your answer:</span>
                                                        <span className={`answer-value ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                                                            {q.userAnswer}
                                                        </span>
                                                    </div>
                                                    <div className="answer-row">
                                                        <span className="answer-label">Correct answer:</span>
                                                        <span className="answer-value correct">
                                                            {q.correctAnswer}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}