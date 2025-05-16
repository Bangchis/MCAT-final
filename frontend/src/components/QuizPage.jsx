// // // // import React, { useState, useEffect } from 'react';

// // // // // Use full URL for API; fallback to localhost proxy
// // // // // const API_URL = process.env.REACT_APP_API_URL || 'http://backend:5000';
// // // // // src/components/QuizPage.jsx (hoặc nơi bạn định nghĩa API_URL)
// // // // const API_URL = process.env.NODE_ENV === 'production'
// // // //   ? ''                         // production: dùng đường dẫn relative
// // // //   : process.env.REACT_APP_API_URL; // dev: vẫn có thể cắm localhost

// // // // export function QuizPage({ onFinish, session }) {
// // // //   const [item, setItem] = useState(null);
// // // //   const [answer, setAnswer] = useState('');
// // // //   const [loading, setLoading] = useState(false);
// // // //   const [startTime, setStartTime] = useState(null);
// // // //   const [elapsedTime, setElapsedTime] = useState(0);
// // // //   const [timeProgress, setTimeProgress] = useState(0);

// // // //   const expectedTimePerQuestion = 45; // seconds
// // // //   const maxExpectedTime = 30 * expectedTimePerQuestion; // 22.5 min

// // // //   // Helper to unwrap array-wrapped API fields
// // // //   const parseItem = (data) => {
// // // //     const unwrap = (f) => (Array.isArray(f) ? f[0] : f);
// // // //     return {
// // // //       session_id: unwrap(data.session_id),
// // // //       stage: data.stage ? unwrap(data.stage) : undefined,
// // // //       item_index: data.item_index ? unwrap(data.item_index) : undefined,
// // // //       question_id: data.question_id ? unwrap(data.question_id) : undefined,
// // // //       discrimination: data.discrimination || [],
// // // //       difficulty: data.difficulty ? unwrap(data.difficulty) : undefined,
// // // //       category: data.category ? unwrap(data.category) : undefined,
// // // //       choices: data.choices || [],
// // // //       correct_answer: data.correct_answer !== undefined ? unwrap(data.correct_answer) : undefined,
// // // //       finished: data.finished !== undefined ? unwrap(data.finished) : undefined,
// // // //       theta: data.theta || [],
// // // //       subject_name: data.subject_name ? unwrap(data.subject_name) : undefined,
// // // //       old_category: data.old_category || [],
// // // //     };
// // // //   };

// // // //   // Load first question either from session prop or from API
// // // //   useEffect(() => {
// // // //     setStartTime(Date.now());
// // // //     if (session) {
// // // //       console.log('Using provided session for first item:', session);
// // // //       setItem(parseItem(session));
// // // //     } else {
// // // //       fetch(`${API_URL}/start`)
// // // //         .then((res) => {
// // // //           if (!res.ok) throw new Error(`HTTP ${res.status}`);
// // // //           return res.json();
// // // //         })
// // // //         .then((data) => {
// // // //           console.log('>>> Initial item received:', data);
// // // //           setItem(parseItem(data));
// // // //         })
// // // //         .catch((err) => {
// // // //           console.error('Error fetching start:', err);
// // // //           alert('Failed to start quiz. Please check API.');
// // // //         });
// // // //     }
// // // //   }, [session]);

// // // //   // Timer logic
// // // //   useEffect(() => {
// // // //     if (!startTime) return;
// // // //     const timer = setInterval(() => {
// // // //       const now = Date.now();
// // // //       const elapsed = (now - startTime) / 1000;
// // // //       setElapsedTime(elapsed);
// // // //       setTimeProgress(Math.min((elapsed / maxExpectedTime) * 100, 100));
// // // //     }, 1000);
// // // //     return () => clearInterval(timer);
// // // //   }, [startTime]);

// // // //   const submitAnswer = async () => {
// // // //     if (!item || !answer) return;
// // // //     setLoading(true);
// // // //     try {
// // // //       const payload = {
// // // //         session_id: item.session_id,
// // // //         item_index: item.item_index,
// // // //         answer,
// // // //         elapsed_time: elapsedTime,
// // // //       };
// // // //       console.log('>>> Sending /next payload:', payload);

// // // //       const res = await fetch(`${API_URL}/next`, {
// // // //         method: 'POST',
// // // //         headers: { 'Content-Type': 'application/json' },
// // // //         body: JSON.stringify(payload),
// // // //       });
// // // //       if (!res.ok) throw new Error(`HTTP ${res.status}`);
// // // //       const data = await res.json();
// // // //       console.log('>>> Raw /next response:', data);

// // // //       const finished = Array.isArray(data.finished) ? data.finished[0] : data.finished;
// // // //       if (finished === true || finished === 'true') {
// // // //         // end session
// // // //         await fetch(`${API_URL}/session-end`, {
// // // //           method: 'POST',
// // // //           headers: { 'Content-Type': 'application/json' },
// // // //           body: JSON.stringify({ session_id: item.session_id, total_time: elapsedTime }),
// // // //         });
// // // //         const resultData = {
// // // //           ...data,
// // // //           total_time: elapsedTime,
// // // //           time_per_question: elapsedTime / (data.administered?.length || 1),
// // // //         };
// // // //         console.log('>>> Quiz finished result:', resultData);
// // // //         onFinish(resultData);
// // // //         return;
// // // //       }

// // // //       // next question
// // // //       setItem(parseItem(data));
// // // //       setAnswer('');
// // // //     } catch (err) {
// // // //       console.error('Error in submitAnswer:', err);
// // // //       alert('Error submitting answer. Please try again.');
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   const formatTime = (s) => {
// // // //     const m = Math.floor(s / 60);
// // // //     const sec = Math.floor(s % 60);
// // // //     return `${m}:${sec.toString().padStart(2, '0')}`;
// // // //   };
// // // //   const getTimeBarColor = () => (timeProgress < 50 ? '#10B981' : timeProgress < 75 ? '#F59E0B' : '#EF4444');

// // // //   if (!item) {
// // // //     return (
// // // //       <div
// // // //         style={{
// // // //           display: 'flex',
// // // //           justifyContent: 'center',
// // // //           alignItems: 'center',
// // // //           height: '50vh',
// // // //           fontSize: '18px',
// // // //         }}
// // // //       >
// // // //         Loading question...
// // // //       </div>
// // // //     );
// // // //   }

// // // //   return (
// // // //     <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
// // // //       {/* Header & Timer */}
// // // //       <div
// // // //         style={{
// // // //           marginBottom: 20,
// // // //           padding: 15,
// // // //           backgroundColor: '#f5f5f5',
// // // //           borderRadius: 8,
// // // //           display: 'flex',
// // // //           justifyContent: 'space-between',
// // // //           alignItems: 'center',
// // // //         }}
// // // //       >
// // // //         <div>
// // // //           <h2 style={{ margin: 0 }}>Test in Progress</h2>
// // // //           <p style={{ margin: '5px 0', color: '#666' }}>
// // // //             Stage: {item.stage} | Category: {item.category}
// // // //           </p>
// // // //         </div>
// // // //         <div style={{ textAlign: 'right', minWidth: '200px' }}>
// // // //           <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
// // // //             Time: {formatTime(elapsedTime)}
// // // //           </div>
// // // //           <div
// // // //             style={{
// // // //               width: '200px',
// // // //               height: '12px',
// // // //               backgroundColor: '#E5E7EB',
// // // //               borderRadius: '6px',
// // // //               overflow: 'hidden',
// // // //               position: 'relative',
// // // //             }}
// // // //           >
// // // //             <div
// // // //               style={{
// // // //                 height: '100%',
// // // //                 backgroundColor: getTimeBarColor(),
// // // //                 width: `${timeProgress}%`,
// // // //                 transition: 'all 0.3s ease',
// // // //                 borderRadius: '6px',
// // // //               }}
// // // //             />
// // // //             {timeProgress >= 100 && (
// // // //               <div
// // // //                 style={{
// // // //                   position: 'absolute',
// // // //                   top: 0,
// // // //                   left: 0,
// // // //                   right: 0,
// // // //                   bottom: 0,
// // // //                   background:
// // // //                     'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
// // // //                   animation: 'shimmer 2s infinite',
// // // //                 }}
// // // //               />
// // // //             )}
// // // //           </div>
// // // //           <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
// // // //             Expected: ~{Math.round(maxExpectedTime / 60)} minutes
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       {/* Question Image */}
// // // //       <div style={{ marginBottom: 20, textAlign: 'center' }}>
// // // //         <img
// // // //           src={`${API_URL}/images/${item.question_id}.jpg`}
// // // //           alt="question"
// // // //           style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
// // // //           onError={(e) => (e.target.style.display = 'none')}
// // // //         />
// // // //       </div>

// // // //       {/* Choices & Submit */}
// // // //       <div style={{ marginBottom: 20 }}>
// // // //         <h3 style={{ marginBottom: 15 }}>Choose your answer:</h3>
// // // //         {item.choices.map((choice) => (
// // // //           <div
// // // //             key={choice}
// // // //             style={{
// // // //               marginBottom: 10,
// // // //               padding: 12,
// // // //               border: '2px solid',
// // // //               borderColor: answer === choice ? '#4CAF50' : '#ddd',
// // // //               backgroundColor: answer === choice ? '#f1f8e9' : 'white',
// // // //               cursor: 'pointer',
// // // //               transition: 'all 0.2s',
// // // //             }}
// // // //             onClick={() => setAnswer(choice)}
// // // //           >
// // // //             <label style={{ cursor: 'pointer', display: 'block' }}>
// // // //               <input
// // // //                 type="radio"
// // // //                 name="choice"
// // // //                 value={choice}
// // // //                 checked={answer === choice}
// // // //                 onChange={() => setAnswer(choice)}
// // // //                 style={{ marginRight: 10 }}
// // // //               />
// // // //               <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Option {choice}</span>
// // // //             </label>
// // // //           </div>
// // // //         ))}
// // // //         <div style={{ textAlign: 'center' }}>
// // // //           <button
// // // //             onClick={submitAnswer}
// // // //             disabled={!answer || loading}
// // // //             style={{
// // // //               padding: '12px 24px',
// // // //               fontSize: '16px',
// // // //               fontWeight: 'bold',
// // // //               backgroundColor: answer && !loading ? '#4CAF50' : '#ccc',
// // // //               color: 'white',
// // // //               border: 'none',
// // // //               borderRadius: 8,
// // // //               cursor: answer && !loading ? 'pointer' : 'not-allowed',
// // // //               minWidth: '150px',
// // // //             }}
// // // //           >
// // // //             {loading ? 'Submitting...' : 'Submit Answer'}
// // // //           </button>
// // // //         </div>
// // // //       </div>

// // // //       {/* Debug Panel */}
// // // //       <details style={{ marginTop: 30, padding: 15, backgroundColor: '#FFF3CD', border: '1px solid #FFEEBA', borderRadius: 5, fontSize: '14px', lineHeight: 1.4 }}>
// // // //         <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: 10 }}>🛠️ Debug Info (click to expand)</summary>
// // // //         <div style={{ marginTop: 10 }}>
// // // //           <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(item, null, 2)}</pre>
// // // //           <p><strong>Elapsed:</strong> {formatTime(elapsedTime)}</p>
// // // //           <p><strong>Progress:</strong> {timeProgress.toFixed(1)}%</p>
// // // //         </div>
// // // //       </details>

// // // //       <style jsx>{`
// // // //         @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
// // // //       `}</style>
// // // //     </div>
// // // //   );
// // // // }

// // // import React, { useState, useEffect } from 'react';

// // // // Use full URL for API; fallback to localhost proxy
// // // const API_URL = process.env.NODE_ENV === 'production'
// // //   ? ''                         // production: dùng đường dẫn relative
// // //   : process.env.REACT_APP_API_URL; // dev: vẫn có thể cắm localhost

// // // export function QuizPage({ onFinish, session }) {
// // //   const [item, setItem] = useState(null);
// // //   const [answer, setAnswer] = useState('');
// // //   const [loading, setLoading] = useState(false);
// // //   const [startTime, setStartTime] = useState(null);
// // //   const [elapsedTime, setElapsedTime] = useState(0);
// // //   const [timeProgress, setTimeProgress] = useState(0);

// // //   // NEW: state để điều phối khi quiz kết thúc
// // //   const [finished, setFinished] = useState(false);
// // //   const [isEnding, setIsEnding] = useState(false);
// // //   const [finalData, setFinalData] = useState(null);

// // //   const expectedTimePerQuestion = 45; // seconds
// // //   const maxExpectedTime = 30 * expectedTimePerQuestion; // 22.5 min

// // //   // Helper to unwrap array-wrapped API fields
// // //   const parseItem = (data) => {
// // //     const unwrap = (f) => (Array.isArray(f) ? f[0] : f);
// // //     return {
// // //       session_id: unwrap(data.session_id),
// // //       stage: data.stage ? unwrap(data.stage) : undefined,
// // //       item_index: data.item_index ? unwrap(data.item_index) : undefined,
// // //       question_id: data.question_id ? unwrap(data.question_id) : undefined,
// // //       discrimination: data.discrimination || [],
// // //       difficulty: data.difficulty ? unwrap(data.difficulty) : undefined,
// // //       category: data.category ? unwrap(data.category) : undefined,
// // //       choices: data.choices || [],
// // //       correct_answer: data.correct_answer !== undefined ? unwrap(data.correct_answer) : undefined,
// // //       finished: data.finished !== undefined ? unwrap(data.finished) : undefined,
// // //       theta: data.theta || [],
// // //       subject_name: data.subject_name ? unwrap(data.subject_name) : undefined,
// // //       old_category: data.old_category || [],
// // //       // giữ lại tất cả trường debug, v.v.
// // //     };
// // //   };

// // //   // Load first question
// // //   useEffect(() => {
// // //     setStartTime(Date.now());
// // //     if (session) {
// // //       console.log('Using provided session for first item:', session);
// // //       setItem(parseItem(session));
// // //     } else {
// // //       fetch(`${API_URL}/start`)
// // //         .then((res) => {
// // //           if (!res.ok) throw new Error(`HTTP ${res.status}`);
// // //           return res.json();
// // //         })
// // //         .then((data) => {
// // //           if(data.error) {
// // //             alert(data.error);
// // //             return;
// // //           }
// // //           console.log('>>> Initial item received:', data);
// // //           setItem(parseItem(data));
// // //         })
// // //         .catch((err) => {
// // //           console.error('Error fetching start:', err);
// // //           alert('Failed to start quiz. Please check API.');
// // //         });
// // //     }
// // //   }, [session]);

// // //   // Timer logic
// // //   useEffect(() => {
// // //     if (!startTime) return;
// // //     const timer = setInterval(() => {
// // //       const now = Date.now();
// // //       const elapsed = (now - startTime) / 1000;
// // //       setElapsedTime(elapsed);
// // //       setTimeProgress(Math.min((elapsed / maxExpectedTime) * 100, 100));
// // //     }, 1000);
// // //     return () => clearInterval(timer);
// // //   }, [startTime]);

// // //   // NEW: khi finished chuyển true thì gọi /session-end 1 lần
// // //   useEffect(() => {
// // //     if (finished && !isEnding && finalData) {
// // //       setIsEnding(true);
// // //       const payload = {
// // //         session_id: finalData.session_id,
// // //         total_time: elapsedTime,
// // //       };
// // //       fetch(`${API_URL}/session-end`, {
// // //         method: 'POST',
// // //         headers: { 'Content-Type': 'application/json' },
// // //         body: JSON.stringify(payload),
// // //       })
// // //         .then((res) => {
// // //           if (!res.ok) throw new Error(`HTTP ${res.status}`);
// // //           return res.json();
// // //         })
// // //         .then(() => {
// // //           onFinish(finalData);
// // //         })
// // //         .catch((err) => {
// // //           console.error('Error ending session:', err);
// // //           // Dù error, vẫn gọi onFinish để kết thúc UI
// // //           onFinish(finalData);
// // //         });
// // //     }
// // //   }, [finished, isEnding, finalData, elapsedTime, onFinish]);

// // //   const submitAnswer = async () => {
// // //     if (!item || !answer || loading) return;
// // //     setLoading(true);
// // //     try {
// // //       const payload = {
// // //         session_id: item.session_id,
// // //         item_index: item.item_index,
// // //         answer,
// // //         elapsed_time: elapsedTime,
// // //       };
// // //       console.log('>>> Sending /next payload:', payload);

// // //       const res = await fetch(`${API_URL}/next`, {
// // //         method: 'POST',
// // //         headers: { 'Content-Type': 'application/json' },
// // //         body: JSON.stringify(payload),
// // //       });
// // //       if (!res.ok) throw new Error(`HTTP ${res.status}`);
// // //       const data = await res.json();
// // //       console.log('>>> Raw /next response:', data);
// // //       // Nếu backend trả JSON { error: … }
// // //       if (data.error) {
// // //         alert(data.error);
// // //         return;
// // //       }

// // //       // unwrap finished
// // //       const fin = Array.isArray(data.finished) ? data.finished[0] : data.finished;
// // //       if (fin === true || fin === 'true') {
// // //         // quiz đã xong, lưu lại finalData để useEffect gọi /session-end
// // //         setFinalData({
// // //           ...data,
// // //           total_time: elapsedTime,
// // //           time_per_question: elapsedTime / (data.administered?.length || 1),
// // //           session_id: item.session_id,
// // //         });
// // //         setFinished(true);
// // //       } else {
// // //         // next question
// // //         setItem(parseItem(data));
// // //         setAnswer('');
// // //       }
// // //     } catch (err) {
// // //       console.error('Error in submitAnswer:', err);
// // //       alert('Error submitting answer. Please try again.');
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   // time formatting + bar
// // //   const formatTime = (s) => {
// // //     const m = Math.floor(s / 60);
// // //     const sec = Math.floor(s % 60);
// // //     return `${m}:${sec.toString().padStart(2, '0')}`;
// // //   };
// // //   const getTimeBarColor = () =>
// // //     timeProgress < 50 ? '#10B981' : timeProgress < 75 ? '#F59E0B' : '#EF4444';

// // //   if (!item) {
// // //     return (
// // //       <div style={{
// // //         display: 'flex',
// // //         justifyContent: 'center',
// // //         alignItems: 'center',
// // //         height: '50vh',
// // //         fontSize: '18px',
// // //       }}>
// // //         Loading question...
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
// // //       {/* Header & Timer */}
// // //       <div style={{
// // //         marginBottom: 20,
// // //         padding: 15,
// // //         backgroundColor: '#f5f5f5',
// // //         borderRadius: 8,
// // //         display: 'flex',
// // //         justifyContent: 'space-between',
// // //         alignItems: 'center',
// // //       }}>
// // //         <div>
// // //           <h2 style={{ margin: 0 }}>Test in Progress</h2>
// // //           <p style={{ margin: '5px 0', color: '#666' }}>
// // //             Stage: {item.stage} | Category: {item.category}
// // //           </p>
// // //         </div>
// // //         <div style={{ textAlign: 'right', minWidth: '200px' }}>
// // //           <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
// // //             Time: {formatTime(elapsedTime)}
// // //           </div>
// // //           <div style={{
// // //             width: '200px',
// // //             height: '12px',
// // //             backgroundColor: '#E5E7EB',
// // //             borderRadius: '6px',
// // //             overflow: 'hidden',
// // //             position: 'relative',
// // //           }}>
// // //             <div style={{
// // //               height: '100%',
// // //               backgroundColor: getTimeBarColor(),
// // //               width: `${timeProgress}%`,
// // //               transition: 'all 0.3s ease',
// // //               borderRadius: '6px',
// // //             }}/>
// // //             {timeProgress >= 100 && (
// // //               <div style={{
// // //                 position: 'absolute',
// // //                 top: 0, left: 0, right: 0, bottom: 0,
// // //                 background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
// // //                 animation: 'shimmer 2s infinite',
// // //               }}/>
// // //             )}
// // //           </div>
// // //           <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
// // //             Expected: ~{Math.round(maxExpectedTime / 60)} minutes
// // //           </div>
// // //         </div>
// // //       </div>

// // //       {/* Question Image */}
// // //       <div style={{ marginBottom: 20, textAlign: 'center' }}>
// // //         {console.log('🐞 Loading quiz image:', {
// // //           item_index: item.item_index,
// // //           question_id: item.question_id,
// // //           url: `${API_URL}/images/${item.question_id}.jpg`
// // //         })}
// // //         <img
// // //           src={`${API_URL}/images/${item.question_id}.jpg`}

// // //           alt="question"
// // //           style={{
// // //             maxWidth: '100%', maxHeight: 400,
// // //             borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
// // //           }}
// // //           onError={(e) => (e.target.style.display = 'none')}
// // //         />
// // //       </div>

// // //       {/* Choices & Submit */}
// // //       <div style={{ marginBottom: 20 }}>
// // //         <h3 style={{ marginBottom: 15 }}>Choose your answer:</h3>
// // //         {item.choices.map((choice) => (
// // //           <div
// // //             key={choice}
// // //             style={{
// // //               marginBottom: 10,
// // //               padding: 12,
// // //               border: '2px solid',
// // //               borderColor: answer === choice ? '#4CAF50' : '#ddd',
// // //               backgroundColor: answer === choice ? '#f1f8e9' : 'white',
// // //               cursor: 'pointer',
// // //               transition: 'all 0.2s',
// // //             }}
// // //             onClick={() => setAnswer(choice)}
// // //           >
// // //             <label style={{ cursor: 'pointer', display: 'block' }}>
// // //               <input
// // //                 type="radio"
// // //                 name="choice"
// // //                 value={choice}
// // //                 checked={answer === choice}
// // //                 onChange={() => setAnswer(choice)}
// // //                 style={{ marginRight: 10 }}
// // //               />
// // //               <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
// // //                 Option {choice}
// // //               </span>
// // //             </label>
// // //           </div>
// // //         ))}
// // //         <div style={{ textAlign: 'center' }}>  
// // //           <button
// // //             onClick={submitAnswer}
// // //             disabled={!answer || loading}
// // //             style={{
// // //               padding: '12px 24px',
// // //               fontSize: '16px',
// // //               fontWeight: 'bold',
// // //               backgroundColor: answer && !loading ? '#4CAF50' : '#ccc',
// // //               color: 'white',
// // //               border: 'none',
// // //               borderRadius: 8,
// // //               cursor: answer && !loading ? 'pointer' : 'not-allowed',
// // //               minWidth: '150px',
// // //             }}
// // //           >
// // //             {loading ? 'Submitting...' : 'Submit Answer'}
// // //           </button>
// // //         </div>
// // //       </div>

// // //       {/* Debug Panel */}
// // //       <details style={{
// // //         marginTop: 30,
// // //         padding: 15,
// // //         backgroundColor: '#FFF3CD',
// // //         border: '1px solid #FFEEBA',
// // //         borderRadius: 5,
// // //         fontSize: '14px',
// // //         lineHeight: 1.4
// // //       }}>
// // //         <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: 10 }}>
// // //           🛠️ Debug Info (click to expand)
// // //         </summary>
// // //         <div style={{ marginTop: 10 }}>
// // //           <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
// // //             {JSON.stringify(item, null, 2)}
// // //           </pre>
// // //           <p><strong>Elapsed:</strong> {formatTime(elapsedTime)}</p>
// // //           <p><strong>Progress:</strong> {timeProgress.toFixed(1)}%</p>
// // //         </div>
// // //       </details>

// // //       <style jsx>{`
// // //         @keyframes shimmer { 
// // //           0% { transform: translateX(-100%); } 
// // //           100% { transform: translateX(100%); } 
// // //         }
// // //       `}</style>
// // //     </div>
// // //   );
// // // }
// // import React, { useState, useEffect } from 'react';

// // // Use full URL for API; fallback to localhost proxy
// // const API_URL = process.env.NODE_ENV === 'production'
// //   ? ''                         // production: dùng đường dẫn relative
// //   : process.env.REACT_APP_API_URL; // dev: vẫn có thể cắm localhost

// // export function QuizPage({ onFinish, session }) {
// //   const [item, setItem] = useState(null);
// //   const [answer, setAnswer] = useState('');
// //   const [loading, setLoading] = useState(false);
// //   const [startTime, setStartTime] = useState(null);
// //   const [elapsedTime, setElapsedTime] = useState(0);
// //   const [timeProgress, setTimeProgress] = useState(0);
// //   const [finished, setFinished] = useState(false);
// //   const [isEnding, setIsEnding] = useState(false);
// //   const [finalData, setFinalData] = useState(null);
// //   const [questionHistory, setQuestionHistory] = useState([]);

// //   const expectedTimePerQuestion = 45; // seconds
// //   const maxExpectedTime = 30 * expectedTimePerQuestion; // 22.5 min

// //   // Helper to unwrap array-wrapped API fields
// //   const parseItem = (data) => {
// //     const unwrap = (f) => (Array.isArray(f) ? f[0] : f);
// //     return {
// //       session_id: unwrap(data.session_id),
// //       stage: data.stage ? unwrap(data.stage) : undefined,
// //       item_index: data.item_index ? unwrap(data.item_index) : undefined,
// //       question_id: data.question_id ? unwrap(data.question_id) : undefined,
// //       discrimination: data.discrimination || [],
// //       difficulty: data.difficulty ? unwrap(data.difficulty) : undefined,
// //       category: data.category ? unwrap(data.category) : undefined,
// //       choices: data.choices || [],
// //       correct_answer: data.correct_answer !== undefined ? unwrap(data.correct_answer) : undefined,
// //       finished: data.finished !== undefined ? unwrap(data.finished) : undefined,
// //       theta: data.theta || [],
// //       subject_name: data.subject_name ? unwrap(data.subject_name) : undefined,
// //       old_category: data.old_category || []
// //     };
// //   };

// //   // Load first question
// //   useEffect(() => {
// //     setStartTime(Date.now());
// //     if (session) {
// //       const init = parseItem(session);
// //       setItem(init);
// //       setQuestionHistory([init.question_id]);
// //     } else {
// //       fetch(`${API_URL}/start`)
// //         .then((res) => {
// //           if (!res.ok) throw new Error(`HTTP ${res.status}`);
// //           return res.json();
// //         })
// //         .then((data) => {
// //           if (data.error) {
// //             alert(data.error);
// //             return;
// //           }
// //           const init = parseItem(data);
// //           setItem(init);
// //           setQuestionHistory([init.question_id]);
// //         })
// //         .catch((err) => {
// //           console.error('Error fetching start:', err);
// //           alert('Failed to start quiz.');
// //         });
// //     }
// //   }, [session]);

// //   // Timer logic
// //   useEffect(() => {
// //     if (!startTime) return;
// //     const timer = setInterval(() => {
// //       const now = Date.now();
// //       const elapsed = (now - startTime) / 1000;
// //       setElapsedTime(elapsed);
// //       setTimeProgress(Math.min((elapsed / maxExpectedTime) * 100, 100));
// //     }, 1000);
// //     return () => clearInterval(timer);
// //   }, [startTime]);

// //   // Track each question_id
// //   useEffect(() => {
// //     if (item && !finished) {
// //       setQuestionHistory((prev) => [...prev, item.question_id]);
// //     }
// //   }, [item, finished]);

// //   // Handle quiz finish
// //   useEffect(() => {
// //     if (finished && !isEnding && finalData) {
// //       setIsEnding(true);
// //       const payload = {
// //         session_id: finalData.session_id,
// //         total_time: elapsedTime
// //       };
// //       fetch(`${API_URL}/session-end`, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(payload)
// //       })
// //         .then((res) => {
// //           if (!res.ok) throw new Error(`HTTP ${res.status}`);
// //           return res.json();
// //         })
// //         .then(() => onFinish(finalData))
// //         .catch((err) => {
// //           console.error('Error ending session:', err);
// //           onFinish(finalData);
// //         });
// //     }
// //   }, [finished, isEnding, finalData, elapsedTime, onFinish]);

// //   // Submit answer and fetch next
// //   const submitAnswer = async () => {
// //     if (!item || !answer || loading) return;
// //     setLoading(true);
// //     try {
// //       const payload = {
// //         session_id: item.session_id,
// //         item_index: item.item_index,
// //         answer,
// //         elapsed_time: elapsedTime
// //       };
// //       const res = await fetch(`${API_URL}/next`, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(payload)
// //       });
// //       if (!res.ok) throw new Error(`HTTP ${res.status}`);
// //       const data = await res.json();
// //       if (data.error) {
// //         alert(data.error);
// //         return;
// //       }
// //       const fin = Array.isArray(data.finished) ? data.finished[0] : data.finished;
// //       if (fin) {
// //         setFinalData({
// //           ...data,
// //           administered: questionHistory,
// //           total_time: elapsedTime,
// //           time_per_question: elapsedTime / questionHistory.length,
// //           session_id: item.session_id
// //         });
// //         setFinished(true);
// //       } else {
// //         const next = parseItem(data);
// //         setItem(next);
// //         setAnswer('');
// //       }
// //     } catch (err) {
// //       console.error('Error in submitAnswer:', err);
// //       alert('Error submitting answer.');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Format and color helpers
// //   const formatTime = (s) => {
// //     const m = Math.floor(s / 60);
// //     const sec = Math.floor(s % 60);
// //     return `${m}:${sec.toString().padStart(2, '0')}`;
// //   };
// //   const getTimeBarColor = () =>
// //     timeProgress < 50 ? '#10B981' : timeProgress < 75 ? '#F59E0B' : '#EF4444';

// //   if (!item) {
// //     return (
// //       <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', fontSize: '18px' }}>
// //         Loading question...
// //       </div>
// //     );
// //   }

// //   return (
// //     <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
// //       {/* Header & Timer */}
// //       <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //         <div>
// //           <h2 style={{ margin: 0 }}>Test in Progress</h2>
// //           <p style={{ margin: '5px 0', color: '#666' }}>
// //             Stage: {item.stage} | Category: {item.category}
// //           </p>
// //         </div>
// //         <div style={{ textAlign: 'right', minWidth: '200px' }}>
// //           <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
// //             Time: {formatTime(elapsedTime)}
// //           </div>
// //           <div style={{ width: '200px', height: '12px', backgroundColor: '#E5E7EB', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
// //             <div style={{ height: '100%', backgroundColor: getTimeBarColor(), width: `${timeProgress}%`, transition: 'all 0.3s ease', borderRadius: '6px' }} />
// //             {timeProgress >= 100 && (
// //               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', animation: 'shimmer 2s infinite' }} />
// //             )}
// //           </div>
// //           <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
// //             Expected: ~{Math.round(maxExpectedTime / 60)} minutes
// //           </div>
// //         </div>
// //       </div>

// //       {/* Question Image */}
// //       <div style={{ marginBottom: 20, textAlign: 'center' }}>
// //         {console.log('🐞 Loading quiz image:', { item_index: item.item_index, question_id: item.question_id, url: `${API_URL}/images/${item.question_id}.jpg` })}
// //         <img
// //           src={`${API_URL}/images/${item.question_id}.jpg`}
// //           alt={`Question ${item.question_id}`}
// //           style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
// //           onError={(e) => (e.target.style.display = 'none')}
// //         />
// //       </div>

// //       {/* Choices & Submit */}
// //       <div style={{ marginBottom: 20 }}>
// //         <h3 style={{ marginBottom: 15 }}>Choose your answer:</h3>
// //         {item.choices.map((choice) => (
// //           <div
// //             key={choice}
// //             style={{ marginBottom: 10, padding: 12, border: '2px solid', borderColor: answer === choice ? '#4CAF50' : '#ddd', backgroundColor: answer === choice ? '#f1f8e9' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}
// //             onClick={() => setAnswer(choice)}
// //           >
// //             <label style={{ cursor: 'pointer', display: 'block' }}>
// //               <input
// //                 type="radio"
// //                 name="choice"
// //                 value={choice}
// //                 checked={answer === choice}
// //                 onChange={() => setAnswer(choice)}
// //                 style={{ marginRight: 10 }}
// //               />
// //               <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Option {choice}</span>
// //             </label>
// //           </div>
// //         ))}
// //         <div style={{ textAlign: 'center' }}>
// //           <button
// //             onClick={submitAnswer}
// //             disabled={!answer || loading}
// //             style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', backgroundColor: answer && !loading ? '#4CAF50' : '#ccc', color: 'white', border: 'none', borderRadius: 8, cursor: answer && !loading ? 'pointer' : 'not-allowed', minWidth: '150px' }}
// //           >
// //             {loading ? 'Submitting...' : 'Submit Answer'}
// //           </button>
// //         </div>
// //       </div>

// //       {/* Debug Panel */}
// //       <details style={{ marginTop: 30, padding: 15, backgroundColor: '#FFF3CD', border: '1px solid #FFEEBA', borderRadius: 5, fontSize: '14px', lineHeight: 1.4 }}>
// //         <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: 10 }}>🛠️ Debug Info (click to expand)</summary>
// //         <div style={{ marginTop: 10 }}>
// //           <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(item, null, 2)}</pre>
// //           <p><strong>Elapsed:</strong> {formatTime(elapsedTime)}</p>
// //           <p><strong>Progress:</strong> {timeProgress.toFixed(1)}%</p>
// //           <p><strong>History:</strong> {JSON.stringify(questionHistory)}</p>
// //         </div>
// //       </details>

// //       <style jsx>{`
// //         @keyframes shimmer { 
// //           0% { transform: translateX(-100%); } 
// //           100% { transform: translateX(100%); }
// //         }
// //       `}</style>
// //     </div>
// //   );
// // }
// import React, { useState, useEffect } from 'react';

// // Use full URL for API; fallback to localhost proxy
// const API_URL = process.env.NODE_ENV === 'production'
//   ? ''
//   : process.env.REACT_APP_API_URL;

// export function QuizPage({ onFinish, session }) {
//   const [item, setItem] = useState(null);
//   const [answer, setAnswer] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [startTime, setStartTime] = useState(null);
//   const [elapsedTime, setElapsedTime] = useState(0);
//   const [timeProgress, setTimeProgress] = useState(0);
//   const [finished, setFinished] = useState(false);
//   const [isEnding, setIsEnding] = useState(false);
//   const [finalData, setFinalData] = useState(null);
//   const [questionHistory, setQuestionHistory] = useState([]);

//   const expectedTimePerQuestion = 45;
//   const maxExpectedTime = 30 * expectedTimePerQuestion;

//   const parseItem = (data) => {
//     const unwrap = (f) => (Array.isArray(f) ? f[0] : f);
//     return {
//       session_id: unwrap(data.session_id),
//       stage: data.stage ? unwrap(data.stage) : undefined,
//       item_index: data.item_index ? unwrap(data.item_index) : undefined,
//       question_id: data.question_id ? unwrap(data.question_id) : undefined,
//       discrimination: data.discrimination || [],
//       difficulty: data.difficulty ? unwrap(data.difficulty) : undefined,
//       category: data.category ? unwrap(data.category) : undefined,
//       choices: data.choices || [],
//       correct_answer: data.correct_answer !== undefined ? unwrap(data.correct_answer) : undefined,
//       finished: data.finished !== undefined ? unwrap(data.finished) : undefined,
//       theta: data.theta || [],
//       subject_name: data.subject_name ? unwrap(data.subject_name) : undefined,
//       old_category: data.old_category || []
//     };
//   };

//   useEffect(() => {
//     setStartTime(Date.now());
//     if (session) {
//       const init = parseItem(session);
//       setItem(init);
//       setQuestionHistory([init.question_id]);
//     } else {
//       fetch(`${API_URL}/start`)
//         .then((res) => {
//           if (!res.ok) throw new Error(`HTTP ${res.status}`);
//           return res.json();
//         })
//         .then((data) => {
//           if (data.error) {
//             alert(data.error);
//             return;
//           }
//           const init = parseItem(data);
//           setItem(init);
//           setQuestionHistory([init.question_id]);
//         })
//         .catch((err) => {
//           console.error('Error fetching start:', err);
//           alert('Failed to start quiz.');
//         });
//     }
//   }, [session]);

//   useEffect(() => {
//     if (!startTime) return;
//     const timer = setInterval(() => {
//       const now = Date.now();
//       const elapsed = (now - startTime) / 1000;
//       setElapsedTime(elapsed);
//       setTimeProgress(Math.min((elapsed / maxExpectedTime) * 100, 100));
//     }, 1000);
//     return () => clearInterval(timer);
//   }, [startTime]);

//   useEffect(() => {
//     if (item && !finished) {
//       setQuestionHistory((prev) => [...prev, item.question_id]);
//     }
//   }, [item, finished]);

//   useEffect(() => {
//     if (finished && !isEnding && finalData) {
//       setIsEnding(true);
//       const payload = {
//         session_id: finalData.session_id,
//         total_time: elapsedTime
//       };
//       fetch(`${API_URL}/session-end`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       })
//         .then((res) => {
//           if (!res.ok) throw new Error(`HTTP ${res.status}`);
//           return res.json();
//         })
//         .then(() => onFinish(finalData))
//         .catch((err) => {
//           console.error('Error ending session:', err);
//           onFinish(finalData);
//         });
//     }
//   }, [finished, isEnding, finalData, elapsedTime, onFinish]);

//   const submitAnswer = async () => {
//     if (!item || !answer || loading) return;
//     setLoading(true);
//     try {
//       const payload = {
//         session_id: item.session_id,
//         item_index: item.item_index,
//         answer,
//         elapsed_time: elapsedTime
//       };
//       const res = await fetch(`${API_URL}/next`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       const data = await res.json();
//       if (data.error) {
//         alert(data.error);
//         return;
//       }
//       const fin = Array.isArray(data.finished) ? data.finished[0] : data.finished;
//       if (fin) {
//         // Only keep the last 30 question IDs
//         const last30 = questionHistory.slice(-30);
//         setFinalData({
//           ...data,
//           administered: last30,
//           total_time: elapsedTime,
//           time_per_question: elapsedTime / last30.length,
//           session_id: item.session_id
//         });
//         setFinished(true);
//       } else {
//         const next = parseItem(data);
//         setItem(next);
//         setAnswer('');
//       }
//     } catch (err) {
//       console.error('Error in submitAnswer:', err);
//       alert('Error submitting answer.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatTime = (s) => {
//     const m = Math.floor(s / 60);
//     const sec = Math.floor(s % 60);
//     return `${m}:${sec.toString().padStart(2, '0')}`;
//   };
//   const getTimeBarColor = () =>
//     timeProgress < 50 ? '#10B981' : timeProgress < 75 ? '#F59E0B' : '#EF4444';

//   if (!item) {
//     return (
//       <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', fontSize: '18px' }}>
//         Loading question...
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
//       {/* Header & Timer */}
//       <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <div>
//           <h2 style={{ margin: 0 }}>Test in Progress</h2>
//           <p style={{ margin: '5px 0', color: '#666' }}>
//             Stage: {item.stage} | Category: {item.category}
//           </p>
//         </div>
//         <div style={{ textAlign: 'right', minWidth: '200px' }}>
//           <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
//             Time: {formatTime(elapsedTime)}
//           </div>
//           <div style={{ width: '200px', height: '12px', backgroundColor: '#E5E7EB', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
//             <div style={{ height: '100%', backgroundColor: getTimeBarColor(), width: `${timeProgress}%`, transition: 'all 0.3s ease', borderRadius: '6px' }} />
//             {timeProgress >= 100 && (
//               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', animation: 'shimmer 2s infinite' }} />
//             )}
//           </div>
//           <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
//             Expected: ~{Math.round(maxExpectedTime / 60)} minutes
//           </div>
//         </div>
//       </div>

//       {/* Question Image */}
//       <div style={{ marginBottom: 20, textAlign: 'center' }}>
//         {console.log('🐞 Loading quiz image:', { item_index: item.item_index, question_id: item.question_id, url: `${API_URL}/images/${item.question_id}.jpg` })}
//         <img
//           src={`${API_URL}/images/${item.question_id}.jpg`}
//           alt={`Question ${item.question_id}`}
//           style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
//           onError={(e) => (e.target.style.display = 'none')} />
//       </div>

//       {/* Choices & Submit */}
//       <div style={{ marginBottom: 20 }}>
//         <h3 style={{ marginBottom: 15 }}>Choose your answer:</h3>
//         {item.choices.map((choice) => (
//           <div key={choice} style={{ marginBottom: 10, padding: 12, border: '2px solid', borderColor: answer === choice ? '#4CAF50' : '#ddd', backgroundColor: answer === choice ? '#f1f8e9' : 'white', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setAnswer(choice)}>
//             <label style={{ cursor: 'pointer', display: 'block' }}>
//               <input type="radio" name="choice" value={choice} checked={answer === choice} onChange={() => setAnswer(choice)} style={{ marginRight: 10 }} />
//               <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Option {choice}</span>
//             </label>
//           </div>
//         ))}
//         <div style={{ textAlign: 'center' }}>
//           <button onClick={submitAnswer} disabled={!answer || loading} style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', backgroundColor: answer && !loading ? '#4CAF50' : '#ccc', color: 'white', border: 'none', borderRadius: 8, cursor: answer && !loading ? 'pointer' : 'not-allowed', minWidth: '150px' }}>
//             {loading ? 'Submitting...' : 'Submit Answer'}
//           </button>
//         </div>
//       </div>

//       {/* Debug Panel */}
//       <details style={{ marginTop: 30, padding: 15, backgroundColor: '#FFF3CD', border: '1px solid #FFEEBA', borderRadius: 5, fontSize: '14px', lineHeight: 1.4 }}>
//         <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: 10 }}>🛠️ Debug Info (click to expand)</summary>
//         <div style={{ marginTop: 10 }}>
//           <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(item, null, 2)}</pre>
//           <p><strong>Elapsed:</strong> {formatTime(elapsedTime)}</p>
//           <p><strong>Progress:</strong> {timeProgress.toFixed(2)}%</p>
//           <p><strong>History:</strong> {JSON.stringify(questionHistory.slice(-30))}</p>
//         </div>
//       </details>

//       <style jsx>{`@keyframes shimmer { 0% { transform: translateX(-100%);}100% { transform: translateX(100%);} }`}</style>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';

// Use full URL for API; fallback to localhost proxy
const API_URL = process.env.NODE_ENV === 'production'
  ? ''
  : process.env.REACT_APP_API_URL;

export function QuizPage({ onFinish, session }) {
  const [item, setItem] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeProgress, setTimeProgress] = useState(0);
  const [finished, setFinished] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [finalData, setFinalData] = useState(null);
  const [questionHistory, setQuestionHistory] = useState([]);

  const expectedTimePerQuestion = 45;
  const maxExpectedTime = 30 * expectedTimePerQuestion;

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
      old_category: data.old_category || []
    };
  };

  useEffect(() => {
    setStartTime(Date.now());
    if (session) {
      const init = parseItem(session);
      setItem(init);
      setQuestionHistory([init.question_id]);
    } else {
      fetch(`${API_URL}/start`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data.error) {
            alert(data.error);
            return;
          }
          const init = parseItem(data);
          setItem(init);
          setQuestionHistory([init.question_id]);
        })
        .catch((err) => {
          console.error('Error fetching start:', err);
          alert('Failed to start quiz.');
        });
    }
  }, [session]);

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

  useEffect(() => {
    if (item && !finished) {
      setQuestionHistory((prev) => [...prev, item.question_id]);
    }
  }, [item, finished]);

  useEffect(() => {
    if (finished && !isEnding && finalData) {
      setIsEnding(true);
      const payload = {
        session_id: finalData.session_id,
        total_time: elapsedTime
      };
      fetch(`${API_URL}/session-end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(() => onFinish(finalData))
        .catch((err) => {
          console.error('Error ending session:', err);
          onFinish(finalData);
        });
    }
  }, [finished, isEnding, finalData, elapsedTime, onFinish]);

  const submitAnswer = async () => {
    if (!item || !answer || loading) return;
    setLoading(true);
    try {
      const payload = {
        session_id: item.session_id,
        item_index: item.item_index,
        answer,
        elapsed_time: elapsedTime
      };
      const res = await fetch(`${API_URL}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      const fin = Array.isArray(data.finished) ? data.finished[0] : data.finished;
      if (fin) {
        const last30 = questionHistory.slice(-30);
        setFinalData({
          ...data,
          administered: last30,
          total_time: elapsedTime,
          time_per_question: elapsedTime / last30.length,
          session_id: item.session_id
        });
        setFinished(true);
      } else {
        const next = parseItem(data);
        setItem(next);
        setAnswer('');
      }
    } catch (err) {
      console.error('Error in submitAnswer:', err);
      alert('Error submitting answer.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };
  const getTimeBarColor = () =>
    timeProgress < 50 ? '#10B981' : timeProgress < 75 ? '#F59E0B' : '#EF4444';

  if (!item) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', fontSize: '18px' }}>
        Loading question...
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      {/* Header & Timer */}
      <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <div style={{ width: '200px', height: '12px', backgroundColor: '#E5E7EB', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ height: '100%', backgroundColor: getTimeBarColor(), width: `${timeProgress}%`, transition: 'all 0.3s ease', borderRadius: '6px' }} />
            {timeProgress >= 100 && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', animation: 'shimmer 2s infinite' }} />
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
            Expected: ~{Math.round(maxExpectedTime / 60)} minutes
          </div>
        </div>
      </div>

      {/* Question Image */}
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        {console.log('🐞 Loading quiz image:', { item_index: item.item_index, question_id: item.question_id, url: `${API_URL}/images/${item.question_id}.jpg` })}
        <img
          src={`${API_URL}/images/${item.question_id}.jpg`}
          alt={`Question ${item.question_id}`}
          style={{ width: '533px', height: '400px', objectFit: 'contain', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          onError={(e) => (e.target.style.display = 'none')}
        />
      </div>
  {/* */}

      {/* Choices & Submit */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 15 }}>Choose your answer:</h3>
        {item.choices.map((choice) => (
          <div key={choice} style={{ marginBottom: 10, padding: 12, border: '2px solid', borderColor: answer === choice ? '#4CAF50' : '#ddd', backgroundColor: answer === choice ? '#f1f8e9' : 'white', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setAnswer(choice)}>
            <label style={{ cursor: 'pointer', display: 'block' }}>
              <input type="radio" name="choice" value={choice} checked={answer === choice} onChange={() => setAnswer(choice)} style={{ marginRight: 10 }} />
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Option {choice}</span>
            </label>
          </div>
        ))}
        <div style={{ textAlign: 'center' }}>
          <button onClick={submitAnswer} disabled={!answer || loading} style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', backgroundColor: answer && !loading ? '#4CAF50' : '#ccc', color: 'white', border: 'none', borderRadius: 8, cursor: answer && !loading ? 'pointer' : 'not-allowed', minWidth: '150px' }}>
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
          <p><strong>Progress:</strong> {timeProgress.toFixed(2)}%</p>
          <p><strong>History:</strong> {JSON.stringify(questionHistory.slice(-30))}</p>
        </div>
      </details>

      <style jsx>{`@keyframes shimmer { 0% { transform: translateX(-100%);}100% { transform: translateX(100%);} }`}</style>
    </div>
  );
}
