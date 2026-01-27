"use client";
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Clock, AlertCircle, Plus, Loader2, Fingerprint, Eye, 
  HelpCircle, ChevronLeft, Edit3, Save, Trash2, Inbox, FileText, X, Trophy, Download 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* --- NEW: RESULT MODAL COMPONENT --- */
const ResultModal = ({ quizId, onClose }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Logged/Result/${quizId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
        });
        if (response.ok) {
          const data = await response.json();
          setResults(Array.isArray(data) ? data : [data]);
        }
      } catch (err) {
        toast.error("Failed to load results");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [quizId]);

  /* --- LOGIC: DOWNLOAD AS PDF --- */
 const downloadPDF = () => {
    if (results.length === 0) return;
    
    const doc = new jsPDF();
    doc.text(`Quiz Results - ID: ${quizId}`, 14, 15);
    
    const tableColumn = ["Student Name", "Score", "Total", "Percentage"];
    const tableRows = results.map(res => [
      res.name,
      res.score,
      res.outOf,
      `${((res.score / res.outOf) * 100).toFixed(1)}%`
    ]);

    // Use the function directly instead of calling it on the doc object
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid', // Optional: makes it look clean
      headStyles: { fillColor: [37, 99, 235] } // Matches your primary blue
    });
    
    doc.save(`Quiz_Result_${quizId}.pdf`);
  };

  return (
    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ModalContent initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="modal-header">
          <h3><Trophy size={20} color="#f59e0b" /> Student Results</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {results.length > 0 && (
              <DownloadBtn onClick={downloadPDF} title="Download PDF">
                <Download size={18} />
              </DownloadBtn>
            )}
            <button onClick={onClose}><X size={20} /></button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-center"><Loader2 className="spinner" /></div>
        ) : results.length === 0 ? (
          <p className="no-data">No results recorded yet.</p>
        ) : (
          <ResultTable>
            <thead>
              <tr>
                <th>Name</th>
                <th>Score</th>
                <th>Total</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res, i) => (
                <tr key={i}>
                  <td>{res.name}</td>
                  <td className="score-cell">{res.score}</td>
                  <td>{res.outOf}</td>
                  <td>{((res.score / res.outOf) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </ResultTable>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

/* --- 1. EDIT COMPONENT (Kept as is) --- */
const EditQuizModule = ({ quizId, onBack, primaryColor, userEmail }) => {
  const [quizInfo, setQuizInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalQnos, setOriginalQnos] = useState(new Set());
  const [deletedQnos, setDeletedQnos] = useState([]);

  useEffect(() => {
    if (!quizId) return;
    const fetchForEdit = async () => {
      try {
        const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Logged/Preview/${quizId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
        });
        if (response.ok) {
          const data = await response.json();
          setQuizInfo({
            quizId: data.quizId,
            quizTitle: data.quizTitle,
            duration: data.duration,
            status: data.status,
            createdBy: data.createdBy
          });
          const qs = data.questions || [];
          setQuestions(qs);
          setOriginalQnos(new Set(qs.map(q => q.qno)));
          setDeletedQnos([]); 
        } else {
          toast.error("Quiz not found");
        }
      } catch (err) {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    };
    fetchForEdit();
  }, [quizId]);

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addNewQuestion = () => {
    const nextQNo = questions.length > 0 ? Math.max(...questions.map(q => q.qno)) + 1 : 1;
    const newBlankQuestion = {
      qno: nextQNo, question: "", opt1: "", opt2: "", opt3: "", opt4: "", correctOpt: "opt1", quizId: parseInt(quizId), isLocalOnly: true 
    };
    setQuestions([...questions, newBlankQuestion]);
  };

  const handleDeleteQuestion = (qno, index) => {
    if(!window.confirm("Delete?")) return;
    if (!questions[index].isLocalOnly && originalQnos.has(qno)) {
        setDeletedQnos(prev => [...prev, qno]);
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { 
      quiz: {
          quiz: { ...quizInfo, quizId: parseInt(quizId), status: String(quizInfo.status).toLowerCase() === "true" }, 
          questions: questions.map(q => ({ ...q, qno: q.isLocalOnly ? 0 : q.qno, quizId: parseInt(quizId) }))
      },
      questionNos: deletedQnos
    };
    try {
      const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Logged/Edit`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(payload)
      });
      if (response.ok) { toast.success("Updated!"); onBack(); }
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingState><Loader2 className="spinner" size={40} /><p>Loading...</p></LoadingState>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <EditHeaderSection>
        <div className="left">
          <BackButton onClick={onBack}><ChevronLeft size={20} /> Cancel</BackButton>
          <h2>Editing: {quizInfo?.quizTitle}</h2>
        </div>
        <div className="action-btns">
          <AddQuestionBtn onClick={addNewQuestion}><Plus size={18} /> Add Question</AddQuestionBtn>
          <SaveBtn onClick={handleSave} disabled={saving} $primary={primaryColor}>
            {saving ? <Loader2 className="spinner" size={18} /> : <Save size={18} />} Save All
          </SaveBtn>
        </div>
      </EditHeaderSection>

      <EditLayout>
        <ConfigCard>
          <h3>Quiz Settings</h3>
          <div className="form-grid">
            <div className="field">
              <label>Quiz Title</label>
              <input value={quizInfo?.quizTitle || ''} onChange={(e) => setQuizInfo({...quizInfo, quizTitle: e.target.value})} />
            </div>
            <div className="field">
              <label>Duration (min)</label>
              <input type="number" value={quizInfo?.duration || ''} onChange={(e) => setQuizInfo({...quizInfo, duration: e.target.value})} />
            </div>
          </div>
        </ConfigCard>

        {questions.map((q, idx) => (
          <QuestionEditBox key={idx}>
            <div className="q-top">
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <span>Q {idx + 1}</span>
                <DeleteSmallBtn onClick={() => handleDeleteQuestion(q.qno, idx)}><Trash2 size={14} /></DeleteSmallBtn>
              </div>
              <div className="correct-select">
                <label>Correct:</label>
                <select value={q.correctOpt} onChange={(e) => handleQuestionChange(idx, 'correctOpt', e.target.value)}>
                  <option value="opt1">A</option><option value="opt2">B</option><option value="opt3">C</option><option value="opt4">D</option>
                </select>
              </div>
            </div>
            <textarea className="q-input" value={q.question} onChange={(e) => handleQuestionChange(idx, 'question', e.target.value)} />
            <div className="options-grid-edit">
              {['opt1', 'opt2', 'opt3', 'opt4'].map((opt, i) => (
                <div key={opt} className="opt-field">
                  <span className="opt-label">{String.fromCharCode(65+i)}</span>
                  <input value={q[opt]} onChange={(e) => handleQuestionChange(idx, opt, e.target.value)} />
                </div>
              ))}
            </div>
          </QuestionEditBox>
        ))}
      </EditLayout>
    </motion.div>
  );
};

/* --- 2. PREVIEW COMPONENT (Kept as is) --- */
const FullQuizPreview = ({ quizId, onBack, primaryColor }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Logged/Preview/${quizId}`, {
          method: 'GET', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
        });
        if (response.ok) { const data = await response.json(); setQuestions(data.questions || []); }
      } finally { setLoading(false); }
    };
    fetchQuestions();
  }, [quizId]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <BackButton onClick={onBack}><ChevronLeft size={20} /> Back</BackButton>
      {loading ? <LoadingState><Loader2 className="spinner" size={40} /></LoadingState> : (
        <QuestionsContainer>
          <h2 className="preview-header">Quiz Preview</h2>
          {questions.map((q, index) => (
            <FullQuestionItem key={index}>
              <div className="q-label"><HelpCircle size={14} /> Question {index + 1}</div>
              <p className="q-text">{q.question}</p>
              <div className="options-grid">
                <span className={q.correctOpt === 'opt1' ? 'correct' : ''}>A: {q.opt1}</span>
                <span className={q.correctOpt === 'opt2' ? 'correct' : ''}>B: {q.opt2}</span>
                <span className={q.correctOpt === 'opt3' ? 'correct' : ''}>C: {q.opt3}</span>
                <span className={q.correctOpt === 'opt4' ? 'correct' : ''}>D: {q.opt4}</span>
              </div>
            </FullQuestionItem>
          ))}
        </QuestionsContainer>
      )}
    </motion.div>
  );
};

/* --- 3. MAIN DASHBOARD --- */
const UserDashboard = () => {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [editQuizId, setEditQuizId] = useState(null);
  const [viewResultId, setViewResultId] = useState(null); 
  const [switchingStatusId, setSwitchingStatusId] = useState(null);
  const primaryColor = "#2563eb";

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUserEmail(parsedUser.email);
      fetchUserQuizzes(parsedUser.email);
    }
  }, []);

  const fetchUserQuizzes = async (email) => {
    setLoading(true);
    try {
      const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Logged?email=${email}`, {
        method: 'GET', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
      });
      if (response.ok) setQuizzes(await response.json());
    } finally { setLoading(false); }
  };

  const handleToggleStatus = async (quizId) => {
    setSwitchingStatusId(quizId);
    try {
      const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Logged/SwitchStatus/${quizId}`, {
        method: 'GET', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
      });
      if (response.ok) {
        setQuizzes(prev => prev.map(q => q.quizId === quizId ? { ...q, status: String(q.status) === "true" ? "false" : "true" } : q));
        toast.success("Status switched");
      }
    } finally {
      setSwitchingStatusId(null);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if(!window.confirm("Delete quiz?")) return;
    const response = await fetch(`https://noneditorial-professionally-serena.ngrok-free.dev/Logged/Delete/${quizId}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
    });
    if (response.ok) setQuizzes(prev => prev.filter(q => q.quizId !== quizId));
  };

  return (
    <DashboardWrapper>
      <Toaster position="bottom-right" />
      <AnimatePresence>
        {viewResultId && <ResultModal quizId={viewResultId} onClose={() => setViewResultId(null)} />}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {editQuizId ? (
          <EditQuizModule quizId={editQuizId} primaryColor={primaryColor} userEmail={userEmail} onBack={() => { setEditQuizId(null); fetchUserQuizzes(userEmail); }} />
        ) : selectedQuizId ? (
          <FullQuizPreview quizId={selectedQuizId} onBack={() => setSelectedQuizId(null)} primaryColor={primaryColor} />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <header className="main-header">
              <div className="user-info">
                <h1>My Dashboard</h1>
                <p>Logged in as <span className="highlight">{userEmail}</span></p>
              </div>
              <CreateBtn onClick={() => router.push("/create")} $primary={primaryColor}>
                <Plus size={20} /> <span>New Quiz</span>
              </CreateBtn>
            </header>
            {loading ? <LoadingState><Loader2 className="spinner" size={40} /></LoadingState> : (
              <QuizGrid>
                {quizzes.map((quiz) => (
                  <StyledCard key={quiz.quizId}>
                    <div className="card-header">
                      <div className="icon-bg"><BookOpen size={20} color={primaryColor} /></div>
                      <div style={{display:'flex', gap: '8px', alignItems: 'center'}}>
                        <StatusBadge onClick={() => handleToggleStatus(quiz.quizId)} $isActive={String(quiz.status) === "true"} disabled={switchingStatusId === quiz.quizId}>
                          {switchingStatusId === quiz.quizId ? <Loader2 size={12} className="spinner" /> : (String(quiz.status) === "true" ? "Active" : "Inactive")}
                        </StatusBadge>
                        <EditIconButton onClick={() => setEditQuizId(quiz.quizId)} title="Edit Quiz"><Edit3 size={16} /></EditIconButton>
                        <ResultIconButton onClick={() => setViewResultId(quiz.quizId)} title="Show Results"><FileText size={16} /></ResultIconButton>
                        <DeleteIconButton onClick={() => handleDeleteQuiz(quiz.quizId)} title="Delete Quiz"><Trash2 size={16} /></DeleteIconButton>
                      </div>
                    </div>
                    <h3 className="quiz-title">{quiz.quizTitle || "Untitled"}</h3>
                    <DataGrid>
                      <div className="data-item"><Clock size={14} /> {quiz.duration}m</div>
                      <div className="data-item"><Fingerprint size={14} /> ID: {quiz.quizId}</div>
                    </DataGrid>
                    <SeeQuestionBtn onClick={() => setSelectedQuizId(quiz.quizId)} $primary={primaryColor}><Eye size={16} /> See Questions</SeeQuestionBtn>
                  </StyledCard>
                ))}
              </QuizGrid>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardWrapper>
  );
};

/* --- STYLES --- */
const ModalOverlay = styled(motion.div)` position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; `;
const ModalContent = styled(motion.div)` background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; width: 100%; max-width: 600px; padding: 24px; position: relative; backdrop-filter: blur(16px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; h3 { display: flex; align-items: center; gap: 10px; margin: 0; } button { background: none; border: none; color: #94a3b8; cursor: pointer; } } .loading-center { display: flex; justify-content: center; padding: 40px; .spinner { animation: spin 1s linear infinite; } } .no-data { text-align: center; color: #94a3b8; padding: 20px; } `;
const ResultTable = styled.table` width: 100%; border-collapse: collapse; margin-top: 10px; th, td { text-align: left; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); } th { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; } .score-cell { color: #10b981; font-weight: 700; } `;
const DownloadBtn = styled.button` background: rgba(37, 99, 235, 0.1); border: none; color: #3b82f6; padding: 6px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: #3b82f6; color: white; } `;
const ResultIconButton = styled.button` background: rgba(255,255,255,0.05); border: none; color: #f59e0b; padding: 8px; border-radius: 8px; cursor: pointer; &:hover { background: #f59e0b; color: white; } `;
const DashboardWrapper = styled.div` max-width: 1200px; margin: 0 auto; padding: 40px 20px; color: #f8fafc; .main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; h1 { font-size: 2.2rem; font-weight: 800; } .highlight { color: #3b82f6; } } `;
const QuizGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; `;
const StyledCard = styled(motion.div)` background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 20px; backdrop-filter: blur(10px); .card-header { display: flex; justify-content: space-between; margin-bottom: 15px; } .icon-bg { padding: 8px; background: rgba(37, 99, 235, 0.1); border-radius: 10px; } .quiz-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 15px; color: white; } `;
const QuestionEditBox = styled.div` background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 18px; margin-bottom: 15px; .q-top { display: flex; justify-content: space-between; margin-bottom: 12px; color: #3b82f6; font-weight: 700; } .q-input { width: 100%; background: transparent; border: 1px solid #334155; padding: 12px; border-radius: 10px; color: white; margin-bottom: 12px; font-family: inherit; &:focus { border-color: #3b82f6; outline: none; } } .options-grid-edit { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; .opt-field { display: flex; align-items: center; gap: 10px; border: 1px solid #334155; padding: 10px; border-radius: 10px; input { background: none; border: none; color: white; width: 100%; outline: none; } } } `;
const CreateBtn = styled(motion.button)` display: flex; align-items: center; gap: 10px; background: ${p => p.$primary}; padding: 12px 24px; border-radius: 12px; color: white; border: none; font-weight: 700; cursor: pointer; `;
const SaveBtn = styled.button` background: ${p => p.$primary}; color: white; padding: 12px 20px; border-radius: 12px; border: none; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; &:disabled { opacity: 0.6; } `;
const AddQuestionBtn = styled.button` background: none; border: 1px solid #3b82f6; color: #3b82f6; padding: 12px 20px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; `;
const BackButton = styled.button` background: none; border: none; color: #3b82f6; cursor: pointer; display: flex; align-items: center; gap: 5px; font-weight: 600; `;
const DeleteSmallBtn = styled.button` background: none; border: none; color: #ef4444; cursor: pointer; `;
const StatusBadge = styled.button` padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; border: none; font-weight: 700; background: ${p => p.$isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${p => p.$isActive ? '#10b981' : '#f87171'}; cursor: pointer; display: flex; align-items: center; gap: 4px; &:disabled { opacity: 0.8; cursor: not-allowed; } .spinner { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } } `;
const EditIconButton = styled.button` background: rgba(255,255,255,0.05); border: none; color: white; padding: 8px; border-radius: 8px; cursor: pointer; &:hover { background: #3b82f6; } `;
const DeleteIconButton = styled.button` background: rgba(255,255,255,0.05); border: none; color: #f87171; padding: 8px; border-radius: 8px; cursor: pointer; &:hover { background: #ef4444; color: white; } `;
const LoadingState = styled.div` display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; .spinner { animation: spin 1s linear infinite; } `;
const DataGrid = styled.div` display: flex; gap: 10px; margin-bottom: 15px; .data-item { font-size: 0.75rem; color: #94a3b8; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px; } `;
const SeeQuestionBtn = styled.button` width: 100%; background: rgba(255,255,255,0.05); color: #94a3b8; padding: 10px; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; &:hover { background: ${p => p.$primary}; color: white; } `;
const EditLayout = styled.div` max-width: 800px; margin: 0 auto; `;
const ConfigCard = styled.div` background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 20px; margin-bottom: 20px; .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; .field { display: flex; flex-direction: column; input { background: transparent; border: 1px solid #334155; padding: 10px; border-radius: 8px; color: white; } } } `;
const QuestionsContainer = styled.div` max-width: 800px; margin: 0 auto; `;
const FullQuestionItem = styled.div` background: rgba(30, 41, 59, 0.5); padding: 20px; border-radius: 15px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.05); .q-label { color: #3b82f6; font-size: 0.8rem; font-weight: 700; margin-bottom: 10px; } .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; span { padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.9rem; } .correct { border: 1px solid #10b981; color: #10b981; } } `;
const EditHeaderSection = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; .action-btns { display: flex; gap: 10px; } `;

export default UserDashboard;