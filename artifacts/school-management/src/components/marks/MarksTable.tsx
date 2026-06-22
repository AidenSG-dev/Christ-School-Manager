import React, { useState, useEffect, useRef } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { Student, GradingRule } from "../../types";

interface MarksTableProps {
  selection: { term: string; category: string; classId: string };
  academicYear: string;
  className: string;
}

const TOTAL_MARKS: Record<string, number> = {
  "Class Tests": 20,
  "FA Tests": 50,
  "Term Tests": 80,
};

// Default rules scaled to raw-mark ranges for each category
const getDefaultRules = (total: number): GradingRule[] => [
  { grade: "A+", min: Math.round(total * 0.90), max: total,                          color: "#15803d" },
  { grade: "A",  min: Math.round(total * 0.75), max: Math.round(total * 0.90) - 1,  color: "#16a34a" },
  { grade: "B",  min: Math.round(total * 0.60), max: Math.round(total * 0.75) - 1,  color: "#1d4ed8" },
  { grade: "C",  min: Math.round(total * 0.45), max: Math.round(total * 0.60) - 1,  color: "#b45309" },
  { grade: "D",  min: 0,                        max: Math.round(total * 0.45) - 1,  color: "#b91c1c" },
];

export const MarksTable: React.FC<MarksTableProps> = ({ selection, academicYear, className }) => {
  const [students] = useLocalStorage<Student[]>(
    `christSchool_${academicYear}_${selection.classId}_students`, []
  );

  const keyPrefix = `christSchool_${academicYear}_${selection.classId}_${selection.term}_${selection.category}`;
  const totalMarks = TOTAL_MARKS[selection.category] ?? 100;

  const [numTestsConfig, setNumTestsConfig] = useLocalStorage<number>(`${keyPrefix}_numTests`, 0);
  const [marksData, setMarksData] = useLocalStorage<Record<string, Record<string, string>>>(`${keyPrefix}_marks`, {});

  // Per-category grading rules — ranges are in raw marks (0–totalMarks)
  const [gradingRules, setGradingRules] = useLocalStorage<GradingRule[]>(
    `${keyPrefix}_grading_rules`,
    getDefaultRules(totalMarks)
  );

  const [inputNumTests, setInputNumTests] = useState("");
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [newGrade, setNewGrade] = useState({ grade: "", min: "", max: "", color: "#7c3aed" });
  const tableRef = useRef<HTMLDivElement>(null);

  const handleLoadTests = () => {
    const num = parseInt(inputNumTests);
    if (!isNaN(num) && num > 0) setNumTestsConfig(num);
  };

  // Clamp raw text entry to 0–totalMarks
  const updateMark = (studentId: string, testIdx: number, raw: string) => {
    // Allow partial typing (empty string, minus sign start is fine for text inputs)
    if (raw === "" || raw === "-") {
      setMarksData(prev => ({
        ...prev,
        [studentId]: { ...(prev[studentId] || {}), [`test_${testIdx}`]: raw === "-" ? "" : "" },
      }));
      return;
    }
    const num = parseFloat(raw);
    if (isNaN(num)) return; // ignore non-numeric
    const clamped = Math.min(Math.max(num, 0), totalMarks);
    // Only clamp on blur; while typing allow partial values
    setMarksData(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [`test_${testIdx}`]: raw },
    }));
  };

  const blurClamp = (studentId: string, testIdx: number, raw: string) => {
    if (raw === "") return;
    const num = parseFloat(raw);
    if (isNaN(num)) {
      setMarksData(prev => ({
        ...prev,
        [studentId]: { ...(prev[studentId] || {}), [`test_${testIdx}`]: "" },
      }));
      return;
    }
    const clamped = String(Math.min(Math.max(Math.round(num), 0), totalMarks));
    setMarksData(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [`test_${testIdx}`]: clamped },
    }));
  };

  // Raw average (not percentage) for grading
  const getRawAvg = (studentId: string): number | null => {
    const marks = marksData[studentId] || {};
    let total = 0, count = 0;
    for (let i = 0; i < numTestsConfig; i++) {
      const val = parseFloat(marks[`test_${i}`]);
      if (!isNaN(val)) { total += val; count++; }
    }
    return count > 0 ? total / count : null;
  };

  // Display average as percentage out of 100, rounded up
  const getAvgDisplay = (studentId: string): string => {
    const raw = getRawAvg(studentId);
    if (raw === null) return "—";
    return String(Math.ceil((raw / totalMarks) * 100));
  };

  // Grade lookup uses raw mark against raw-mark rules
  const getGrade = (rawMark: number | null): string => {
    if (rawMark === null) return "-";
    for (const r of gradingRules) {
      if (rawMark >= r.min && rawMark <= r.max) return r.grade;
    }
    return "-";
  };

  const updateRule = (idx: number, field: keyof GradingRule, value: string | number) => {
    setGradingRules(gradingRules.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const removeRule = (idx: number) => setGradingRules(gradingRules.filter((_, i) => i !== idx));

  const handleAddGrade = () => {
    if (!newGrade.grade.trim()) return;
    setGradingRules([...gradingRules, {
      grade: newGrade.grade.trim(),
      min: Math.min(parseInt(newGrade.min) || 0, totalMarks),
      max: Math.min(parseInt(newGrade.max) || 0, totalMarks),
      color: newGrade.color,
    }]);
    setNewGrade({ grade: "", min: "", max: "", color: "#7c3aed" });
    setShowAddGrade(false);
  };

  // Arrow-key navigation — type="text" so no browser number-stepping interference
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!tableRef.current) return;
      const t = e.target as HTMLElement;
      if (t.tagName !== "INPUT" || !t.classList.contains("marks-input")) return;
      const r = parseInt(t.getAttribute("data-row") || "-1");
      const c = parseInt(t.getAttribute("data-col") || "-1");
      if (r < 0 || c < 0) return;
      let nr = r, nc = c;
      if (e.key === "ArrowDown") nr++;
      else if (e.key === "ArrowUp") nr--;
      else if (e.key === "ArrowRight") nc++;
      else if (e.key === "ArrowLeft") nc--;
      else return;
      const next = tableRef.current.querySelector(`[data-row="${nr}"][data-col="${nc}"]`) as HTMLInputElement;
      if (next) { e.preventDefault(); next.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (students.length === 0) {
    return (
      <div className="p-8 w-full">
        <div className="bg-red-50 border-l-4 border-red-600 p-4 flex items-center gap-3">
          <span className="text-xl">⚠</span>
          <span className="font-bold text-red-700">No student roster found for this class in Student Info. Add students there first.</span>
        </div>
      </div>
    );
  }

  if (numTestsConfig === 0) {
    return (
      <div className="flex-1 flex items-center justify-center m-4">
        <div className="text-center p-8 bg-white border border-border shadow-sm max-w-sm w-full">
          <h3 className="font-bold text-lg mb-1 text-primary">Initialize Test Registry</h3>
          <p className="text-sm text-gray-500 mb-4">
            {selection.term} › {selection.category} — Class {className}
            <span className="ml-1 font-bold text-primary">/ {totalMarks} marks</span>
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-left mb-1">Number of tests to be conducted?</label>
              <input type="number" min="1"
                className="w-full border border-border p-2 focus:border-accent outline-none"
                value={inputNumTests}
                onChange={e => setInputNumTests(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLoadTests()}
                autoFocus
              />
            </div>
            <button onClick={handleLoadTests}
              className="w-full bg-primary text-white font-bold py-2 hover:bg-secondary">
              Load Test Columns
            </button>
          </div>
        </div>
      </div>
    );
  }

  const testCols = Array.from({ length: numTestsConfig }).map((_, i) => `Test ${i + 1}`);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Grading Key Header */}
      <div className="p-3 border-b border-border flex flex-col gap-2 bg-gray-50 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-bold text-base text-primary">
            {selection.term} › {selection.category}
            <span className="mx-2 text-gray-300">|</span>Class: {className}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold text-white bg-primary px-3 py-1">
              Total Marks: {totalMarks}
            </div>
            <button
              onClick={() => setShowAddGrade(v => !v)}
              className="text-sm font-bold text-white bg-[#312e81] px-3 py-1 hover:bg-[#4338ca] transition-colors"
            >
              + Add Grade
            </button>
          </div>
        </div>

        {/* Grading Key — one item per rule, no duplicate label */}
        <div className="flex gap-1.5 items-center flex-wrap">
          <span className="font-bold text-[10px] text-secondary tracking-widest mr-1">GRADING KEY:</span>
          {gradingRules.map((rule, idx) => (
            <div key={idx} className="flex items-center border border-[#d1d5f0] overflow-hidden text-xs shadow-sm">
              {/* Grade name input — editable, colored background, no duplicate text */}
              <input
                type="text"
                value={rule.grade}
                onChange={e => updateRule(idx, "grade", e.target.value)}
                maxLength={4}
                className="font-bold text-white text-center outline-none"
                style={{
                  backgroundColor: rule.color,
                  caretColor: "white",
                  minWidth: "1.6rem",
                  fontSize: "10px",
                  padding: "0.15rem 0.3rem",
                }}
              />
              {/* Tiny color swatch — click to open color picker */}
              <label
                className="cursor-pointer border-r border-l border-[#d1d5f0] flex items-center justify-center"
                style={{ backgroundColor: rule.color + "22", padding: "0.25rem 0.3rem" }}
                title="Change colour"
              >
                <input
                  type="color"
                  value={rule.color}
                  onChange={e => updateRule(idx, "color", e.target.value)}
                  className="sr-only"
                />
                <div className="w-2.5 h-2.5" style={{ backgroundColor: rule.color }} />
              </label>
              {/* Min */}
              <input
                type="number" min={0} max={totalMarks}
                className="w-9 text-center font-semibold outline-none py-1 focus:bg-indigo-50"
                value={rule.min}
                onChange={e => updateRule(idx, "min", Math.min(parseInt(e.target.value) || 0, totalMarks))}
              />
              <span className="text-gray-400 text-[10px]">–</span>
              <input
                type="number" min={0} max={totalMarks}
                className="w-9 text-center font-semibold outline-none py-1 border-r border-[#d1d5f0] focus:bg-indigo-50"
                value={rule.max}
                onChange={e => updateRule(idx, "max", Math.min(parseInt(e.target.value) || 0, totalMarks))}
              />
              <button
                onClick={() => removeRule(idx)}
                className="px-1.5 text-gray-400 hover:text-red-600 font-bold text-sm leading-none"
                title="Remove"
              >×</button>
            </div>
          ))}
        </div>

        {/* Add Grade form */}
        {showAddGrade && (
          <div className="flex items-center gap-2 bg-white border border-[#d1d5f0] p-2 w-fit flex-wrap">
            <span className="text-xs font-bold text-gray-600">New Grade:</span>
            <input type="text" placeholder="Label" maxLength={4}
              className="border border-border px-2 py-1 text-xs w-16 outline-none"
              value={newGrade.grade} onChange={e => setNewGrade(g => ({ ...g, grade: e.target.value }))} />
            <input type="number" placeholder="Min" min={0} max={totalMarks}
              className="border border-border px-2 py-1 text-xs w-14 outline-none"
              value={newGrade.min} onChange={e => setNewGrade(g => ({ ...g, min: e.target.value }))} />
            <span className="text-gray-400 text-xs">–</span>
            <input type="number" placeholder="Max" min={0} max={totalMarks}
              className="border border-border px-2 py-1 text-xs w-14 outline-none"
              value={newGrade.max} onChange={e => setNewGrade(g => ({ ...g, max: e.target.value }))} />
            <label className="text-xs font-bold text-gray-600 flex items-center gap-1 cursor-pointer">
              Colour:
              <input type="color" value={newGrade.color}
                onChange={e => setNewGrade(g => ({ ...g, color: e.target.value }))}
                className="w-7 h-6 cursor-pointer border border-border" />
            </label>
            <button onClick={handleAddGrade}
              className="bg-primary text-white text-xs font-bold px-3 py-1 hover:bg-secondary">Add</button>
            <button onClick={() => setShowAddGrade(false)}
              className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 hover:bg-gray-300">Cancel</button>
          </div>
        )}
      </div>

      {/* Tables */}
      <div className="flex-1 overflow-auto p-4 space-y-8" ref={tableRef}>

        {/* ── Table 1: Numeric Marks Ledger ── */}
        <div>
          <p className="font-bold text-[#312e81] text-[10px] tracking-widest mb-1 uppercase">Numeric Marks Ledger</p>
          <div className="overflow-x-auto">
            <table className="border-collapse bg-white" style={{ width: "max-content" }}>
              <thead>
                <tr>
                  <th className="excel-header excel-header-corner w-14 text-center sticky left-0">Rl. No</th>
                  <th className="excel-header excel-header-name w-44 sticky left-14">Student Name</th>
                  {testCols.map(col => (
                    <th key={col} className="excel-header w-24 text-center">{col}</th>
                  ))}
                  <th className="excel-header w-24 text-center">Avg /100</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, rIndex) => (
                  <tr key={student.id} className="hover:bg-indigo-50/20">
                    <td className="excel-cell-fixed bg-gray-50 text-center font-bold text-gray-600 sticky left-0 z-10 w-14">{student.rollNo}</td>
                    <td className="excel-cell-fixed bg-gray-50 sticky left-14 z-10 w-44 max-w-[176px]">
                      <span className="font-semibold text-gray-800 block truncate">{student.name || <span className="text-gray-300 text-xs italic">—</span>}</span>
                    </td>
                    {testCols.map((_, cIndex) => {
                      const cellVal = (marksData[student.id] || {})[`test_${cIndex}`] ?? "";
                      return (
                        <td key={cIndex} className="excel-cell w-24">
                          {/* type="text" prevents browser arrow-key number stepping */}
                          <input
                            type="text"
                            inputMode="decimal"
                            className="marks-input"
                            value={cellVal}
                            onChange={e => updateMark(student.id, cIndex, e.target.value)}
                            onBlur={e => blurClamp(student.id, cIndex, e.target.value)}
                            data-row={rIndex}
                            data-col={cIndex}
                          />
                        </td>
                      );
                    })}
                    <td className="excel-cell-fixed bg-gray-100 text-center font-bold font-mono text-[#312e81] w-24">
                      {getAvgDisplay(student.id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Table 2: Automated Grade Ledger (read-only) ── */}
        <div>
          <p className="font-bold text-[#312e81] text-[10px] tracking-widest mb-1 uppercase">Automated Grade Ledger</p>
          <div className="overflow-x-auto">
            <table className="border-collapse bg-white" style={{ width: "max-content" }}>
              <thead>
                <tr>
                  <th className="excel-header excel-header-corner w-14 text-center sticky left-0">Rl. No</th>
                  <th className="excel-header excel-header-name w-44 sticky left-14">Student Name</th>
                  {testCols.map(col => (
                    <th key={col} className="excel-header w-24 text-center">{col}</th>
                  ))}
                  <th className="excel-header w-28 text-center">Avg Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const rawAvg = getRawAvg(student.id);
                  const avgGrade = getGrade(rawAvg);
                  return (
                    <tr key={student.id} className="hover:bg-indigo-50/20">
                      <td className="excel-cell-fixed bg-gray-50 text-center font-bold text-gray-600 sticky left-0 z-10 w-14">{student.rollNo}</td>
                      <td className="excel-cell-fixed bg-gray-50 sticky left-14 z-10 w-44 max-w-[176px]">
                        <span className="font-semibold text-gray-800 block truncate">{student.name || <span className="text-gray-300 text-xs italic">—</span>}</span>
                      </td>
                      {testCols.map((_, cIndex) => {
                        const raw = parseFloat((marksData[student.id] || {})[`test_${cIndex}`]);
                        const tGrade = !isNaN(raw) ? getGrade(raw) : "-";
                        return (
                          <td key={cIndex} className="excel-cell-fixed bg-white text-center w-24">
                            <span className="font-bold text-[#312e81] text-sm">{tGrade}</span>
                          </td>
                        );
                      })}
                      {/* Average grade — plain bold text, NO coloured background */}
                      <td className="excel-cell-fixed bg-indigo-50/50 text-center w-28">
                        <span className="font-bold text-[#312e81] text-base">{avgGrade}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
