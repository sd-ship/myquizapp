"use client";
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Sparkles, Zap, Globe, Cpu, Loader2, Trophy, RefreshCcw, Timer, ChevronRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const SECONDS_PER_QUESTION = 30; // Global timer setting

const AIGenerator = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [quizData, setQuizData] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    // --- New State for Step-by-Step Logic ---
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);

    const [formData, setFormData] = useState({
        topic: '',
        count: 10,
        difficulty: 'moderate',
        language: 'english'
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
        const isLastQuestion = currentQuestionIdx === quizData.length - 1;

        if (isLastQuestion) {
            handleSubmitExam();
        } else {
            setCurrentQuestionIdx(prev => prev + 1);
            setTimeLeft(SECONDS_PER_QUESTION);
            // Optional: Smooth scroll to top when question changes
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleGenerate = async () => {
        if (!formData.topic) {
            toast.error("Please enter a topic first!");
            return;
        }
        setIsLoading(true);
        setIsSubmitted(false);
        setUserAnswers({});
        setCurrentQuestionIdx(0);

        try {
            const response = await fetch('https://quizbyaiservice-production.up.railway.app/Generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error(`Server Error ${response.status}`);

            const data = await response.json();
            setQuizData(data);
            setTimeLeft(SECONDS_PER_QUESTION); // Start timer for first question
            toast.success("Quiz generated successfully!");
        } catch (error) {
            toast.error(`Failed to generate: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectOption = (questionIdx, optionText) => {
        if (isSubmitted) return;
        setUserAnswers(prev => ({ ...prev, [questionIdx]: optionText }));
    };

    const handleSubmitExam = () => {
        let currentScore = 0;
        quizData.forEach((q, idx) => {
            if (userAnswers[idx] === q.correctOpt) {
                currentScore++;
            }
        });

        setScore(currentScore);
        setIsSubmitted(true);
        toast.success("Evaluation Complete!");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <PageContainer>
            <Toaster position="top-center" />
            <div className="orb orb-1" />
            <div className="orb orb-2" />

            {!quizData ? (
                <GlassCard>
                    <Header>
                        <div className="icon-badge"><Cpu size={24} /></div>
                        <div>
                            <h2>AI Quiz Architect</h2>
                            <p>Define parameters. Generate intelligence.</p>
                        </div>
                    </Header>

                    <FormGrid>
                        <InputGroup>
                            <label><Sparkles size={14} /> Topic</label>
                            <input
                                type="text"
                                placeholder="Quantum Mechanics, Economics..."
                                value={formData.topic}
                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                            />
                        </InputGroup>

                        <InputGroup>
                            <label><Zap size={14} /> Difficulty</label>
                            <div className="pill-container">
                                {['easy', 'moderate', 'hard'].map((level) => (
                                    <Pill
                                        key={level}
                                        $active={formData.difficulty === level}
                                        onClick={() => setFormData({ ...formData, difficulty: level })}
                                    >
                                        {level}
                                    </Pill>
                                ))}
                            </div>
                        </InputGroup>

                        <InputGroup>
                            <label><Globe size={14} /> Language</label>
                            <div className="pill-container">
                                {['english', 'hindi', 'marathi'].map((lang) => (
                                    <Pill
                                        key={lang}
                                        $active={formData.language === lang}
                                        onClick={() => setFormData({ ...formData, language: lang })}
                                    >
                                        {lang}
                                    </Pill>
                                ))}
                            </div>
                        </InputGroup>

                        <PrimaryButton onClick={handleGenerate} disabled={isLoading || !formData.topic}>
                            {isLoading ? (
                                <><Loader2 size={20} className="spinner" /> Synthesizing...</>
                            ) : "Start Exam"}
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
                                    ? `Final Score: ${score} / ${quizData.length}`
                                    : `Time Remaining: ${timeLeft}s`}
                            </div>
                            <h2>{isSubmitted ? "Evaluation Complete" : formData.topic}</h2>
                        </div>
                        {isSubmitted && (
                            <button className="reset-btn" onClick={() => setQuizData(null)}>
                                <RefreshCcw size={16} /> New Exam
                            </button>
                        )}
                    </ResultHeader>

                    {!isSubmitted && (
                        <TimerBarContainer>
                            <TimerBarFill progress={(timeLeft / SECONDS_PER_QUESTION) * 100} />
                        </TimerBarContainer>
                    )}

                    <QuestionGrid>
                        {quizData.map((q, idx) => {
                            // Only show current question if playing, OR show all if submitted
                            if (!isSubmitted && idx !== currentQuestionIdx) return null;

                            return (
                                <QuestionCard key={idx}>
                                    <div className="q-num">Question {idx + 1} of {quizData.length}</div>
                                    <h3>{q.question}</h3>
                                    <div className="options-list">
                                        {[q.opt1, q.opt2, q.opt3, q.opt4].map((opt, i) => {
                                            const isSelected = userAnswers[idx] === opt;
                                            const isCorrect = opt === q.correctOpt;

                                            let statusClass = "";
                                            if (isSubmitted) {
                                                if (isCorrect) statusClass = "correct";
                                                else if (isSelected && !isCorrect) statusClass = "wrong";
                                            } else if (isSelected) {
                                                statusClass = "selected";
                                            }

                                            return (
                                                <div
                                                    key={i}
                                                    className={`opt ${statusClass}`}
                                                    onClick={() => handleSelectOption(idx, opt)}
                                                >
                                                    <div className="checkbox">
                                                        {isSelected && <div className="inner-dot" />}
                                                    </div>
                                                    {opt}
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
                            <SubmitButton onClick={handleNextQuestion}>
                                {currentQuestionIdx === quizData.length - 1 ? "Finish Exam" : "Next Question"}
                                <ChevronRight size={18} />
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
    width: 100%; max-width: 800px; margin: 0 auto 20px;
    height: 6px; background: rgba(255, 255, 255, 0.1);
    border-radius: 10px; overflow: hidden;
`;

const TimerBarFill = styled.div`
    height: 100%; width: ${props => props.progress}%;
    background: linear-gradient(90deg, #6366f1, #9b59b6);
    transition: width 1s linear;
`;

// --- Animations & Styled Components (Keep your existing styles) ---
const float = keyframes` 0%, 100% { transform: translate(0, 0); } 33% { transform: translate(30px, -50px); } 66% { transform: translate(-20px, 20px); } `;
const spin = keyframes` from { transform: rotate(0deg); } to { transform: rotate(360deg); } `;
const springUp = keyframes` from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } `;

const PageContainer = styled.div`
    min-height: 100vh; padding: 40px 16px; display: flex; justify-content: center;
    color: #e2e2e2; font-family: 'Inter', sans-serif; overflow-x: hidden; position: relative; 
    .orb { position: fixed; width: 300px; height: 300px; border-radius: 50%; filter: blur(80px); z-index: 0; opacity: 0.12; animation: ${float} 20s infinite linear; }
    .orb-1 { background: #9b59b6; top: -100px; left: -100px; }
    .orb-2 { background: #2d8cf0; bottom: -100px; right: -100px; }
`;

const GlassCard = styled.div`
    width: 100%; max-width: 480px; background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 32px; padding: 32px; z-index: 1;
    animation: ${springUp} 0.6s ease-out; height: fit-content;
`;

const Header = styled.div`
    display: flex; gap: 16px; margin-bottom: 32px;
    .icon-badge { width: 48px; height: 48px; background: rgba(155, 89, 182, 0.2); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #bf81da; }
    h2 { margin: 0; font-size: 1.4rem; color: #fff; }
    p { margin: 4px 0 0; color: #888; font-size: 0.85rem; }
`;

const FormGrid = styled.div` display: flex; flex-direction: column; gap: 24px; `;

const InputGroup = styled.div`
    display: flex; flex-direction: column; gap: 10px;
    label { color: #aaa; font-size: 0.75rem; text-transform: uppercase; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    input { background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 14px; color: #fff; font-size: 1rem; width: 100%; }
    .pill-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px; }
`;

const Pill = styled.button`
    padding: 10px; border-radius: 10px; cursor: pointer; font-size: 0.85rem; transition: 0.3s;
    background: ${props => props.$active ? 'rgba(155, 89, 182, 0.25)' : 'rgba(255, 255, 255, 0.03)'};
    border: 1px solid ${props => props.$active ? '#9b59b6' : 'rgba(255, 255, 255, 0.08)'};
    color: ${props => props.$active ? '#fff' : '#777'};
`;

const PrimaryButton = styled.button`
    background: linear-gradient(135deg, #6366f1 0%, #9b59b6 100%);
    color: white; border: none; padding: 16px; border-radius: 14px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    &:disabled { opacity: 0.5; }
    .spinner { animation: ${spin} 1s linear infinite; }
`;

const SubmitButton = styled(PrimaryButton)` padding: 12px 28px; font-size: 0.95rem; border-radius: 100px; width: 100%; max-width: 400px; `;

const ResultContainer = styled.div` width: 100%; max-width: 1100px; z-index: 1; padding-bottom: 120px; `;

const ResultHeader = styled.div`
    display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px; gap: 20px;
    max-width: 800px; margin-left: auto; margin-right: auto;
    @media (max-width: 768px) { flex-direction: column; align-items: flex-start; }
    .success-badge, .score-badge { padding: 8px 16px; border-radius: 100px; font-size: 0.85rem; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; }
    .success-badge { background: rgba(46, 204, 113, 0.1); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.2); }
    .score-badge { background: rgba(241, 196, 15, 0.1); color: #f1c40f; border: 1px solid rgba(241, 196, 15, 0.3); }
    h2 { margin: 12px 0 0; font-size: 1.8rem; }
    .reset-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
`;

const QuestionGrid = styled.div`
    display: flex; flex-direction: column; gap: 24px; max-width: 800px; margin: 0 auto;
`;

const QuestionCard = styled.div`
    background: rgba(20, 20, 20, 0.6); border: 1px solid rgba(255, 255, 255, 0.05); padding: 24px; border-radius: 24px;
    animation: ${springUp} 0.5s ease forwards;
    .q-num { color: #9b59b6; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; }
    h3 { font-size: 1.2rem; margin-bottom: 25px; color: #fff; line-height: 1.5; }
    .options-list { display: flex; flex-direction: column; gap: 10px; }
    
    .opt { 
        padding: 16px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
        font-size: 0.95rem; color: #bbb; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.2s;
        
        .checkbox { width: 20px; height: 20px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .inner-dot { width: 10px; height: 10px; border-radius: 50%; background: #9b59b6; }

        &:hover:not(.correct):not(.wrong) { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); }
        &.selected { border-color: #9b59b6; background: rgba(155, 89, 182, 0.1); color: #fff; .checkbox { border-color: #9b59b6; } }
        &.correct { border-color: #2ecc71; background: rgba(46, 204, 113, 0.1); color: #2ecc71; .checkbox { border-color: #2ecc71; background: #2ecc71; } }
        &.wrong { border-color: #e74c3c; background: rgba(231, 76, 60, 0.1); color: #e74c3c; .checkbox { border-color: #e74c3c; background: #e74c3c; } }
    }
`;

const StickyFooter = styled.div`
    position: fixed; bottom: 0; left: 0; width: 100%; padding: 30px 20px;
    background: linear-gradient(to top, #050505 80%, transparent);
    display: flex; justify-content: center; z-index: 10;
`;

export default AIGenerator;