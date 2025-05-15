// // // // // // // // import React, { useState, useEffect } from 'react';

// // // // // // // // const API_URL = process.env.REACT_APP_API_URL || '';

// // // // // // // // export function QuizPage({ onFinish }) {
// // // // // // // //     const [item, setItem] = useState(null);
// // // // // // // //     const [answer, setAnswer] = useState('');
// // // // // // // //     const [loading, setLoading] = useState(false);
// // // // // // // //     const [startTime, setStartTime] = useState(null);
// // // // // // // //     const [elapsedTime, setElapsedTime] = useState(0);
// // // // // // // //     const [timeProgress, setTimeProgress] = useState(0);

// // // // // // // //     // Expected time per question (in seconds)
// // // // // // // //     const expectedTimePerQuestion = 45; 
// // // // // // // //     const maxExpectedTime = 30 * expectedTimePerQuestion;

// // // // // // // //     // Load first question on mount
// // // // // // // //     useEffect(() => {
// // // // // // // //         const sessionStartTime = Date.now();
// // // // // // // //         setStartTime(sessionStartTime);

// // // // // // // //         fetch(`${API_URL}/start`)
// // // // // // // //             .then(res => {
// // // // // // // //                 if (!res.ok) throw new Error(`HTTP ${res.status}`);
// // // // // // // //                 return res.json();
// // // // // // // //             })
// // // // // // // //             .then(data => {
// // // // // // // //                 console.log('>>> Initial item received:', data);
// // // // // // // //                 setItem(data);
// // // // // // // //             })
// // // // // // // //             .catch(err => {
// // // // // // // //                 console.error('Error fetching start:', err);
// // // // // // // //                 alert('Failed to start quiz. Please check if the API is running.');
// // // // // // // //             });
// // // // // // // //     }, []);

// // // // // // // //     // Timer update
// // // // // // // //     useEffect(() => {
// // // // // // // //         if (!startTime) return;
// // // // // // // //         const timer = setInterval(() => {
// // // // // // // //             const now = Date.now();
// // // // // // // //             const elapsed = (now - startTime) / 1000;
// // // // // // // //             setElapsedTime(elapsed);
// // // // // // // //             setTimeProgress(Math.min((elapsed / maxExpectedTime) * 100, 100));
// // // // // // // //         }, 1000);
// // // // // // // //         return () => clearInterval(timer);
// // // // // // // //     }, [startTime]);

// // // // // // // //     const submitAnswer = async () => {
// // // // // // // //         if (!item || !answer) return;
// // // // // // // //         setLoading(true);
// // // // // // // //         try {
// // // // // // // //             const payload = {
// // // // // // // //                 session_id: item.session_id,
// // // // // // // //                 item_index: item.item_index,
// // // // // // // //                 answer,
// // // // // // // //                 elapsed_time: elapsedTime
// // // // // // // //             };
// // // // // // // //             console.log('>>> Sending /next payload:', payload);

// // // // // // // //             const res = await fetch(`${API_URL}/next`, {
// // // // // // // //                 method: 'POST',
// // // // // // // //                 headers: { 'Content-Type': 'application/json' },
// // // // // // // //                 body: JSON.stringify(payload)
// // // // // // // //             });
// // // // // // // //             if (!res.ok) throw new Error(`HTTP ${res.status}`);
// // // // // // // //             const data = await res.json();
// // // // // // // //             console.log('>>> Raw /next response:', data);

// // // // // // // //             const isFinished = Array.isArray(data.finished)
// // // // // // // //                 ? data.finished[0]
// // // // // // // //                 : data.finished;
// // // // // // // //             if (isFinished === true || isFinished === 'true') {
// // // // // // // //                 // session-end
// // // // // // // //                 const sid = Array.isArray(item.session_id)
// // // // // // // //                     ? item.session_id[0]
// // // // // // // //                     : item.session_id;
// // // // // // // //                 await fetch(`${API_URL}/session-end`, {
// // // // // // // //                     method: 'POST',
// // // // // // // //                     headers: { 'Content-Type': 'application/json' },
// // // // // // // //                     body: JSON.stringify({ session_id: sid, total_time: elapsedTime })
// // // // // // // //                 });
// // // // // // // //                 const resultWithTime = {
// // // // // // // //                     ...data,
// // // // // // // //                     total_time: elapsedTime,
// // // // // // // //                     time_per_question: elapsedTime / (data.administered?.length || 1)
// // // // // // // //                 };
// // // // // // // //                 onFinish(resultWithTime);
// // // // // // // //                 return;
// // // // // // // //             }

// // // // // // // //             const nextItem = {
// // // // // // // //                 ...data,
// // // // // // // //                 item_index: Array.isArray(data.item_index) ? data.item_index[0] : data.item_index,
// // // // // // // //                 question_id: Array.isArray(data.question_id) ? data.question_id[0] : data.question_id
// // // // // // // //             };
// // // // // // // //             setItem(nextItem);
// // // // // // // //             setAnswer('');
// // // // // // // //         } catch (err) {
// // // // // // // //             console.error('Error in submitAnswer:', err);
// // // // // // // //             alert('Error submitting answer. Please try again.');
// // // // // // // //         } finally {
// // // // // // // //             setLoading(false);
// // // // // // // //         }
// // // // // // // //     };

// // // // // // // //     const formatTime = (s) => {
// // // // // // // //         const m = Math.floor(s / 60);
// // // // // // // //         const sec = Math.floor(s % 60);
// // // // // // // //         return `${m}:${sec.toString().padStart(2, '0')}`;
// // // // // // // //     };

// // // // // // // //     const getTimeBarColor = () => {
// // // // // // // //         if (timeProgress < 50) return '#10B981';
// // // // // // // //         if (timeProgress < 75) return '#F59E0B';
// // // // // // // //         return '#EF4444';
// // // // // // // //     };

// // // // // // // //     if (!item) {
// // // // // // // //         return (
// // // // // // // //             <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'50vh' }}>
// // // // // // // //                 Loading question...
// // // // // // // //             </div>
// // // // // // // //         );
// // // // // // // //     }

// // // // // // // //     return (
// // // // // // // //         <div style={{ padding:20, maxWidth:800, margin:'0 auto' }}>
// // // // // // // //             {/* ... phần header và timer giống cũ ... */}

// // // // // // // //             {/* Question image */}
// // // // // // // //             <div style={{ marginBottom:20, textAlign:'center' }}>
// // // // // // // //                 <img
// // // // // // // //                     src={`${API_URL}/images/${item.question_id}.jpg`}
// // // // // // // //                     alt="question"
// // // // // // // //                     style={{ maxWidth:'100%', maxHeight:400, borderRadius:8 }}
// // // // // // // //                     onError={e => { e.target.style.display='none'; }}
// // // // // // // //                 />
// // // // // // // //             </div>

// // // // // // // //             {/* Choices và button giống cũ, chỉ sửa submitAnswer đã dùng API_URL */}

// // // // // // // //             {/* Debug (nếu cần) */}
// // // // // // // //         </div>
// // // // // // // //     );
// // // // // // // // }



// // // // // // // // frontend/src/components/QuizPage.jsx

// // // // // // // import React, { useState, useEffect } from 'react';

// // // // // // // // Dùng full URL cho API (trong browser, localhost:5000 là Flask proxy)
// // // // // // // const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// // // // // // // export function QuizPage({ onFinish }) {
// // // // // // //     const [item, setItem] = useState(null);
// // // // // // //     const [answer, setAnswer] = useState('');
// // // // // // //     const [loading, setLoading] = useState(false);
// // // // // // //     const [startTime, setStartTime] = useState(null);
// // // // // // //     const [elapsedTime, setElapsedTime] = useState(0);
// // // // // // //     const [timeProgress, setTimeProgress] = useState(0);

// // // // // // //     // Expected time per question (in seconds)
// // // // // // //     const expectedTimePerQuestion = 45; 
// // // // // // //     const maxExpectedTime = 30 * expectedTimePerQuestion; // 22.5 minutes

// // // // // // //     // Load first question on mount
// // // // // // //     useEffect(() => {
// // // // // // //         const sessionStartTime = Date.now();
// // // // // // //         setStartTime(sessionStartTime);

// // // // // // //         fetch(`${API_URL}/start`)
// // // // // // //             .then(res => {
// // // // // // //                 if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
// // // // // // //                 return res.json();
// // // // // // //             })
// // // // // // //             .then(data => {
// // // // // // //                 console.log('>>> Initial item received:', data);
// // // // // // //                 setItem(data);
// // // // // // //             })
// // // // // // //             .catch(err => {
// // // // // // //                 console.error('Error fetching start:', err);
// // // // // // //                 alert('Failed to start quiz. Please check if the API is running.');
// // // // // // //             });
// // // // // // //     }, []);

// // // // // // //     // Update timer every second
// // // // // // //     useEffect(() => {
// // // // // // //         if (!startTime) return;
// // // // // // //         const timer = setInterval(() => {
// // // // // // //             const now = Date.now();
// // // // // // //             const elapsed = (now - startTime) / 1000; // seconds
// // // // // // //             setElapsedTime(elapsed);
// // // // // // //             setTimeProgress(Math.min((elapsed / maxExpectedTime) * 100, 100));
// // // // // // //         }, 1000);
// // // // // // //         return () => clearInterval(timer);
// // // // // // //     }, [startTime]);

// // // // // // //     // Submit answer and fetch next question
// // // // // // //     const submitAnswer = async () => {
// // // // // // //         if (!item || !answer) return;
// // // // // // //         setLoading(true);

// // // // // // //         try {
// // // // // // //             const payload = {
// // // // // // //                 session_id: item.session_id,
// // // // // // //                 item_index: item.item_index,
// // // // // // //                 answer: answer,
// // // // // // //                 elapsed_time: elapsedTime
// // // // // // //             };
// // // // // // //             console.log('>>> Sending /next payload:', payload);

// // // // // // //             const res = await fetch(`${API_URL}/next`, {
// // // // // // //                 method: 'POST',
// // // // // // //                 headers: { 'Content-Type': 'application/json' },
// // // // // // //                 body: JSON.stringify(payload)
// // // // // // //             });
// // // // // // //             if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
// // // // // // //             const data = await res.json();
// // // // // // //             console.log('>>> Raw /next response:', data);
            

// // // // // // //             const isFinished = Array.isArray(data.finished)
// // // // // // //                 ? data.finished[0]
// // // // // // //                 : data.finished;
// // // // // // //             if (isFinished === true || isFinished === 'true') {
// // // // // // //                 // Notify session-end
// // // // // // //                 const sid = Array.isArray(item.session_id)
// // // // // // //                     ? item.session_id[0]
// // // // // // //                     : item.session_id;
// // // // // // //                 await fetch(`${API_URL}/session-end`, {
// // // // // // //                     method: 'POST',
// // // // // // //                     headers: { 'Content-Type': 'application/json' },
// // // // // // //                     body: JSON.stringify({ session_id: sid, total_time: elapsedTime })
// // // // // // //                 });

// // // // // // //                 const resultWithTime = {
// // // // // // //                     ...data,
// // // // // // //                     total_time: elapsedTime,
// // // // // // //                     time_per_question: elapsedTime / (data.administered?.length || 1)
// // // // // // //                 };
// // // // // // //                 onFinish(resultWithTime);
// // // // // // //                 return;
// // // // // // //             }

// // // // // // //             // Prepare next question
// // // // // // //             const nextItem = {
// // // // // // //                 ...data,
// // // // // // //                 item_index: Array.isArray(data.item_index) ? data.item_index[0] : data.item_index,
// // // // // // //                 question_id: Array.isArray(data.question_id) ? data.question_id[0] : data.question_id
// // // // // // //             };
// // // // // // //             setItem(nextItem);
// // // // // // //             setAnswer('');
// // // // // // //         } catch (err) {
// // // // // // //             console.error('Error in submitAnswer:', err);
// // // // // // //             alert('Error submitting answer. Please try again.');
// // // // // // //         } finally {
// // // // // // //             setLoading(false);
// // // // // // //         }
// // // // // // //     };

// // // // // // //     // Format elapsed time as mm:ss
// // // // // // //     const formatTime = (s) => {
// // // // // // //         const m = Math.floor(s / 60);
// // // // // // //         const sec = Math.floor(s % 60);
// // // // // // //         return `${m}:${sec.toString().padStart(2, '0')}`;
// // // // // // //     };

// // // // // // //     // Color of time progress bar
// // // // // // //     const getTimeBarColor = () => {
// // // // // // //         if (timeProgress < 50) return '#10B981';
// // // // // // //         if (timeProgress < 75) return '#F59E0B';
// // // // // // //         return '#EF4444';
// // // // // // //     };

// // // // // // //     if (!item) {
// // // // // // //         return (
// // // // // // //             <div style={{
// // // // // // //                 display: 'flex',
// // // // // // //                 justifyContent: 'center',
// // // // // // //                 alignItems: 'center',
// // // // // // //                 height: '50vh',
// // // // // // //                 fontSize: '18px'
// // // // // // //             }}>
// // // // // // //                 Loading question...
// // // // // // //             </div>
// // // // // // //         );
// // // // // // //     }

// // // // // // //     return (
// // // // // // //         <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
// // // // // // //             {/* Header with time progress */}
// // // // // // //             <div style={{
// // // // // // //                 marginBottom: 20,
// // // // // // //                 padding: 15,
// // // // // // //                 backgroundColor: '#f5f5f5',
// // // // // // //                 borderRadius: 8,
// // // // // // //                 display: 'flex',
// // // // // // //                 justifyContent: 'space-between',
// // // // // // //                 alignItems: 'center'
// // // // // // //             }}>
// // // // // // //                 <div>
// // // // // // //                     <h2 style={{ margin: 0 }}>Test in Progress</h2>
// // // // // // //                     <p style={{ margin: '5px 0', color: '#666' }}>
// // // // // // //                         Stage: {item.stage} | Category: {item.category}
// // // // // // //                     </p>
// // // // // // //                 </div>
// // // // // // //                 <div style={{ textAlign: 'right', minWidth: '200px' }}>
// // // // // // //                     <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
// // // // // // //                         Time: {formatTime(elapsedTime)}
// // // // // // //                     </div>
// // // // // // //                     <div style={{
// // // // // // //                         width: '200px',
// // // // // // //                         height: '12px',
// // // // // // //                         backgroundColor: '#E5E7EB',
// // // // // // //                         borderRadius: '6px',
// // // // // // //                         overflow: 'hidden',
// // // // // // //                         position: 'relative'
// // // // // // //                     }}>
// // // // // // //                         <div
// // // // // // //                             style={{
// // // // // // //                                 height: '100%',
// // // // // // //                                 backgroundColor: getTimeBarColor(),
// // // // // // //                                 width: `${timeProgress}%`,
// // // // // // //                                 transition: 'all 0.3s ease',
// // // // // // //                                 borderRadius: '6px'
// // // // // // //                             }}
// // // // // // //                         />
// // // // // // //                         {timeProgress >= 100 && (
// // // // // // //                             <div style={{
// // // // // // //                                 position: 'absolute',
// // // // // // //                                 top: 0,
// // // // // // //                                 left: 0,
// // // // // // //                                 right: 0,
// // // // // // //                                 bottom: 0,
// // // // // // //                                 background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
// // // // // // //                                 animation: 'shimmer 2s infinite'
// // // // // // //                             }} />
// // // // // // //                         )}
// // // // // // //                     </div>
// // // // // // //                     <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
// // // // // // //                         Expected: ~{Math.round(maxExpectedTime / 60)} minutes
// // // // // // //                     </div>
// // // // // // //                 </div>
// // // // // // //             </div>

// // // // // // //             {/* Question image */}
// // // // // // //             <div style={{ marginBottom: 20, textAlign: 'center' }}>
// // // // // // //                 <img
// // // // // // //                     src={`${API_URL}/images/${item.question_id}.jpg`}
// // // // // // //                     alt="question"
// // // // // // //                     style={{
// // // // // // //                         maxWidth: '100%',
// // // // // // //                         maxHeight: '400px',
// // // // // // //                         borderRadius: 8,
// // // // // // //                         boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
// // // // // // //                     }}
// // // // // // //                     onError={e => { e.target.style.display = 'none'; }}
// // // // // // //                 />
// // // // // // //             </div>

// // // // // // //             {/* Answer choices */}
// // // // // // //             <div style={{ marginBottom: 20 }}>
// // // // // // //                 <h3 style={{ marginBottom: 15 }}>Choose your answer:</h3>
// // // // // // //                 {item.choices && item.choices.map(choice => (
// // // // // // //                     <div key={choice} style={{
// // // // // // //                         marginBottom: 10,
// // // // // // //                         padding: 12,
// // // // // // //                         borderRadius: 8,
// // // // // // //                         border: '2px solid',
// // // // // // //                         borderColor: answer === choice ? '#4CAF50' : '#ddd',
// // // // // // //                         backgroundColor: answer === choice ? '#f1f8e9' : 'white',
// // // // // // //                         cursor: 'pointer',
// // // // // // //                         transition: 'all 0.2s'
// // // // // // //                     }}
// // // // // // //                         onClick={() => setAnswer(choice)}>
// // // // // // //                         <label style={{ cursor: 'pointer', display: 'block' }}>
// // // // // // //                             <input
// // // // // // //                                 type="radio"
// // // // // // //                                 name="choice"
// // // // // // //                                 value={choice}
// // // // // // //                                 checked={answer === choice}
// // // // // // //                                 onChange={() => setAnswer(choice)}
// // // // // // //                                 style={{ marginRight: 10 }}
// // // // // // //                             />
// // // // // // //                             <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
// // // // // // //                                 Option {choice}
// // // // // // //                             </span>
// // // // // // //                         </label>
// // // // // // //                     </div>
// // // // // // //                 ))}
// // // // // // //             </div>

// // // // // // //             {/* Submit button */}
// // // // // // //             <div style={{ textAlign: 'center' }}>
// // // // // // //                 <button
// // // // // // //                     onClick={submitAnswer}
// // // // // // //                     disabled={!answer || loading}
// // // // // // //                     style={{
// // // // // // //                         padding: '12px 24px',
// // // // // // //                         fontSize: '16px',
// // // // // // //                         fontWeight: 'bold',
// // // // // // //                         backgroundColor: answer && !loading ? '#4CAF50' : '#ccc',
// // // // // // //                         color: 'white',
// // // // // // //                         border: 'none',
// // // // // // //                         borderRadius: 8,
// // // // // // //                         cursor: answer && !loading ? 'pointer' : 'not-allowed',
// // // // // // //                         minWidth: '150px'
// // // // // // //                     }}
// // // // // // //                 >
// // // // // // //                     {loading ? 'Submitting...' : 'Submit Answer'}
// // // // // // //                 </button>
// // // // // // //             </div>

// // // // // // //             {/* Debug info (development only) */}
// // // // // // //             {process.env.NODE_ENV === 'development' && (
// // // // // // //                 <div style={{
// // // // // // //                     marginTop: 30,
// // // // // // //                     padding: 10,
// // // // // // //                     backgroundColor: '#f0f0f0',
// // // // // // //                     borderRadius: 5,
// // // // // // //                     fontSize: '12px'
// // // // // // //                 }}>
// // // // // // //                     <details>
// // // // // // //                         <summary>Debug Info</summary>
// // // // // // //                         <pre>{JSON.stringify(item, null, 2)}</pre>
// // // // // // //                         <p>Elapsed Time: {formatTime(elapsedTime)}</p>
// // // // // // //                         <p>Progress: {timeProgress.toFixed(1)}%</p>
// // // // // // //                     </details>
// // // // // // //                 </div>
// // // // // // //             )}

// // // // // // //             <style jsx>{`
// // // // // // //                 @keyframes shimmer {
// // // // // // //                     0% { transform: translateX(-100%); }
// // // // // // //                     100% { transform: translateX(100%); }
// // // // // // //                 }
// // // // // // //             `}</style>
// // // // // // //         </div>
// // // // // // //     );
// // // // // // // }
// // // // // // // frontend/src/components/QuizPage.jsx

// // // // // // import React, { useState, useEffect } from 'react';

// // // // // // // Use full URL for API; fallback to localhost proxy
// // // // // // const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// // // // // // export function QuizPage({ onFinish }) {
// // // // // //     const [item, setItem] = useState(null);
// // // // // //     const [answer, setAnswer] = useState('');
// // // // // //     const [loading, setLoading] = useState(false);
// // // // // //     const [startTime, setStartTime] = useState(null);
// // // // // //     const [elapsedTime, setElapsedTime] = useState(0);
// // // // // //     const [timeProgress, setTimeProgress] = useState(0);

// // // // // //     const expectedTimePerQuestion = 45; // seconds
// // // // // //     const maxExpectedTime = 30 * expectedTimePerQuestion; // 22.5 min

// // // // // //     // Helper: unwrap array-wrapped fields
// // // // // //     const parseItem = (data) => {
// // // // // //         const unwrap = (f) => Array.isArray(f) ? f[0] : f;
// // // // // //         return {
// // // // // //             session_id: unwrap(data.session_id),
// // // // // //             stage: data.stage ? unwrap(data.stage) : undefined,
// // // // // //             item_index: data.item_index ? unwrap(data.item_index) : undefined,
// // // // // //             question_id: data.question_id ? unwrap(data.question_id) : undefined,
// // // // // //             discrimination: data.discrimination || [],
// // // // // //             difficulty: data.difficulty ? unwrap(data.difficulty) : undefined,
// // // // // //             category: data.category ? unwrap(data.category) : undefined,
// // // // // //             choices: data.choices || [],
// // // // // //             correct_answer: data.correct_answer !== undefined ? unwrap(data.correct_answer) : undefined,
// // // // // //             finished: data.finished !== undefined ? unwrap(data.finished) : undefined,
// // // // // //             theta: data.theta || [],
// // // // // //             subject_name: data.subject_name || [],
// // // // // //             old_category: data.old_category || []
// // // // // //         };
// // // // // //     };

// // // // // //     // Load first question
// // // // // //     useEffect(() => {
// // // // // //         const sessionStart = Date.now();
// // // // // //         setStartTime(sessionStart);

// // // // // //         fetch(`${API_URL}/start`)
// // // // // //             .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
// // // // // //             .then(data => {
// // // // // //                 console.log('>>> Initial item received:', data);
// // // // // //                 setItem(parseItem(data));
// // // // // //             })
// // // // // //             .catch(err => {
// // // // // //                 console.error('Error fetching start:', err);
// // // // // //                 alert('Failed to start quiz. Please check API.');
// // // // // //             });
// // // // // //     }, []);

// // // // // //     // Timer
// // // // // //     useEffect(() => {
// // // // // //         if (!startTime) return;
// // // // // //         const timer = setInterval(() => {
// // // // // //             const now = Date.now();
// // // // // //             const elapsed = (now - startTime) / 1000;
// // // // // //             setElapsedTime(elapsed);
// // // // // //             setTimeProgress(Math.min((elapsed / maxExpectedTime) * 100, 100));
// // // // // //         }, 1000);
// // // // // //         return () => clearInterval(timer);
// // // // // //     }, [startTime]);

// // // // // //     // Submit answer
// // // // // //     const submitAnswer = async () => {
// // // // // //         if (!item || !answer) return;
// // // // // //         setLoading(true);
// // // // // //         try {
// // // // // //             const payload = { session_id: item.session_id, item_index: item.item_index, answer, elapsed_time: elapsedTime };
// // // // // //             console.log('>>> Sending /next payload:', payload);

// // // // // //             const res = await fetch(`${API_URL}/next`, {
// // // // // //                 method: 'POST',
// // // // // //                 headers: { 'Content-Type': 'application/json' },
// // // // // //                 body: JSON.stringify(payload)
// // // // // //             });
// // // // // //             if (!res.ok) throw new Error(`HTTP ${res.status}`);
// // // // // //             const data = await res.json();
// // // // // //             console.log('>>> Raw /next response:', data);

// // // // // //             const parsed = parseItem(data);
// // // // // //             if (parsed.finished === true || parsed.finished === 'true') {
// // // // // //                 await fetch(`${API_URL}/session-end`, {
// // // // // //                     method: 'POST',
// // // // // //                     headers: { 'Content-Type': 'application/json' },
// // // // // //                     body: JSON.stringify({ session_id: item.session_id, total_time: elapsedTime })
// // // // // //                 });
// // // // // //                 onFinish({ ...parsed, total_time: elapsedTime, time_per_question: elapsedTime / ((parsed.administered?.length) || 1) });
// // // // // //                 return;
// // // // // //             }
// // // // // //             setItem(parsed);
// // // // // //             setAnswer('');
// // // // // //         } catch (err) {
// // // // // //             console.error('Error in submitAnswer:', err);
// // // // // //             alert('Error submitting answer. Please try again.');
// // // // // //         } finally {
// // // // // //             setLoading(false);
// // // // // //         }
// // // // // //     };

// // // // // //     const formatTime = s => {
// // // // // //         const m = Math.floor(s / 60);
// // // // // //         const sec = Math.floor(s % 60);
// // // // // //         return `${m}:${sec.toString().padStart(2, '0')}`;
// // // // // //     };
// // // // // //     const getTimeBarColor = () => timeProgress < 50 ? '#10B981' : timeProgress < 75 ? '#F59E0B' : '#EF4444';

// // // // // //     if (!item) {
// // // // // //         return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'50vh', fontSize:'18px' }}>Loading question...</div>;
// // // // // //     }

// // // // // //     return (
// // // // // //         <div style={{ padding:20, maxWidth:800, margin:'0 auto' }}>
// // // // // //             {/* Header & Timer */}
// // // // // //             <div style={{ marginBottom:20, padding:15, backgroundColor:'#f5f5f5', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
// // // // // //                 <div>
// // // // // //                     <h2 style={{ margin:0 }}>Test in Progress</h2>
// // // // // //                     <p style={{ margin:'5px 0', color:'#666' }}>Stage: {item.stage} | Category: {item.category}</p>
// // // // // //                 </div>
// // // // // //                 <div style={{ textAlign:'right', minWidth:'200px' }}>
// // // // // //                     <div style={{ fontSize:'14px', color:'#666', marginBottom:'5px' }}>Time: {formatTime(elapsedTime)}</div>
// // // // // //                     <div style={{ width:'200px', height:'12px', backgroundColor:'#E5E7EB', borderRadius:'6px', overflow:'hidden', position:'relative' }}>
// // // // // //                         <div style={{ height:'100%', backgroundColor:getTimeBarColor(), width:`${timeProgress}%`, transition:'all 0.3s ease', borderRadius:'6px' }} />
// // // // // //                         {timeProgress >= 100 && <div style={{ position:'absolute', top:0,left:0,right:0,bottom:0, background:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', animation:'shimmer 2s infinite' }} />}
// // // // // //                     </div>
// // // // // //                     <div style={{ fontSize:'12px', color:'#888', marginTop:'2px' }}>Expected: ~{Math.round(maxExpectedTime/60)} minutes</div>
// // // // // //                 </div>
// // // // // //             </div>

// // // // // //             {/* Question Image */}
// // // // // //             <div style={{ marginBottom:20, textAlign:'center' }}>
// // // // // //                 <img
// // // // // //                     src={`${API_URL}/images/${item.question_id}.jpg`}
// // // // // //                     alt="question"
// // // // // //                     style={{ maxWidth:'100%', maxHeight:400, borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}
// // // // // //                     onError={e => e.target.style.display='none'}
// // // // // //                 />
// // // // // //             </div>

// // // // // //             {/* Choices */}
// // // // // //             <div style={{ marginBottom:20 }}>
// // // // // //                 <h3 style={{ marginBottom:15 }}>Choose your answer:</h3>
// // // // // //                 {item.choices.map(choice => (
// // // // // //                     <div key={choice} style={{ marginBottom:10, padding:12, border:'2px solid', borderColor: answer===choice ? '#4CAF50' : '#ddd', backgroundColor: answer===choice ? '#f1f8e9' : 'white', cursor:'pointer', transition:'all 0.2s' }} onClick={() => setAnswer(choice)}>
// // // // // //                         <label style={{ cursor:'pointer', display:'block' }}>
// // // // // //                             <input type="radio" name="choice" value={choice} checked={answer===choice} onChange={()=>setAnswer(choice)} style={{ marginRight:10 }} />
// // // // // //                             <span style={{ fontSize:'16px', fontWeight:'bold' }}>Option {choice}</span>
// // // // // //                         </label>
// // // // // //                     </div>
// // // // // //                 ))}
// // // // // //             </div>

// // // // // //             {/* Submit Button */}
// // // // // //             <div style={{ textAlign:'center' }}>
// // // // // //                 <button onClick={submitAnswer} disabled={!answer || loading} style={{ padding:'12px 24px', fontSize:'16px', fontWeight:'bold', backgroundColor: answer && !loading ? '#4CAF50' : '#ccc', color:'white', border:'none', borderRadius:8, cursor: answer && !loading ? 'pointer' : 'not-allowed', minWidth:'150px' }}>
// // // // // //                     {loading ? 'Submitting...' : 'Submit Answer'}
// // // // // //                 </button>
// // // // // //             </div>

// // // // // //             {/* ⚙️ Debug Info */}
// // // // // //             <div style={{ marginTop:30, padding:15, backgroundColor:'#FFF3CD', border:'1px solid #FFEEBA', borderRadius:5, fontSize:'14px', lineHeight:1.4 }}>
// // // // // //                 <h4 style={{ margin:'0 0 8px' }}>🛠️ Debug Info</h4>
// // // // // //                 <p><strong>Session:</strong> {item.session_id}</p>
// // // // // //                 <p><strong>Stage:</strong> {item.stage}</p>
// // // // // //                 <p><strong>Question ID:</strong> {item.question_id}</p>
// // // // // //                 <p><strong>Question:</strong> {item.question}</p>
// // // // // //                 <p><strong>Choices:</strong> {item.choices.join(' / ')}</p>
// // // // // //                 <p><strong>Correct Answer:</strong>{' '}{typeof item.correct_answer === 'number' ? item.choices[item.correct_answer - 1] : item.correct_answer}</p>
// // // // // //                 <p><strong>Elapsed:</strong> {formatTime(elapsedTime)}</p>
// // // // // //                 <p><strong>Progress:</strong> {timeProgress.toFixed(1)}%</p>
// // // // // //             </div>

// // // // // //             <style jsx>{`
// // // // // //                 @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
// // // // // //             `}</style>
// // // // // //         </div>
// // // // // //     );
// // // // // // }

// // // // // // frontend/src/components/QuizPage.jsx

// // // // // import React, { useState, useEffect } from 'react';

// // // // // const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// // // // // export function QuizPage({ onFinish }) {
// // // // //     const [item, setItem] = useState(null);
// // // // //     const [answer, setAnswer] = useState('');
// // // // //     const [loading, setLoading] = useState(false);
// // // // //     const [startTime, setStartTime] = useState(null);
// // // // //     const [elapsedTime, setElapsedTime] = useState(0);
// // // // //     const [timeProgress, setTimeProgress] = useState(0);

// // // // //     const expectedTimePerQuestion = 45; // seconds
// // // // //     const maxExpectedTime = 30 * expectedTimePerQuestion;

// // // // //     // Unwrap array-wrapped fields from API
// // // // //     const parseItem = (data) => {
// // // // //         const u = f => Array.isArray(f) ? f[0] : f;
// // // // //         return {
// // // // //             ...Object.fromEntries(Object.entries(data).map(
// // // // //                 ([k,v]) => [k, Array.isArray(v) ? v.length>1 ? v : v[0] : v]
// // // // //             ))
// // // // //         };
// // // // //     };

// // // // //     // Load first question
// // // // //     useEffect(() => {
// // // // //         setStartTime(Date.now());
// // // // //         fetch(`${API_URL}/start`)
// // // // //             .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
// // // // //             .then(data => setItem(parseItem(data)))
// // // // //             .catch(err => { console.error(err); alert('Failed to start quiz'); });
// // // // //     }, []);

// // // // //     // Timer
// // // // //     useEffect(() => {
// // // // //         if (!startTime) return;
// // // // //         const id = setInterval(() => {
// // // // //             const elapsed = (Date.now() - startTime) / 1000;
// // // // //             setElapsedTime(elapsed);
// // // // //             setTimeProgress(Math.min((elapsed / maxExpectedTime) * 100, 100));
// // // // //         }, 1000);
// // // // //         return () => clearInterval(id);
// // // // //     }, [startTime]);

// // // // //     // Submit
// // // // //     const submitAnswer = async () => {
// // // // //         if (!item || !answer) return;
// // // // //         setLoading(true);
// // // // //         try {
// // // // //             const payload = { session_id: item.session_id, item_index: item.item_index, answer, elapsed_time: elapsedTime };
// // // // //             const res = await fetch(`${API_URL}/next`, {
// // // // //                 method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
// // // // //             });
// // // // //             if (!res.ok) throw new Error(res.status);
// // // // //             const data = await res.json();
// // // // //             const parsed = parseItem(data);
// // // // //             if (parsed.finished) {
// // // // //                 await fetch(`${API_URL}/session-end`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ session_id: item.session_id, total_time: elapsedTime }) });
// // // // //                 onFinish({ ...parsed, total_time: elapsedTime, time_per_question: elapsedTime/(parsed.administered?.length||1) });
// // // // //                 return;
// // // // //             }
// // // // //             setItem(parsed);
// // // // //             setAnswer('');
// // // // //         } catch (e) { console.error(e); alert('Error submitting'); }
// // // // //         finally { setLoading(false); }
// // // // //     };

// // // // //     if (!item) return <div>Loading...</div>;

// // // // //     const formatTime = s => `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;

// // // // //     return (
// // // // //         <div style={{ padding:20, maxWidth:800, margin:'0 auto' }}>
// // // // //             <h2>Question {item.item_index}</h2>
// // // // //             {item.question && <p>{item.question}</p>}
// // // // //             <div>
// // // // //                 {item.choices?.map(c => (
// // // // //                     <button key={c} onClick={()=>setAnswer(c)} style={{ margin:4, backgroundColor:answer===c?'#ddd':'#fff' }}>{c}</button>
// // // // //                 ))}
// // // // //             </div>
// // // // //             <button onClick={submitAnswer} disabled={!answer||loading}>{loading?'...':'Submit'}</button>

// // // // //             {/* Raw JSON dump of all item fields */}
// // // // //             <pre style={{ marginTop:20, padding:10, background:'#f5f5f5', maxHeight:300, overflow:'auto' }}>
// // // // //                 {JSON.stringify(item, null, 2)}
// // // // //             </pre>

// // // // //             <div style={{ marginTop:10 }}>
// // // // //                 <small>Elapsed: {formatTime(elapsedTime)} | Progress: {timeProgress.toFixed(1)}%</small>
// // // // //             </div>
// // // // //         </div>
// // // // //     );
// // // // // }

// // // // // frontend/src/components/QuizPage.jsx

// // // // import React, { useState, useEffect } from 'react';

// // // // // Use full URL for API; fallback to localhost proxy
// // // // const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// // // // export function QuizPage({ onFinish }) {
// // // //     const [item, setItem] = useState(null);
// // // //     const [answer, setAnswer] = useState('');
// // // //     const [loading, setLoading] = useState(false);
// // // //     const [startTime, setStartTime] = useState(null);
// // // //     const [elapsedTime, setElapsedTime] = useState(0);
// // // //     const [timeProgress, setTimeProgress] = useState(0);

// // // //     const expectedTimePerQuestion = 45; // seconds
// // // //     const maxExpectedTime = 30 * expectedTimePerQuestion; // 22.5 min

// // // //     // Helper: unwrap array-wrapped fields
// // // //     const parseItem = (data) => {
// // // //         const unwrap = (f) => Array.isArray(f) ? f[0] : f;
// // // //         return {
// // // //             session_id: unwrap(data.session_id),
// // // //             stage: data.stage ? unwrap(data.stage) : undefined,
// // // //             item_index: data.item_index ? unwrap(data.item_index) : undefined,
// // // //             question_id: data.question_id ? unwrap(data.question_id) : undefined,
// // // //             discrimination: data.discrimination || [],
// // // //             difficulty: data.difficulty ? unwrap(data.difficulty) : undefined,
// // // //             category: data.category ? unwrap(data.category) : undefined,
// // // //             choices: data.choices || [],
// // // //             correct_answer: data.correct_answer !== undefined ? unwrap(data.correct_answer) : undefined,
// // // //             finished: data.finished !== undefined ? unwrap(data.finished) : undefined,
// // // //             theta: data.theta || [],
// // // //             subject_name: data.subject_name ? unwrap(data.subject_name) : undefined,
// // // //             old_category: data.old_category || []
// // // //         };
// // // //     };

// // // //     // Load first question
// // // //     useEffect(() => {
// // // //         const sessionStart = Date.now();
// // // //         setStartTime(sessionStart);

// // // //         fetch(`${API_URL}/start`)
// // // //             .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
// // // //             .then(data => {
// // // //                 console.log('>>> Initial item received:', data);
// // // //                 setItem(parseItem(data));
// // // //             })
// // // //             .catch(err => {
// // // //                 console.error('Error fetching start:', err);
// // // //                 alert('Failed to start quiz. Please check API.');
// // // //             });
// // // //     }, []);

// // // //     // Timer
// // // //     useEffect(() => {
// // // //         if (!startTime) return;
// // // //         const timer = setInterval(() => {
// // // //             const now = Date.now();
// // // //             const elapsed = (now - startTime) / 1000;
// // // //             setElapsedTime(elapsed);
// // // //             setTimeProgress(Math.min((elapsed / maxExpectedTime) * 100, 100));
// // // //         }, 1000);
// // // //         return () => clearInterval(timer);
// // // //     }, [startTime]);

// // // //     // Submit answer
// // // //     const submitAnswer = async () => {
// // // //         if (!item || !answer) return;
// // // //         setLoading(true);
// // // //         try {
// // // //             const payload = { session_id: item.session_id, item_index: item.item_index, answer, elapsed_time: elapsedTime };
// // // //             console.log('>>> Sending /next payload:', payload);

// // // //             const res = await fetch(`${API_URL}/next`, {
// // // //                 method: 'POST',
// // // //                 headers: { 'Content-Type': 'application/json' },
// // // //                 body: JSON.stringify(payload)
// // // //             });
// // // //             if (!res.ok) throw new Error(`HTTP ${res.status}`);
// // // //             const data = await res.json();
// // // //             console.log('>>> Raw /next response:', data);

// // // //             const parsed = parseItem(data);
// // // //             if (parsed.finished === true || parsed.finished === 'true') {
// // // //                 await fetch(`${API_URL}/session-end`, {
// // // //                     method: 'POST',
// // // //                     headers: { 'Content-Type': 'application/json' },
// // // //                     body: JSON.stringify({ session_id: item.session_id, total_time: elapsedTime })
// // // //                 });
// // // //                 onFinish({ ...parsed, total_time: elapsedTime, time_per_question: elapsedTime / ((parsed.administered?.length) || 1) });
// // // //                 return;
// // // //             }
// // // //             setItem(parsed);
// // // //             setAnswer('');
// // // //         } catch (err) {
// // // //             console.error('Error in submitAnswer:', err);
// // // //             alert('Error submitting answer. Please try again.');
// // // //         } finally {
// // // //             setLoading(false);
// // // //         }
// // // //     };

// // // //     const formatTime = (s) => {
// // // //         const m = Math.floor(s / 60);
// // // //         const sec = Math.floor(s % 60);
// // // //         return `${m}:${sec.toString().padStart(2, '0')}`;
// // // //     };
// // // //     const getTimeBarColor = () => timeProgress < 50 ? '#10B981' : timeProgress < 75 ? '#F59E0B' : '#EF4444';

// // // //     if (!item) {
// // // //         return (
// // // //             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', fontSize: '18px' }}>
// // // //                 Loading question...
// // // //             </div>
// // // //         );
// // // //     }

// // // //     return (
// // // //         <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
// // // //             {/* Header & Timer */}
// // // //             <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// // // //                 <div>
// // // //                     <h2 style={{ margin: 0 }}>Test in Progress</h2>
// // // //                     <p style={{ margin: '5px 0', color: '#666' }}>Stage: {item.stage} | Category: {item.category}</p>
// // // //                 </div>
// // // //                 <div style={{ textAlign: 'right', minWidth: '200px' }}>
// // // //                     <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Time: {formatTime(elapsedTime)}</div>
// // // //                     <div style={{ width: '200px', height: '12px', backgroundColor: '#E5E7EB', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
// // // //                         <div style={{ height: '100%', backgroundColor: getTimeBarColor(), width: `${timeProgress}%`, transition: 'all 0.3s ease', borderRadius: '6px' }} />
// // // //                         {timeProgress >= 100 && (
// // // //                             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', animation: 'shimmer 2s infinite' }} />
// // // //                         )}
// // // //                     </div>
// // // //                     <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Expected: ~{Math.round(maxExpectedTime / 60)} minutes</div>
// // // //                 </div>
// // // //             </div>

// // // //             {/* Question Image */}
// // // //             <div style={{ marginBottom: 20, textAlign: 'center' }}>
// // // //                 <img
// // // //                     src={`${API_URL}/images/${item.question_id}.jpg`}
// // // //                     alt="question"
// // // //                     style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
// // // //                     onError={e => e.target.style.display = 'none'}
// // // //                 />
// // // //             </div>

// // // //             {/* Choices */}
// // // //             <div style={{ marginBottom: 20 }}>
// // // //                 <h3 style={{ marginBottom: 15 }}>Choose your answer:</h3>
// // // //                 {item.choices.map(choice => (
// // // //                     <div key={choice} style={{ marginBottom: 10, padding: 12, border: '2px solid', borderColor: answer === choice ? '#4CAF50' : '#ddd', backgroundColor: answer === choice ? '#f1f8e9' : 'white', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setAnswer(choice)}>
// // // //                         <label style={{ cursor: 'pointer', display: 'block' }}>
// // // //                             <input type="radio" name="choice" value={choice} checked={answer === choice} onChange={() => setAnswer(choice)} style={{ marginRight: 10 }} />
// // // //                             <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Option {choice}</span>
// // // //                         </label>
// // // //                     </div>
// // // //                 ))}
// // // //             </div>

// // // //             {/* Submit Button */}
// // // //             <div style={{ textAlign: 'center' }}>
// // // //                 <button onClick={submitAnswer} disabled={!answer || loading} style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', backgroundColor: answer && !loading ? '#4CAF50' : '#ccc', color: 'white', border: 'none', borderRadius: 8, cursor: answer && !loading ? 'pointer' : 'not-allowed', minWidth: '150px' }}>
// // // //                     {loading ? 'Submitting...' : 'Submit Answer'}
// // // //                 </button>
// // // //             </div>

// // // //             {/* ⚙️ Debug Info */}
// // // //             <div style={{ marginTop: 30, padding: 15, backgroundColor: '#FFF3CD', border: '1px solid #FFEEBA', borderRadius: 5, fontSize: '14px', lineHeight: 1.4 }}>
// // // //                 <h4 style={{ margin: '0 0 8px' }}>🛠️ Debug Info</h4>
// // // //                 <p><strong>Session:</strong> {item.session_id}</p>
// // // //                 <p><strong>Stage:</strong> {item.stage}</p>
// // // //                 <p><strong>Question ID:</strong> {item.question_id}</p>
// // // //                 <p><strong>Discrimination:</strong> {item.discrimination.join(', ')}</p>
// // // //                 <p><strong>Difficulty:</strong> {item.difficulty}</p>
// // // //                 <p><strong>Category:</strong> {item.category}</p>
// // // //                 <p><strong>Choices:</strong> {item.choices.join(' / ')}</p>
// // // //                 <p><strong>Correct Answer:</strong>{' '}{typeof item.correct_answer === 'number' ? item.choices[item.correct_answer - 1] : item.correct_answer}</p>
// // // //                 <p><strong>Theta:</strong> {item.theta.join(', ')}</p>
// // // //                 <p><strong>Finished:</strong> {String(item.finished)}</p>
// // // //                 <p><strong>Subject:</strong> {item.subject_name}</p>
// // // //                 <p><strong>Old Category:</strong> {item.old_category.join(', ')}</p>
// // // //                 <details>
// // // //                     <summary>Raw Item JSON</summary>
// // // //                     <pre>{JSON.stringify(item, null, 2)}</pre>
// // // //                 </details>
// // // //                 <p><strong>Elapsed:</strong> {formatTime(elapsedTime)}</p>
// // // //                 <p><strong>Progress:</strong> {timeProgress.toFixed(1)}%</p>
// // // //             </div>

// // // //             <style jsx>{`
// // // //                 @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
// // // //             `}</style>
// // // //         </div>
// // // //     );
// // // // }
// // // // frontend/src/components/QuizPage.jsx

// // // import React, { useState, useEffect } from 'react';

// // // // Use full URL for API; fallback to localhost proxy
// // // const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// // // export function QuizPage({ onFinish }) {
// // //     const [item, setItem] = useState(null);
// // //     const [answer, setAnswer] = useState('');
// // //     const [loading, setLoading] = useState(false);
// // //     const [startTime, setStartTime] = useState(null);
// // //     const [elapsedTime, setElapsedTime] = useState(0);
// // //     const [timeProgress, setTimeProgress] = useState(0);

// // //     const expectedTimePerQuestion = 45; // seconds
// // //     const maxExpectedTime = 30 * expectedTimePerQuestion; // 22.5 min

// // //     // Helper: unwrap array-wrapped fields
// // //     const parseItem = (data) => {
// // //         const unwrap = (f) => Array.isArray(f) ? f[0] : f;
// // //         return {
// // //             session_id: unwrap(data.session_id),
// // //             stage: data.stage ? unwrap(data.stage) : undefined,
// // //             item_index: data.item_index ? unwrap(data.item_index) : undefined,
// // //             question_id: data.question_id ? unwrap(data.question_id) : undefined,
// // //             discrimination: data.discrimination || [],
// // //             difficulty: data.difficulty ? unwrap(data.difficulty) : undefined,
// // //             category: data.category ? unwrap(data.category) : undefined,
// // //             choices: data.choices || [],
// // //             correct_answer: data.correct_answer !== undefined ? unwrap(data.correct_answer) : undefined,
// // //             finished: data.finished !== undefined ? unwrap(data.finished) : undefined,
// // //             theta: data.theta || [],
// // //             subject_name: data.subject_name ? unwrap(data.subject_name) : undefined,
// // //             old_category: data.old_category || []
// // //         };
// // //     };

// // //     // Load first question
// // //     useEffect(() => {
// // //         const sessionStart = Date.now();
// // //         setStartTime(sessionStart);

// // //         fetch(`${API_URL}/start`)
// // //             .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
// // //             .then(data => {
// // //                 console.log('>>> Initial item received:', data);
// // //                 setItem(parseItem(data));
// // //             })
// // //             .catch(err => {
// // //                 console.error('Error fetching start:', err);
// // //                 alert('Failed to start quiz. Please check API.');
// // //             });
// // //     }, []);

// // //     // Timer
// // //     useEffect(() => {
// // //         if (!startTime) return;
// // //         const timer = setInterval(() => {
// // //             const now = Date.now();
// // //             const elapsed = (now - startTime) / 1000;
// // //             setElapsedTime(elapsed);
// // //             setTimeProgress(Math.min((elapsed / maxExpectedTime) * 100, 100));
// // //         }, 1000);
// // //         return () => clearInterval(timer);
// // //     }, [startTime]);

// // //     // Submit answer
// // //     const submitAnswer = async () => {
// // //         if (!item || !answer) return;
// // //         setLoading(true);
// // //         try {
// // //             const payload = { session_id: item.session_id, item_index: item.item_index, answer, elapsed_time: elapsedTime };
// // //             console.log('>>> Sending /next payload:', payload);

// // //             const res = await fetch(`${API_URL}/next`, {
// // //                 method: 'POST',
// // //                 headers: { 'Content-Type': 'application/json' },
// // //                 body: JSON.stringify(payload)
// // //             });
// // //             if (!res.ok) throw new Error(`HTTP ${res.status}`);
// // //             const data = await res.json();
// // //             console.log('>>> Raw /next response:', data);

// // //             const parsed = parseItem(data);
// // //             if (parsed.finished === true || parsed.finished === 'true') {
// // //                 await fetch(`${API_URL}/session-end`, {
// // //                     method: 'POST',
// // //                     headers: { 'Content-Type': 'application/json' },
// // //                     body: JSON.stringify({ session_id: item.session_id, total_time: elapsedTime })
// // //                 });
// // //                 onFinish({ ...parsed, total_time: elapsedTime, time_per_question: elapsedTime / ((parsed.administered?.length) || 1) });
// // //                 return;
// // //             }
// // //             setItem(parsed);
// // //             setAnswer('');
// // //         } catch (err) {
// // //             console.error('Error in submitAnswer:', err);
// // //             alert('Error submitting answer. Please try again.');
// // //         } finally {
// // //             setLoading(false);
// // //         }
// // //     };

// // //     const formatTime = (s) => {
// // //         const m = Math.floor(s / 60);
// // //         const sec = Math.floor(s % 60);
// // //         return `${m}:${sec.toString().padStart(2, '0')}`;
// // //     };
// // //     const getTimeBarColor = () => timeProgress < 50 ? '#10B981' : timeProgress < 75 ? '#F59E0B' : '#EF4444';

// // //     if (!item) {
// // //         return (
// // //             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', fontSize: '18px' }}>
// // //                 Loading question...
// // //             </div>
// // //         );
// // //     }

// // //     return (
// // //         <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
// // //             {/* Header & Timer */}
// // //             <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// // //                 <div>
// // //                     <h2 style={{ margin: 0 }}>Test in Progress</h2>
// // //                     <p style={{ margin: '5px 0', color: '#666' }}>Stage: {item.stage} | Category: {item.category}</p>
// // //                 </div>
// // //                 <div style={{ textAlign: 'right', minWidth: '200px' }}>
// // //                     <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Time: {formatTime(elapsedTime)}</div>
// // //                     <div style={{ width: '200px', height: '12px', backgroundColor: '#E5E7EB', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
// // //                         <div style={{ height: '100%', backgroundColor: getTimeBarColor(), width: `${timeProgress}%`, transition: 'all 0.3s ease', borderRadius: '6px' }} />
// // //                         {timeProgress >= 100 && (
// // //                             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', animation: 'shimmer 2s infinite' }} />
// // //                         )}
// // //                     </div>
// // //                     <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
// // //                         Expected: ~{Math.round(maxExpectedTime / 60)} minutes
// // //                     </div>
// // //                 </div>
// // //             </div>

// // //             {/* Question Image */}
// // //             <div style={{ marginBottom: 20, textAlign: 'center' }}>
// // //                 <img
// // //                     src={`${API_URL}/images/${item.question_id}.jpg`}
// // //                     alt="question"
// // //                     style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
// // //                     onError={e => e.target.style.display = 'none'}
// // //                 />
// // //             </div>

// // //             {/* Choices */}
// // //             <div style={{ marginBottom: 20 }}>
// // //                 <h3 style={{ marginBottom: 15 }}>Choose your answer:</h3>
// // //                 {item.choices.map(choice => (
// // //                     <div key={choice} style={{ marginBottom: 10, padding: 12, border: '2px solid', borderColor: answer === choice ? '#4CAF50' : '#ddd', backgroundColor: answer === choice ? '#f1f8e9' : 'white', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setAnswer(choice)}>
// // //                         <label style={{ cursor: 'pointer', display: 'block' }}>
// // //                             <input type="radio" name="choice" value={choice} checked={answer === choice} onChange={() => setAnswer(choice)} style={{ marginRight: 10 }} />
// // //                             <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Option {choice}</span>
// // //                         </label>
// // //                     </div>
// // //                 ))}
// // //             </div>

// // //             {/* Submit Button */}
// // //             <div style={{ textAlign: 'center' }}>
// // //                 <button onClick={submitAnswer} disabled={!answer || loading} style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', backgroundColor: answer && !loading ? '#4CAF50' : '#ccc', color: 'white', border: 'none', borderRadius: 8, cursor: answer && !loading ? 'pointer' : 'not-allowed', minWidth: '150px' }}>
// // //                     {loading ? 'Submitting...' : 'Submit Answer'}
// // //                 </button>
// // //             </div>

// // //             {/* ⚙️ Debug Info Collapsible */}
// // //             <details style={{ marginTop: 30, padding: 15, backgroundColor: '#FFF3CD', border: '1px solid #FFEEBA', borderRadius: 5, fontSize: '14px', lineHeight: 1.4 }}>
// // //                 <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: 10 }}>🛠️ Debug Info (click to expand)</summary>
// // //                 <div style={{ marginTop: 10 }}>
// // //                     <p><strong>Session:</strong> {item.session_id}</p>
// // //                     <p><strong>Stage:</strong> {item.stage}</p>
// // //                     <p><strong>Question ID:</strong> {item.question_id}</p>
// // //                     <p><strong>Discrimination:</strong> {item.discrimination.join(', ')}</p>
// // //                     <p><strong>Difficulty:</strong> {item.difficulty}</p>
// // //                     <p><strong>Category:</strong> {item.category}</p>
// // //                     <p><strong>Choices:</strong> {item.choices.join(' / ')}</p>
// // //                     <p><strong>Correct Answer:</strong>{' '}{typeof item.correct_answer === 'number' ? item.choices[item.correct_answer - 1] : item.correct_answer}</p>
// // //                     <p><strong>Theta:</strong> {item.theta.join(', ')}</p>
// // //                     <p><strong>Finished:</strong> {String(item.finished)}</p>
// // //                     <p><strong>Subject:</strong> {item.subject_name}</p>
// // //                     <p><strong>Old Category:</strong> {item.old_category.join(', ')}</p>
// // //                     <details>
// // //                         <summary>Raw Item JSON</summary>
// // //                         <pre>{JSON.stringify(item, null, 2)}</pre>
// // //                     </details>
// // //                     <p><strong>Elapsed:</strong> {formatTime(elapsedTime)}</p>
// // //                     <p><strong>Progress:</strong> {timeProgress.toFixed(1)}%</p>
// // //                 </div>
// // //             </details>

// // //             <style jsx>{`
// // //                 @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
// // //             `}</style>
// // //         </div>
// // //     );
// // // }
// // // frontend/src/components/QuizPage.jsx

// // import React, { useState, useEffect } from 'react';

// // // Use full URL for API; fallback to localhost proxy
// // const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// // export function QuizPage({ onFinish }) {
// //     const [item, setItem] = useState(null);
// //     const [answer, setAnswer] = useState('');
// //     const [loading, setLoading] = useState(false);
// //     const [startTime, setStartTime] = useState(null);
// //     const [elapsedTime, setElapsedTime] = useState(0);
// //     const [timeProgress, setTimeProgress] = useState(0);

// //     const expectedTimePerQuestion = 45; // seconds
// //     const maxExpectedTime = 30 * expectedTimePerQuestion; // 22.5 min

// //     // Helper: unwrap array-wrapped fields for ongoing items
// //     const parseItem = (data) => {
// //         const unwrap = (f) => Array.isArray(f) ? f[0] : f;
// //         return {
// //             session_id: unwrap(data.session_id),
// //             stage: data.stage ? unwrap(data.stage) : undefined,
// //             item_index: data.item_index ? unwrap(data.item_index) : undefined,
// //             question_id: data.question_id ? unwrap(data.question_id) : undefined,
// //             discrimination: data.discrimination || [],
// //             difficulty: data.difficulty ? unwrap(data.difficulty) : undefined,
// //             category: data.category ? unwrap(data.category) : undefined,
// //             choices: data.choices || [],
// //             correct_answer: data.correct_answer !== undefined ? unwrap(data.correct_answer) : undefined,
// //             finished: data.finished !== undefined ? unwrap(data.finished) : undefined,
// //             theta: data.theta || [],
// //             subject_name: data.subject_name ? unwrap(data.subject_name) : undefined,
// //             old_category: data.old_category || []
// //         };
// //     };

// //     // Load first question
// //     useEffect(() => {
// //         const sessionStart = Date.now();
// //         setStartTime(sessionStart);
// //         fetch(`${API_URL}/start`)
// //             .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
// //             .then(data => {
// //                 console.log('>>> Initial item received:', data);
// //                 setItem(parseItem(data));
// //             })
// //             .catch(err => {
// //                 console.error('Error fetching start:', err);
// //                 alert('Failed to start quiz. Please check API.');
// //             });
// //     }, []);

// //     // Timer
// //     useEffect(() => {
// //         if (!startTime) return;
// //         const timer = setInterval(() => {
// //             const now = Date.now();
// //             const elapsed = (now - startTime) / 1000;
// //             setElapsedTime(elapsed);
// //             setTimeProgress(Math.min((elapsed / maxExpectedTime) * 100, 100));
// //         }, 1000);
// //         return () => clearInterval(timer);
// //     }, [startTime]);

// //     // Submit answer
// //     const submitAnswer = async () => {
// //         if (!item || !answer) return;
// //         setLoading(true);
// //         try {
// //             const payload = { session_id: item.session_id, item_index: item.item_index, answer, elapsed_time: elapsedTime };
// //             console.log('>>> Sending /next payload:', payload);

// //             const res = await fetch(`${API_URL}/next`, {
// //                 method: 'POST',
// //                 headers: { 'Content-Type': 'application/json' },
// //                 body: JSON.stringify(payload)
// //             });
// //             if (!res.ok) throw new Error(`HTTP ${res.status}`);
// //             const data = await res.json();
// //             console.log('>>> Raw /next response:', data);

// //             // If finished, pass full data arrays to onFinish
// //             const finished = Array.isArray(data.finished) ? data.finished[0] : data.finished;
// //             if (finished === true || finished === 'true') {
// //                 // notify session-end
// //                 const sid = Array.isArray(item.session_id) ? item.session_id[0] : item.session_id;
// //                 await fetch(`${API_URL}/session-end`, {
// //                     method: 'POST',
// //                     headers: { 'Content-Type': 'application/json' },
// //                     body: JSON.stringify({ session_id: sid, total_time: elapsedTime })
// //                 });
// //                 // build result object including arrays
// //                 const resultData = {
// //                     ...data,
// //                     total_time: elapsedTime,
// //                     time_per_question: elapsedTime / (data.administered?.length || 1)
// //                 };
// //                 console.log('>>> Quiz finished result:', resultData);
// //                 onFinish(resultData);
// //                 return;
// //             }

// //             // ongoing item: parse and show
// //             const parsed = parseItem(data);
// //             setItem(parsed);
// //             setAnswer('');
// //         } catch (err) {
// //             console.error('Error in submitAnswer:', err);
// //             alert('Error submitting answer. Please try again.');
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const formatTime = (s) => {
// //         const m = Math.floor(s / 60);
// //         const sec = Math.floor(s % 60);
// //         return `${m}:${sec.toString().padStart(2, '0')}`;
// //     };
// //     const getTimeBarColor = () => timeProgress < 50 ? '#10B981' : timeProgress < 75 ? '#F59E0B' : '#EF4444';

// //     if (!item) {
// //         return (
// //             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', fontSize: '18px' }}>
// //                 Loading question...
// //             </div>
// //         );
// //     }

// //     return (
// //         <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
// //             {/* existing JSX unchanged... debug info etc. */}
// //         </div>
// //     );
// // }
// // frontend/src/components/QuizPage.jsx

// import React, { useState, useEffect } from 'react';

// // Use full URL for API; fallback to localhost proxy
// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// export function QuizPage({ onFinish, session }) {
//     const [item, setItem] = useState(null);
//     const [answer, setAnswer] = useState('');
//     const [loading, setLoading] = useState(false);
//     const [startTime, setStartTime] = useState(null);
//     const [elapsedTime, setElapsedTime] = useState(0);
//     const [timeProgress, setTimeProgress] = useState(0);

//     const expectedTimePerQuestion = 45; // seconds
//     const maxExpectedTime = 30 * expectedTimePerQuestion; // 22.5 min

//     // Helper: unwrap array-wrapped fields
//     const parseItem = (data) => {
//         const unwrap = (f) => Array.isArray(f) ? f[0] : f;
//         return {
//             session_id: unwrap(data.session_id),
//             stage: data.stage ? unwrap(data.stage) : undefined,
//             item_index: data.item_index ? unwrap(data.item_index) : undefined,
//             question_id: data.question_id ? unwrap(data.question_id) : undefined,
//             discrimination: data.discrimination || [],
//             difficulty: data.difficulty ? unwrap(data.difficulty) : undefined,
//             category: data.category ? unwrap(data.category) : undefined,
//             choices: data.choices || [],
//             correct_answer: data.correct_answer !== undefined ? unwrap(data.correct_answer) : undefined,
//             finished: data.finished !== undefined ? unwrap(data.finished) : undefined,
//             theta: data.theta || [],
//             subject_name: data.subject_name ? unwrap(data.subject_name) : undefined,
//             old_category: data.old_category || []
//         };
//     };

//     // Initialize first question either from parent session or fetch start
//     useEffect(() => {
//         const sessionStart = Date.now();
//         setStartTime(sessionStart);
//         if (session) {
//             console.log('Using provided session for first item:', session);
//             setItem(parseItem(session));
//         } else {
//             fetch(`${API_URL}/start`)
//                 .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
//                 .then(data => {
//                     console.log('>>> Initial item received:', data);
//                     setItem(parseItem(data));
//                 })
//                 .catch(err => {
//                     console.error('Error fetching start:', err);
//                     alert('Failed to start quiz. Please check API.');
//                 });
//         }
//     }, [session]);

//     // Timer
//     useEffect(() => {
//         if (!startTime) return;
//         const timer = setInterval(() => {
//             const now = Date.now();
//             const elapsed = (now - startTime) / 1000;
//             setElapsedTime(elapsed);
//             setTimeProgress(Math.min((elapsed / maxExpectedTime) * 100, 100));
//         }, 1000);
//         return () => clearInterval(timer);
//     }, [startTime]);

//     // Submit answer
//     const submitAnswer = async () => {
//         if (!item || !answer) return;
//         setLoading(true);
//         try {
//             const payload = { session_id: item.session_id, item_index: item.item_index, answer, elapsed_time: elapsedTime };
//             console.log('>>> Sending /next payload:', payload);

//             const res = await fetch(`${API_URL}/next`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(payload)
//             });
//             if (!res.ok) throw new Error(`HTTP ${res.status}`);
//             const data = await res.json();
//             console.log('>>> Raw /next response:', data);

//             const finished = Array.isArray(data.finished) ? data.finished[0] : data.finished;
//             if (finished === true || finished === 'true') {
//                 // Notify session-end
//                 const sid = item.session_id;
//                 await fetch(`${API_URL}/session-end`, {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ session_id: sid, total_time: elapsedTime })
//                 });
//                 const resultData = {
//                     ...data,
//                     total_time: elapsedTime,
//                     time_per_question: elapsedTime / (data.administered?.length || 1)
//                 };
//                 console.log('>>> Quiz finished result:', resultData);
//                 onFinish(resultData);
//                 return;
//             }

//             // Ongoing question
//             setItem(parseItem(data));
//             setAnswer('');
//         } catch (err) {
//             console.error('Error in submitAnswer:', err);
//             alert('Error submitting answer. Please try again.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const formatTime = (s) => {
//         const m = Math.floor(s / 60);
//         const sec = Math.floor(s % 60);
//         return `${m}:${sec.toString().padStart(2, '0')}`;
//     };
//     const getTimeBarColor = () => timeProgress < 50 ? '#10B981' : timeProgress < 75 ? '#F59E0B' : '#EF4444';

//     if (!item) {
//         return (
//             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', fontSize: '18px' }}>
//                 Loading question...
//             </div>
//         );
//     }

//     return (
//         <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
//             {/* Header & Timer, Question image, choices, submit button, and debug info unchanged */}
//         </div>
//     );
// }
// frontend/src/components/QuizPage.jsx

import React, { useState, useEffect } from 'react';

// Use full URL for API; fallback to localhost proxy
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function QuizPage({ onFinish, session }) {
  const [item, setItem] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeProgress, setTimeProgress] = useState(0);

  const expectedTimePerQuestion = 45; // seconds
  const maxExpectedTime = 30 * expectedTimePerQuestion; // 22.5 min

  // Helper to unwrap array-wrapped API fields
  const parseItem = (data) => {
    const unwrap = (f) => (Array.isArray(f) ? f[0] : f);
    return {
      session_id: unwrap(data.session_id),
      stage: data.stage ? unwrap(data.stage) : undefined,
      item_index: data.item_index ? unwrap(data.item_index) : undefined,
      question_id: data.question_id ? unwrap(data.question_id) : undefined,
      discrimination: data.discrimination || [],
      difficulty: data.difficulty ? unwrap(data.difficulty) : undefined,
      category: data.category ? unwrap(data.category) : undefined,
      choices: data.choices || [],
      correct_answer: data.correct_answer !== undefined ? unwrap(data.correct_answer) : undefined,
      finished: data.finished !== undefined ? unwrap(data.finished) : undefined,
      theta: data.theta || [],
      subject_name: data.subject_name ? unwrap(data.subject_name) : undefined,
      old_category: data.old_category || [],
    };
  };

  // Load first question either from session prop or from API
  useEffect(() => {
    setStartTime(Date.now());
    if (session) {
      console.log('Using provided session for first item:', session);
      setItem(parseItem(session));
    } else {
      fetch(`${API_URL}/start`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          console.log('>>> Initial item received:', data);
          setItem(parseItem(data));
        })
        .catch((err) => {
          console.error('Error fetching start:', err);
          alert('Failed to start quiz. Please check API.');
        });
    }
  }, [session]);

  // Timer logic
  useEffect(() => {
    if (!startTime) return;
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      setElapsedTime(elapsed);
      setTimeProgress(Math.min((elapsed / maxExpectedTime) * 100, 100));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const submitAnswer = async () => {
    if (!item || !answer) return;
    setLoading(true);
    try {
      const payload = {
        session_id: item.session_id,
        item_index: item.item_index,
        answer,
        elapsed_time: elapsedTime,
      };
      console.log('>>> Sending /next payload:', payload);

      const res = await fetch(`${API_URL}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('>>> Raw /next response:', data);

      const finished = Array.isArray(data.finished) ? data.finished[0] : data.finished;
      if (finished === true || finished === 'true') {
        // end session
        await fetch(`${API_URL}/session-end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: item.session_id, total_time: elapsedTime }),
        });
        const resultData = {
          ...data,
          total_time: elapsedTime,
          time_per_question: elapsedTime / (data.administered?.length || 1),
        };
        console.log('>>> Quiz finished result:', resultData);
        onFinish(resultData);
        return;
      }

      // next question
      setItem(parseItem(data));
      setAnswer('');
    } catch (err) {
      console.error('Error in submitAnswer:', err);
      alert('Error submitting answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };
  const getTimeBarColor = () => (timeProgress < 50 ? '#10B981' : timeProgress < 75 ? '#F59E0B' : '#EF4444');

  if (!item) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          fontSize: '18px',
        }}
      >
        Loading question...
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      {/* Header & Timer */}
      <div
        style={{
          marginBottom: 20,
          padding: 15,
          backgroundColor: '#f5f5f5',
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
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
          <div
            style={{
              width: '200px',
              height: '12px',
              backgroundColor: '#E5E7EB',
              borderRadius: '6px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: getTimeBarColor(),
                width: `${timeProgress}%`,
                transition: 'all 0.3s ease',
                borderRadius: '6px',
              }}
            />
            {timeProgress >= 100 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                  animation: 'shimmer 2s infinite',
                }}
              />
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
            Expected: ~{Math.round(maxExpectedTime / 60)} minutes
          </div>
        </div>
      </div>

      {/* Question Image */}
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <img
          src={`${API_URL}/images/${item.question_id}.jpg`}
          alt="question"
          style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          onError={(e) => (e.target.style.display = 'none')}
        />
      </div>

      {/* Choices & Submit */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 15 }}>Choose your answer:</h3>
        {item.choices.map((choice) => (
          <div
            key={choice}
            style={{
              marginBottom: 10,
              padding: 12,
              border: '2px solid',
              borderColor: answer === choice ? '#4CAF50' : '#ddd',
              backgroundColor: answer === choice ? '#f1f8e9' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => setAnswer(choice)}
          >
            <label style={{ cursor: 'pointer', display: 'block' }}>
              <input
                type="radio"
                name="choice"
                value={choice}
                checked={answer === choice}
                onChange={() => setAnswer(choice)}
                style={{ marginRight: 10 }}
              />
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Option {choice}</span>
            </label>
          </div>
        ))}
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
              minWidth: '150px',
            }}
          >
            {loading ? 'Submitting...' : 'Submit Answer'}
          </button>
        </div>
      </div>

      {/* Debug Panel */}
      <details style={{ marginTop: 30, padding: 15, backgroundColor: '#FFF3CD', border: '1px solid #FFEEBA', borderRadius: 5, fontSize: '14px', lineHeight: 1.4 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: 10 }}>🛠️ Debug Info (click to expand)</summary>
        <div style={{ marginTop: 10 }}>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(item, null, 2)}</pre>
          <p><strong>Elapsed:</strong> {formatTime(elapsedTime)}</p>
          <p><strong>Progress:</strong> {timeProgress.toFixed(1)}%</p>
        </div>
      </details>

      <style jsx>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}
