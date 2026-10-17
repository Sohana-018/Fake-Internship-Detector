import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import '../styles/pipeline-tracker.css';

const DEFAULT_STEPS = [
  { id: "input_received", label: "Input received", detail: "Parsed word and character counts; validated input length bounds." },
  { id: "text_cleaning", label: "Text cleaning", detail: "Normalized surrounding whitespace and prepared canonical string for regex pattern rules." },
  { id: "rule_checks", label: "Rule checks", detail: "Evaluated regex heuristics (fee traps, WhatsApp/Telegram, webmail, ID collection)." },
  { id: "feature_extraction", label: "Feature extraction", detail: "Extracted 5,000 TF-IDF features + 14 handcrafted forensic indicators." },
  { id: "model_scoring", label: "Model scoring", detail: "Logistic Regression probability inference (class_weight='balanced')." },
  { id: "threshold_decision", label: "Threshold decision", detail: "Applied 0.50 holdout-calibrated classification threshold." },
  { id: "final_verdict", label: "Final verdict", detail: "Classified composite risk score and evaluated heuristic overrides." }
];

const PipelineTracker = ({ pipeline = null, loading = false, isFake = false, defaultCollapsed = true }) => {
  const isSample = !pipeline && !loading;
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // Use real backend pipeline or default fallback
  const rawSteps = useMemo(() => {
    if (Array.isArray(pipeline) && pipeline.length > 0) {
      return pipeline;
    }
    return DEFAULT_STEPS;
  }, [pipeline]);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const [completedCount, setCompletedCount] = useState(prefersReducedMotion ? rawSteps.length : 0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef(null);

  // Playback engine
  const startPlayback = useCallback((stepsCount) => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (prefersReducedMotion) {
      setCompletedCount(stepsCount);
      setActiveStepIndex(stepsCount - 1);
      setIsPlaying(false);
      return;
    }

    setCompletedCount(1);
    setActiveStepIndex(0);
    setIsPlaying(true);

    let current = 1;
    timerRef.current = setInterval(() => {
      current += 1;
      setCompletedCount(current);
      setActiveStepIndex(Math.min(current - 1, stepsCount - 1));

      if (current >= stepsCount) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setIsPlaying(false);
      }
    }, 650);
  }, [prefersReducedMotion]);

  // Trigger playback when pipeline updates or loading completes
  useEffect(() => {
    if (loading) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCompletedCount(1);
      setActiveStepIndex(0);
      setIsPlaying(true);

      let current = 1;
      timerRef.current = setInterval(() => {
        current += 1;
        if (current <= rawSteps.length - 2) {
          setCompletedCount(current);
          setActiveStepIndex(current - 1);
        }
      }, 550);
    } else {
      startPlayback(rawSteps.length);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, pipeline, rawSteps.length, startPlayback]);

  const handleReplay = () => {
    if (loading) return;
    startPlayback(rawSteps.length);
  };

  const handleStepClick = (index) => {
    setActiveStepIndex(index);
  };

  // Currently inspected step
  const activeStep = rawSteps[activeStepIndex] || rawSteps[0];
  const progressPercent = Math.min(100, Math.max(0, (completedCount / rawSteps.length) * 100));

  if (!loading && isCollapsed) {
    return (
      <div className="pipeline-slim-bar animate-fade-in" aria-label="Detection Workflow">
        <button 
          type="button" 
          className="pipeline-slim-toggle"
          onClick={() => {
            setIsCollapsed(false);
            startPlayback(rawSteps.length);
          }}
          aria-expanded={false}
        >
          <div className="pipeline-slim-left">
            <span className="pipeline-slim-icon">⚡</span>
            <span className="pipeline-slim-title">How this result was produced</span>
            <span className="pipeline-slim-pill">{rawSteps.length} verification steps</span>
          </div>
          <div className="pipeline-slim-right">
            <span className="pipeline-slim-btn-label">Inspect</span>
            <span className="pipeline-slim-chevron">▾</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="pipeline-tracker-container animate-fade-in" aria-label="Detection Workflow">
      
      {/* Header Bar */}
      <div className="pipeline-header">
        <div className="pipeline-title-group">
          <h4 className="pipeline-title">
            <span>⚡</span>
            <span>How this result was produced</span>
          </h4>
          {loading && (
            <span className="pipeline-badge loading">
              Analyzing...
            </span>
          )}
          {!loading && !isSample && (
            <span className="pipeline-badge live">
              {isPlaying ? "Executing steps..." : "Complete"}
            </span>
          )}
          {isSample && (
            <span className="pipeline-badge sample">
              Sample workflow
            </span>
          )}
        </div>

        <div className="pipeline-actions">
          {!loading && (
            <button 
              type="button" 
              className="btn-pipeline-action" 
              onClick={handleReplay}
              title="Replay step-by-step pipeline playback"
              disabled={isPlaying}
            >
              <span>↻</span>
              <span>Replay</span>
            </button>
          )}

          <button 
            type="button" 
            className="btn-pipeline-action" 
            onClick={() => setIsCollapsed(true)}
            aria-expanded={true}
            title="Collapse workflow tracker"
          >
            <span>▲</span>
            <span>Collapse</span>
          </button>
        </div>
      </div>

      {/* Stepper Track */}
      <div className="stepper-track-wrapper">
        <div className="stepper-connecting-line">
          <div 
            className="stepper-connecting-line-fill" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <div className="stepper-track">
          {rawSteps.map((step, idx) => {
            const isDone = !loading && (idx < completedCount);
            const isCurrent = loading ? (idx === 0) : (idx === activeStepIndex);
            const isPulsing = loading && idx === 0;
            const isModel = step.id === "model_scoring";
            const isFinal = step.id === "final_verdict";

            let nodeClass = "step-node";
            if (isDone) nodeClass += " done";
            if (isCurrent) nodeClass += " active selected";
            if (isPulsing) nodeClass += " pulsing";
            if (isModel) nodeClass += " model-step";
            if (isFinal) {
              nodeClass += isFake ? " verdict-fake" : " verdict-legit";
            }

            return (
              <button
                key={step.id || idx}
                type="button"
                className={nodeClass}
                onClick={() => handleStepClick(idx)}
                title={`${step.label}: ${step.detail}`}
              >
                <div className="step-circle">
                  {isDone ? (
                    isFinal ? (isFake ? "🚨" : "🛡️") : "✓"
                  ) : (
                    isModel ? "🤖" : (idx + 1)
                  )}
                </div>
                <span className="step-label">
                  {step.label}
                  {isModel && (
                    <span className="model-tag-pill">ML Model</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Step Detail Callout */}
      {loading && (
        <div className="step-detail-card">
          <div className="step-detail-left">
            <span className="step-detail-icon">⚙️</span>
            <div>
              <span className="step-detail-title">Processing:</span>
              <span className="step-detail-desc">Running verification checks across posting text...</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Step Detail Callout — only shown for intermediate steps (1-6) to remove duplicate Final Verdict sentence block */}
      {!loading && activeStep && activeStep.id !== "final_verdict" && (
        <div className="step-detail-card">
          <div className="step-detail-left">
            <span className="step-detail-icon">
              {activeStep.id === "model_scoring" ? "🤖" : 
               activeStep.id === "rule_checks" ? "🚩" : "⚙️"}
            </span>
            <div>
              <span className="step-detail-title">{activeStep.label}:</span>
              <span className="step-detail-desc">{activeStep.detail}</span>
            </div>
          </div>
          {activeStep.duration_ms !== undefined && (
            <span className="step-detail-time" title="Execution latency">
              {activeStep.duration_ms} ms
            </span>
          )}
        </div>
      )}

      {/* Footer Note */}
      <div className="pipeline-footer-note">
        <span>ℹ️</span>
        <span>Steps reflect what the system actually ran for this posting.</span>
      </div>

    </div>
  );
};

export default PipelineTracker;
