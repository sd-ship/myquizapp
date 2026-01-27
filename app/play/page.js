"use client";
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { Zap, Loader2, Trophy, RefreshCcw, User, Hash, Play, CheckCircle2, XCircle, Timer } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const SECONDS_PER_QUESTION = 30; // Set your desired time here

const PlayQuiz = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [quizData, setQuizData] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    
    // --- New State for Step-by-Step Logic ---
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);

    const [joinData, setJoinData] = useState({
        participantName: '',
        quizId: ''
    });

    // --- Timer Logic ---
    useEffect(() => {
        if (!quizData || isSubmitted) return;

        if (timeLeft === 0) {
            handleNextQuestion();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, quizData, isSubmitted]);

    const handleNextQuestion = () => {
        const isLastQuestion = currentQuestionIdx === quizData.questions.length - 1;
        
        if (isLastQuestion) {
            handleSubmitExam();
        } else {
            setCurrentQuestionIdx(prev => prev + 1);
            setTimeLeft(SECONDS_PER_QUESTION);
        }
    };

    // --- Core Logic Functions ---

    const handleJoinQuiz = async () => {
        if (!joinData.participantName || !joinData.quizId) {
            toast.error("Please enter both Name and Quiz ID");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Play/${joinData.quizId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': '69420',
                },
            });

            if (!response.ok) throw new Error(`Quiz not Started Yet`);

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server returned an invalid format (HTML). Check your API endpoint.");
            }

            const data = await response.json();
            if (!data.questions || data.questions.length === 0) {
                throw new Error("This quiz has no questions.");
            }

            setQuizData(data);
            setTimeLeft(SECONDS_PER_QUESTION); // Start timer
            toast.success(`Joined: ${data.quiz.quizTitle}`);
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectOption = (questionIdx, optionText) => {
        if (isSubmitted) return;
        setUserAnswers(prev => ({ ...prev, [questionIdx]: optionText }));
    };

    const handleSubmitExam = async () => {
        const questions = quizData.questions;

        let currentScore = 0;
        questions.forEach((q, idx) => {
            const correctKey = q.correctOpt; 
            const correctTextValue = q[correctKey]; 
            if (userAnswers[idx] === correctTextValue) {
                currentScore++;
            }
        });

        const finalSubmission = {
            quizId: parseInt(joinData.quizId),
            participantName: joinData.participantName,
            score: currentScore.toString(),
            outOf: questions.length.toString()
        };

        setIsLoading(true);
        try {
            const response = await fetch('https://noneditorial-professionally-serena.ngrok-free.dev/Play/Submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': '69420',
                },
                body: JSON.stringify(finalSubmission)
            });

            if (response.ok) {
                setScore(currentScore);
                setIsSubmitted(true);
                toast.success("Result recorded on server!");
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const errorText = await response.text();
                throw new Error(errorText || `Submission failed with status ${response.status}`);
            }
        } catch (error) {
            console.error("Submission Error:", error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            <Toaster position="top-center" />
            
            {!quizData ? (
                <GlassCard>
                    <Header>
                        <div className="icon-badge"><Play size={24} /></div>
                        <div>
                            <h2>Join Quiz Session</h2>
                            <p>Enter your details to retrieve the quiz.</p>
                        </div>
                    </Header>

                    <FormGrid>
                        <InputGroup>
                            <label><User size={14} /> Full Name</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Ketan Bidave" 
                                value={joinData.participantName}
                                onChange={(e) => setJoinData({...joinData, participantName: e.target.value})}
                            />
                        </InputGroup>

                        <InputGroup>
                            <label><Hash size={14} /> Quiz ID</label>
                            <input 
                                type="number" 
                                placeholder="Enter Numeric ID" 
                                value={joinData.quizId}
                                onChange={(e) => setJoinData({...joinData, quizId: e.target.value})}
                            />
                        </InputGroup>

                        <PrimaryButton onClick={handleJoinQuiz} disabled={isLoading}>
                            {isLoading ? <Loader2 className="spinner" /> : "Verify & Access Quiz"}
                        </PrimaryButton>
                    </FormGrid>
                </GlassCard>
            ) : (
                <ResultContainer>
                    <ResultHeader>
                        <div className="title-area">
                            <div className={isSubmitted ? "score-badge" : "success-badge"}>
                                {isSubmitted ? <Trophy size={16} /> : <Timer size={16} />}
                                {isSubmitted 
                                    ? `Final Score: ${score} / ${quizData.questions.length}` 
                                    : `Time Remaining: ${timeLeft}s`}
                            </div>
                            <h2>{isSubmitted ? "Performance Summary" : joinData.participantName}</h2>
                        </div>
                        {isSubmitted && (
                            <button className="reset-btn" onClick={() => window.location.reload()}>
                                <RefreshCcw size={16} /> New Quiz
                            </button>
                        )}
                    </ResultHeader>
                    
                    {!isSubmitted && (
                        <TimerBarContainer>
                            <TimerBarFill progress={(timeLeft / SECONDS_PER_QUESTION) * 100} />
                        </TimerBarContainer>
                    )}

                    <QuestionGrid>
                        {quizData.questions.map((q, idx) => {
                            // Only show current question if not submitted, or show all if submitted
                            if (!isSubmitted && idx !== currentQuestionIdx) return null;

                            return (
                                <QuestionCard key={idx} style={{ animationDelay: `0.1s` }}>
                                    <div className="q-num">Question {idx + 1} of {quizData.questions.length}</div>
                                    <h3>{q.question}</h3>
                                    <div className="options-list">
                                        {["opt1", "opt2", "opt3", "opt4"].map((optKey) => {
                                            const optValue = q[optKey];
                                            const isSelected = userAnswers[idx] === optValue;
                                            const isCorrect = optValue === q[q.correctOpt];
                                            
                                            let statusClass = "";
                                            if (isSubmitted) {
                                                if (isCorrect) statusClass = "correct";
                                                else if (isSelected && !isCorrect) statusClass = "wrong";
                                            } else if (isSelected) {
                                                statusClass = "selected";
                                            }

                                            return (
                                                <div 
                                                    key={optKey} 
                                                    className={`opt ${statusClass}`}
                                                    onClick={() => handleSelectOption(idx, optValue)}
                                                >
                                                    <div className="checkbox">
                                                        {isSelected && <div className="inner-dot" />}
                                                    </div>
                                                    <span className="opt-text">{optValue}</span>
                                                    {isSubmitted && isCorrect && <CheckCircle2 size={18} className="status-icon" />}
                                                    {isSubmitted && isSelected && !isCorrect && <XCircle size={18} className="status-icon" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </QuestionCard>
                            );
                        })}
                    </QuestionGrid>

                    {!isSubmitted && (
                        <StickyFooter>
                            <SubmitButton onClick={handleNextQuestion} disabled={isLoading}>
                                {currentQuestionIdx === quizData.questions.length - 1 ? "Submit Final Exam" : "Next Question"}
                            </SubmitButton>
                        </StickyFooter>
                    )}
                </ResultContainer>
            )}
        </PageContainer>
    );
};

// --- New Timer Components ---
const TimerBarContainer = styled.div`
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    margin-bottom: 20px;
    overflow: hidden;
`;

const TimerBarFill = styled.div`
    height: 100%;
    width: ${props => props.progress}%;
    background: linear-gradient(90deg, #4f46e5, #7c3aed);
    transition: width 1s linear;
`;

// --- Existing Styled Components ---
const spin = keyframes` from { transform: rotate(0deg); } to { transform: rotate(360deg); } `;
const springUp = keyframes` from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } `;

const PageContainer = styled.div`
    min-height: 100vh; 
    padding: 40px 15px; 
    display: flex; 
    justify-content: center;
    color: #e2e2e2; 
    font-family: 'Inter', sans-serif; 
    background: transparent; 
    position: relative; 
    overflow-x: hidden;
    
    @media (max-width: 768px) {
        padding: 20px 12px;
    }
`;

const GlassCard = styled.div`
    width: 100%; 
    max-width: 440px; 
    background: rgba(255, 255, 255, 0.03); 
    backdrop-filter: blur(40px) saturate(150%);
    -webkit-backdrop-filter: blur(40px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.1); 
    border-radius: 32px; 
    padding: 30px; 
    z-index: 1;
    animation: ${springUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1); 
    height: fit-content;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

    @media (max-width: 480px) {
        padding: 24px;
        border-radius: 24px;
    }
`;

const Header = styled.div`
    display: flex; 
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 15px; 
    margin-bottom: 35px;
    
    .icon-badge { 
        width: 60px; height: 60px; 
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); 
        border-radius: 20px; 
        display: flex; align-items: center; justify-content: center; 
        color: white; 
        box-shadow: 0 8px 30px rgba(79, 70, 229, 0.4); 
    }
    h2 { margin: 0; font-size: 1.6rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
    p { margin: 0; color: #a1a1aa; font-size: 0.95rem; }
`;

const FormGrid = styled.div` display: flex; flex-direction: column; gap: 20px; `;

const InputGroup = styled.div`
    display: flex; flex-direction: column; gap: 8px;
    label { color: #a1a1aa; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 8px; }
    input { 
        background: rgba(0, 0, 0, 0.2); 
        border: 1px solid rgba(255, 255, 255, 0.1); 
        border-radius: 14px; 
        padding: 16px; 
        color: #fff; 
        font-size: 1rem; 
        transition: all 0.2s;
        &:focus { outline: none; border-color: #4f46e5; background: rgba(0,0,0,0.4); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
    }
`;

const PrimaryButton = styled.button`
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); 
    color: white; 
    border: none; 
    padding: 18px; 
    border-radius: 16px; 
    font-weight: 700; 
    font-size: 1rem;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px; 
    transition: all 0.3s ease;
    &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(79, 70, 229, 0.4); filter: brightness(1.1); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinner { animation: ${spin} 1s linear infinite; }
`;

const ResultContainer = styled.div` width: 100%; max-width: 700px; z-index: 1; padding-bottom: 140px; `;

const ResultHeader = styled.div`
    display: flex; 
    flex-direction: column;
    gap: 15px;
    margin-bottom: 40px;
    
    .title-area {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .success-badge, .score-badge { 
        align-self: flex-start;
        backdrop-filter: blur(10px);
        padding: 8px 16px; 
        border-radius: 100px; 
        font-size: 0.8rem; 
        font-weight: 700; 
        display: flex; align-items: center; gap: 8px; 
    }
    
    .success-badge { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
    .score-badge { background: rgba(234, 179, 8, 0.15); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.3); }
    
    h2 { margin: 0; font-size: 2rem; font-weight: 800; color: #fff; }
    
    .reset-btn { 
        align-self: flex-start;
        background: rgba(255,255,255,0.05); 
        border: 1px solid rgba(255,255,255,0.1); 
        backdrop-filter: blur(10px);
        color: #fff; padding: 10px 20px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; transition: 0.2s; 
        &:hover { background: rgba(255,255,255,0.1); }
    }

    @media (max-width: 480px) {
        h2 { font-size: 1.5rem; }
    }
`;

const QuestionGrid = styled.div` display: flex; flex-direction: column; gap: 20px; `;

const QuestionCard = styled.div`
    background: rgba(255, 255, 255, 0.02); 
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.08); 
    padding: 25px; 
    border-radius: 24px;
    animation: ${springUp} 0.5s ease-out forwards;

    .q-num { color: #818cf8; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; opacity: 0.8; }
    h3 { font-size: 1.2rem; font-weight: 600; margin-bottom: 25px; color: #fff; line-height: 1.5; }
    .options-list { display: flex; flex-direction: column; gap: 10px; }
    
    .opt { 
        padding: 15px 18px; border-radius: 16px; 
        background: rgba(0, 0, 0, 0.2); 
        border: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 0.95rem; color: #d1d1d6; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: all 0.2s ease;
        
        &:hover:not(.correct):not(.wrong) { border-color: rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.05); transform: scale(1.01); }
        &.selected { border-color: #4f46e5; background: rgba(79, 70, 229, 0.1); color: #fff; }
        &.correct { border-color: #22c55e; background: rgba(34, 197, 94, 0.15); color: #4ade80; font-weight: 600; }
        &.wrong { border-color: #ef4444; background: rgba(239, 68, 68, 0.15); color: #f87171; }
        
        .checkbox { width: 20px; height: 20px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        &.selected .checkbox { border-color: #4f46e5; }
        &.correct .checkbox { border-color: #22c55e; background: #22c55e; }
        .inner-dot { width: 10px; height: 10px; border-radius: 50%; background: #4f46e5; }
        .status-icon { margin-left: auto; }
    }

    @media (max-width: 480px) {
        padding: 20px;
        h3 { font-size: 1.1rem; }
        .opt { font-size: 0.9rem; }
    }
`;

const StickyFooter = styled.div`
    position: fixed; bottom: 0; left: 0; width: 100%; padding: 25px 15px;
    background: linear-gradient(to top, rgba(0,0,0,0.9) 60%, transparent);
    backdrop-filter: blur(10px);
    display: flex; justify-content: center; z-index: 10;
`;

const SubmitButton = styled(PrimaryButton)` 
    width: 100%;
    max-width: 400px;
    padding: 16px; 
    border-radius: 100px; 
    font-size: 1.1rem; 
    box-shadow: 0 15px 40px -10px rgba(79, 70, 229, 0.6); 
`;

export default PlayQuiz;