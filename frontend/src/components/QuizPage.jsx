import React, { useState, useEffect } from 'react';

export function QuizPage({ onFinish }) {
    const [item, setItem] = useState(null);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timeProgress, setTimeProgress] = useState(0);

    // Expected time per question (in seconds)
    const expectedTimePerQuestion = 45; // 45 seconds per question
    const maxExpectedTime = 30 * expectedTimePerQuestion; // 30 questions * 45s = 22.5 minutes

    // Load first question on component mount
    useEffect(() => {
        const sessionStartTime = Date.now();
        setStartTime(sessionStartTime);

        fetch('/start')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('>>> Initial item received:', data);
                setItem(data);
            })
            .catch(err => {
                console.error('Error fetching start:', err);
                alert('Failed to start quiz. Please check if the API is running.');
            });
    }, []);

    // Update time bar every second
    useEffect(() => {
        if (!startTime) return;

        const timer = setInterval(() => {
            const now = Date.now();
            const elapsed = (now - startTime) / 1000; // Convert to seconds
            setElapsedTime(elapsed);

            // Calculate progress (0-100%)
            const progress = Math.min((elapsed / maxExpectedTime) * 100, 100);
            setTimeProgress(progress);
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime, maxExpectedTime]);

    // Submit answer and get next question
    const submitAnswer = async () => {
        if (!item || !answer) return;

        setLoading(true);

        try {
            const payload = {
                session_id: item.session_id,
                item_index: item.item_index,
                answer: answer,
                elapsed_time: elapsedTime  // Send elapsed time
            };

            console.log('>>> Sending /next payload:', payload);

            const res = await fetch('/next', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            console.log('>>> Raw /next response:', data);

            // Check if quiz is finished - handle both scalar and array formats
            const isFinished = Array.isArray(data.finished) ? data.finished[0] : data.finished;
            if (isFinished === true || isFinished === 'true') {
                console.log('>>> Quiz finished!');
                // Send session-end notification with total time
                const sessionId = Array.isArray(item.session_id) ? item.session_id[0] : item.session_id;
                await fetch('/session-end', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: sessionId,
                        total_time: elapsedTime
                    })
                });

                // Add timing info to result
                const resultWithTime = {
                    ...data,
                    total_time: elapsedTime,
                    time_per_question: elapsedTime / (data.administered?.length || 1)
                };

                onFinish(resultWithTime);
                return;
            }

            // Prepare next item
            const nextItem = {
                ...data,
                item_index: Array.isArray(data.item_index) ? data.item_index[0] : data.item_index,
                question_id: Array.isArray(data.question_id) ? data.question_id[0] : data.question_id
            };

            setItem(nextItem);
            setAnswer('');

        } catch (err) {
            console.error('Error in submitAnswer:', err);
            alert('Error submitting answer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Format time to display
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Get time bar color based on progress
    const getTimeBarColor = () => {
        if (timeProgress < 50) return '#10B981'; // Green
        if (timeProgress < 75) return '#F59E0B'; // Yellow
        return '#EF4444'; // Red
    };

    if (!item) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '50vh',
                fontSize: '18px'
            }}>
                Loading question...
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
            {/* Header with time progress */}
            <div style={{
                marginBottom: 20,
                padding: 15,
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h2 style={{ margin: 0 }}>Test in Progress</h2>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                        Stage: {item.stage} | Category: {item.category}
                    </p>
                </div>
                <div style={{ textAlign: 'right', minWidth: '200px' }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                        Time: {formatTime(elapsedTime)}
                    </div>
                    <div style={{
                        width: '200px',
                        height: '12px',
                        backgroundColor: '#E5E7EB',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <div
                            style={{
                                height: '100%',
                                backgroundColor: getTimeBarColor(),
                                width: `${timeProgress}%`,
                                transition: 'all 0.3s ease',
                                borderRadius: '6px'
                            }}
                        />
                        {timeProgress >= 100 && (
                            <div style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                                animation: 'shimmer 2s infinite'
                            }} />
                        )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                        Expected: ~{Math.round(maxExpectedTime / 60)} minutes
                    </div>
                </div>
            </div>

            {/* Question image */}
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <img
                    src={`/images/${item.question_id}.jpg`}
                    alt="question"
                    style={{
                        maxWidth: '100%',
                        maxHeight: '400px',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    onError={(e) => {
                        console.error(`Failed to load image: ${item.question_id}.jpg`);
                        e.target.style.display = 'none';
                    }}
                />
            </div>

            {/* Answer choices */}
            <div style={{ marginBottom: 20 }}>
                <h3 style={{ marginBottom: 15 }}>Choose your answer:</h3>
                {item.choices && item.choices.map(choice => (
                    <div key={choice} style={{
                        marginBottom: 10,
                        padding: 12,
                        borderRadius: 8,
                        border: '2px solid',
                        borderColor: answer === choice ? '#4CAF50' : '#ddd',
                        backgroundColor: answer === choice ? '#f1f8e9' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                        onClick={() => setAnswer(choice)}>
                        <label style={{ cursor: 'pointer', display: 'block' }}>
                            <input
                                type="radio"
                                name="choice"
                                value={choice}
                                checked={answer === choice}
                                onChange={() => setAnswer(choice)}
                                style={{ marginRight: 10 }}
                            />
                            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                Option {choice}
                            </span>
                        </label>
                    </div>
                ))}
            </div>

            {/* Submit button */}
            <div style={{ textAlign: 'center' }}>
                <button
                    onClick={submitAnswer}
                    disabled={!answer || loading}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        backgroundColor: answer && !loading ? '#4CAF50' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: answer && !loading ? 'pointer' : 'not-allowed',
                        minWidth: '150px'
                    }}
                >
                    {loading ? 'Submitting...' : 'Submit Answer'}
                </button>
            </div>

            {/* Debug info (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{
                    marginTop: 30,
                    padding: 10,
                    backgroundColor: '#f0f0f0',
                    borderRadius: 5,
                    fontSize: '12px'
                }}>
                    <details>
                        <summary>Debug Info</summary>
                        <pre>{JSON.stringify(item, null, 2)}</pre>
                        <p>Elapsed Time: {formatTime(elapsedTime)}</p>
                        <p>Progress: {timeProgress.toFixed(1)}%</p>
                    </details>
                </div>
            )}

            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}