"use client";
import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Sparkles, Zap, Layers, Globe, Cpu, Loader2, CheckCircle2, Trophy, RefreshCcw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast'; // Added for notifications

const AIGenerator = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [quizData, setQuizData] = useState(null);
    const [userAnswers, setUserAnswers] = useState({}); 
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    
    const [formData, setFormData] = useState({
        topic: '',
        count: 10,
        difficulty: 'moderate',
        language: 'english'
    });

    const handleGenerate = async () => {
        if (!formData.topic) {
            toast.error("Please enter a topic first!");
            return;
        }
        setIsLoading(true);
        setIsSubmitted(false);
        setUserAnswers({});

        try {
            const response = await fetch('https://noneditorial-professionally-serena.ngrok-free.dev/Generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            setQuizData(data);
            setIsLoading(false);
            toast.success("Quiz generated successfully!");
        } catch (error) {
            console.error("Detailed Error:", error);
            setIsLoading(false);
            toast.error(`Failed to generate: ${error.message}`);
        }
    };

    const handleSelectOption = (questionIdx, optionText) => {
        if (isSubmitted) return;
        setUserAnswers(prev => ({
            ...prev,
            [questionIdx]: optionText
        }));
    };

    const handleSubmitExam = () => {
        // Validation: Ensure all questions are answered
        const answeredCount = Object.keys(userAnswers).length;
        if (answeredCount < quizData.length) {
            toast.error(`Please answer all questions! (${answeredCount}/${quizData.length} completed)`, {
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
            return;
        }

        let currentScore = 0;
        quizData.forEach((q, idx) => {
            if (userAnswers[idx] === q.correctOpt) {
                currentScore++;
            }
        });
        
        setScore(currentScore);
        setIsSubmitted(true);
        toast.success("Exam Submitted! Check your results.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <PageContainer>
            {/* Toast Container */}
            <Toaster position="top-center" reverseOrder={false} />
            
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
                                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                            />
                        </InputGroup>

                        <InputGroup>
                            <label><Zap size={14} /> Difficulty</label>
                            <div className="pill-container">
                                {['easy', 'moderate', 'hard'].map((level) => (
                                    <Pill 
                                        key={level}
                                        $active={formData.difficulty === level}
                                        onClick={() => setFormData({...formData, difficulty: level})}
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
                                        onClick={() => setFormData({...formData, language: lang})}
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
                            {!isSubmitted ? (
                                <>
                                    <div className="success-badge"><Zap size={16} /> Live Exam</div>
                                    <h2>{formData.topic}</h2>
                                    <p>Select the best answer for each module. All questions are required.</p>
                                </>
                            ) : (
                                <>
                                    <div className="score-badge"><Trophy size={18} /> Final Score: {score} / {quizData.length}</div>
                                    <h2>Evaluation Complete</h2>
                                    <p>Review your performance below.</p>
                                </>
                            )}
                        </div>
                        <div className="action-group">
                            {!isSubmitted ? (
                                <SubmitButton onClick={handleSubmitExam}>Submit Exam</SubmitButton>
                            ) : (
                                <button className="reset-btn" onClick={() => {
                                    setQuizData(null);
                                    toast("Ready for a new round!", { icon: '🚀' });
                                }}>
                                    <RefreshCcw size={16} /> New Exam
                                </button>
                            )}
                        </div>
                    </ResultHeader>
                    
                    <QuestionGrid>
                        {quizData.map((q, idx) => (
                            <QuestionCard key={idx} style={{ animationDelay: `${idx * 0.1}s` }}>
                                <div className="q-num">Module {q.qno}</div>
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
                        ))}
                    </QuestionGrid>

                    {!isSubmitted && (
                        <StickyFooter>
                            <SubmitButton onClick={handleSubmitExam}>Finish & Submit Exam</SubmitButton>
                        </StickyFooter>
                    )}
                </ResultContainer>
            )}
        </PageContainer>
    );
};

// --- Animations ---
const float = keyframes` 0%, 100% { transform: translate(0, 0); } 33% { transform: translate(30px, -50px); } 66% { transform: translate(-20px, 20px); } `;
const spin = keyframes` from { transform: rotate(0deg); } to { transform: rotate(360deg); } `;
const springUp = keyframes` from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } `;

// --- Styled Components ---
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

const SubmitButton = styled(PrimaryButton)` padding: 12px 28px; font-size: 0.95rem; `;

const ResultContainer = styled.div` width: 100%; max-width: 1100px; z-index: 1; padding-bottom: 100px; `;

const ResultHeader = styled.div`
    display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px; gap: 20px;
    max-width: 800px; margin-left: auto; margin-right: auto;
    @media (max-width: 768px) { flex-direction: column; align-items: flex-start; }
    .success-badge, .score-badge { padding: 6px 14px; border-radius: 100px; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; }
    .success-badge { background: rgba(46, 204, 113, 0.1); color: #2ecc71; }
    .score-badge { background: rgba(241, 196, 15, 0.1); color: #f1c40f; border: 1px solid rgba(241, 196, 15, 0.3); }
    h2 { margin: 12px 0 0; font-size: 1.8rem; }
    .reset-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
`;

const QuestionGrid = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 800px;
    margin: 0 auto;
`;

const QuestionCard = styled.div`
    background: rgba(20, 20, 20, 0.6); border: 1px solid rgba(255, 255, 255, 0.05); padding: 24px; border-radius: 24px;
    animation: ${springUp} 0.5s ease forwards;
    .q-num { color: #9b59b6; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; }
    h3 { font-size: 1.1rem; margin-bottom: 20px; color: #fff; line-height: 1.5; }
    .options-list { display: flex; flex-direction: column; gap: 10px; }
    
    .opt { 
        padding: 14px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
        font-size: 0.9rem; color: #bbb; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.2s;
        
        .checkbox { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .inner-dot { width: 8px; height: 8px; border-radius: 50%; background: #9b59b6; }

        &:hover { background: rgba(255,255,255,0.06); }
        &.selected { border-color: #9b59b6; background: rgba(155, 89, 182, 0.1); color: #fff; .checkbox { border-color: #9b59b6; } }
        
        &.correct { border-color: #2ecc71; background: rgba(46, 204, 113, 0.1); color: #2ecc71; .checkbox { border-color: #2ecc71; background: #2ecc71; } }
        &.wrong { border-color: #e74c3c; background: rgba(231, 76, 60, 0.1); color: #e74c3c; .checkbox { border-color: #e74c3c; background: #e74c3c; } }
    }
`;

const StickyFooter = styled.div`
    position: fixed; bottom: 0; left: 0; width: 100%; padding: 20px;
    background: linear-gradient(to top, #050505 60%, transparent);
    display: flex; justify-content: center; z-index: 10;
`;

export default AIGenerator;