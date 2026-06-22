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

const DEFAULT_GRADES: GradingRule[] = [
  { grade: "A+", min: 90, max: 100, color: "#15803d" },
  { grade: "A",  min: 75, max: 89,  color: "#16a34a" },
  { grade: "B",  min: 60, max: 74,  color: "#1d4ed8" },
  { grade: "C",  min: 45, max: 59,  color: "#b45309" },
  { grade: "D",  min: 0,  max: 44,  color: "#b91c1c" },
];

const PRESET_COLORS = [
  "#7c3aed","#0891b2","#059669","#d97706","#dc2626",
  "#db2777","#0284c7","#4f46e5","#65a30d","#ea580c",
];

export const MarksTable: React.FC<MarksTableProps> = ({ selection, academicYear, className }) => {
  const [students] = useLocalStorage<Student[]>(
    `christSchool_${academicYear}_${selection.classId}_students`, []
  );

  const keyPrefix = `christSchool_${academicYear}_${selection.classId}_${selection.term}_${selection.category}`;

  const [numTestsConfig, setNumTestsConfig] = useLocalStorage<number>(`${keyPrefix}_numTests`, 0);
  const [marksData, setMarksData] = useLocalStorage<Record<string, Record<string, string>>>(`${keyPrefix}_marks`, {});
  const [gradingRules, setGradingRules] = useLocalStorage<GradingRule[]>(
    `christSchool_${academicYear}_grading_rules`, DEFAULT_GRADES
  );

  const [inputNumTests, setInputNumTests] = useState("");
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [newGrade, setNewGrade] = useState({ grade: "", min: "", max: "", color: PRESET_COLORS[0] });
  const tableRef = useRef<HTMLDivElement>(null);

  const totalMarks = TOTAL_MARKS[selection.category] ?? 100;

  const handleLoadTests = () => {
    const num = parseInt(inputNumTests);
    if (!isNaN(num) && num > 0) setNumTestsConfig(num);
  };

  const updateMark = (studentId: string, testIdx: number, raw: string) => {
    let value = raw;
    const num = parseFloat(raw);
    if (raw !== "" && !isNaN(num)) {
      if (num < 0) value = "0";
      else if (num > totalMarks) value = String(totalMarks);
    }
    setMarksData(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [`test_${testIdx}`]: value },
    }));
  };

  // Returns average as a percentage (0-100), ceiled
  const getAvgPct = (studentId: string): number | null => {
    const marks = marksData[studentId] || {};
    let total = 0, count = 0;
    for (let i = 0; i < numTestsConfig; i++) {
      const val = parseFloat(marks[`test_${i}`]);
      if (!isNaN(val)) { total += (val / totalMarks) * 100; count++; }
    }
    return count > 0 ? Math.ceil(total / count) : null;
  };

  // Per-test percentage for grading
  const testPct = (studentId: string, testIdx: number): number | null => {
    const val = parseFloat((marksData[studentId] || {})[`test_${testIdx}`]);
    return !isNaN(val) ? Math.ceil((val / totalMarks) * 100) : null;
  };

  const getGrade = (pct: number | null): string => {
    if (pct === null) return "-";
    for (const r of gradingRules) {
      if (pct >= r.min && pct <= r.max) return r.grade;
    }
    return "-";
  };

  const getRuleColor = (grade: string): string => {
    return gradingRules.find(r => r.grade === grade)?.color || "#6b7280";
  };

  const handleAddGrade = () => {
    if (!newGrade.grade.trim()) return;
    setGradingRules([...gradingRules, {
      grade: newGrade.grade.trim(),
      min: parseInt(newGrade.min) || 0,
      max: parseInt(newGrade.max) || 0,
      color: newGrade.color,
    }]);
    setNewGrade({ grade: "", min: "", max: "", color: PRESET_COLORS[gradingRules.length % PRESET_COLORS.length] });
    setShowAddGrade(false);
  };

  const updateRule = (idx: number, field: keyof GradingRule, value: string | number) => {
    const updated = gradingRules.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    setGradingRules(updated);
  };

  const removeRule = (idx: number) => {
    setGradingRules(gradingRules.filter((_, i) => i !== idx));
  };

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
          <span className="font-bold text-red-700">
            No student roster found for this class in Student Info. Add students there first.
          </span>
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
              <input
                type="number" min="1"
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
      {/* Header / Grading Key */}
      <div className="p-4 border-b border-border flex flex-col gap-3 bg-gray-50 shrink-0">
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

        {/* Grading Key rows */}
        <div className="flex gap-2 items-start flex-wrap">
          <span className="font-bold text-xs text-secondary tracking-wide pt-1">GRADING KEY:</span>
          <div className="flex flex-wrap gap-2">
            {gradingRules.map((rule, idx) => (
              <div key={idx} className="flex items-center border border-[#d1d5f0] bg-white overflow-hidden text-xs shadow-sm">
                {/* Color swatch + grade label */}
                <div
                  className="flex items-center gap-1 px-2 py-1 font-bold text-white text-xs cursor-pointer relative group"
                  style={{ backgroundColor: rule.color }}
                  title="Click color to change"
                >
                  <span>{rule.grade}</span>
                  <input
                    type="color"
                    value={rule.color}
                    onChange={e => updateRule(idx, "color", e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    title="Pick color"
                  />
                </div>
                {/* Grade name editable */}
                <input
                  type="text"
                  className="w-8 text-center font-bold outline-none focus:bg-blue-50 border-x border-[#d1d5f0] text-xs py-1"
                  value={rule.grade}
                  onChange={e => updateRule(idx, "grade", e.target.value)}
                />
                {/* Min */}
                <input
                  type="number" min={0} max={100}
                  className="w-10 text-center font-semibold outline-none focus:bg-blue-50 py-1"
                  value={rule.min}
                  onChange={e => updateRule(idx, "min", parseInt(e.target.value) || 0)}
                />
                <span className="text-gray-400 px-0.5">–</span>
                {/* Max */}
                <input
                  type="number" min={0} max={100}
                  className="w-10 text-center font-semibold outline-none focus:bg-blue-50 border-x border-[#d1d5f0] py-1"
                  value={rule.max}
                  onChange={e => updateRule(idx, "max", parseInt(e.target.value) || 0)}
                />
                <button
                  onClick={() => removeRule(idx)}
                  className="px-1.5 text-gray-400 hover:text-red-600 font-bold text-xs"
                  title="Remove grade"
                >×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Add grade inline form */}
        {showAddGrade && (
          <div className="flex items-center gap-2 bg-white border border-[#d1d5f0] p-2 w-fit">
            <span className="text-xs font-bold text-gray-600">New Grade:</span>
            <input
              type="text" placeholder="Label (e.g. A+)" maxLength={4}
              className="border border-border px-2 py-1 text-xs w-20 outline-none focus:border-accent"
              value={newGrade.grade}
              onChange={e => setNewGrade(g => ({ ...g, grade: e.target.value }))}
            />
            <input
              type="number" placeholder="Min" min={0} max={100}
              className="border border-border px-2 py-1 text-xs w-16 outline-none focus:border-accent"
              value={newGrade.min}
              onChange={e => setNewGrade(g => ({ ...g, min: e.target.value }))}
            />
            <span className="text-gray-400 text-xs">–</span>
            <input
              type="number" placeholder="Max" min={0} max={100}
              className="border border-border px-2 py-1 text-xs w-16 outline-none focus:border-accent"
              value={newGrade.max}
              onChange={e => setNewGrade(g => ({ ...g, max: e.target.value }))}
            />
            <label className="text-xs font-bold text-gray-600">Colour:</label>
            <input
              type="color" value={newGrade.color}
              onChange={e => setNewGrade(g => ({ ...g, color: e.target.value }))}
              className="w-8 h-7 cursor-pointer border border-border"
            />
            <button onClick={handleAddGrade}
              className="bg-primary text-white text-xs font-bold px-3 py-1 hover:bg-secondary">Add</button>
            <button onClick={() => setShowAddGrade(false)}
              className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 hover:bg-gray-300">Cancel</button>
          </div>
        )}
      </div>

      {/* Tables */}
      <div className="flex-1 overflow-auto p-4 space-y-8" ref={tableRef}>

        {/* Table 1: Numeric Marks Ledger */}
        <div>
          <h3 className="font-bold text-[#312e81] text-xs tracking-widest mb-2 uppercase">Numeric Marks Ledger</h3>
          <div className="overflow-x-auto">
            <table className="border-collapse bg-white" style={{ width: "max-content", minWidth: "100%" }}>
              <thead>
                <tr>
                  <th className="excel-header w-14 text-center sticky left-0 z-10">Rl. No</th>
                  <th className="excel-header w-44 sticky left-14 z-10">Student Name</th>
                  {testCols.map(col => (
                    <th key={col} className="excel-header w-24 text-center">{col}</th>
                  ))}
                  <th className="excel-header w-28 text-center">Avg / 100</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, rIndex) => {
                  const avg = getAvgPct(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-indigo-50/20">
                      <td className="excel-cell-fixed bg-gray-50 text-center font-bold text-gray-600 sticky left-0 z-10 w-14">{student.rollNo}</td>
                      <td className="excel-cell-fixed bg-gray-50 font-semibold text-gray-800 sticky left-14 z-10 w-44 max-w-[176px] truncate">{student.name || <span className="text-gray-300 italic text-xs">—</span>}</td>
                      {testCols.map((_, cIndex) => {
                        const cellVal = (marksData[student.id] || {})[`test_${cIndex}`] || "";
                        return (
                          <td key={cIndex} className="excel-cell w-24">
                            <input
                              type="number" min={0} max={totalMarks}
                              className="marks-input"
                              value={cellVal}
                              onChange={e => updateMark(student.id, cIndex, e.target.value)}
                              data-row={rIndex}
                              data-col={cIndex}
                            />
                          </td>
                        );
                      })}
                      <td className="excel-cell-fixed bg-gray-100 text-center font-bold font-mono text-[#312e81] w-28">
                        {avg !== null ? avg : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Automated Grade Ledger (read-only) */}
        <div>
          <h3 className="font-bold text-[#312e81] text-xs tracking-widest mb-2 uppercase">Automated Grade Ledger</h3>
          <div className="overflow-x-auto">
            <table className="border-collapse bg-white" style={{ width: "max-content", minWidth: "100%" }}>
              <thead>
                <tr>
                  <th className="excel-header w-14 text-center sticky left-0 z-10">Rl. No</th>
                  <th className="excel-header w-44 sticky left-14 z-10">Student Name</th>
                  {testCols.map(col => (
                    <th key={col} className="excel-header w-24 text-center">{col}</th>
                  ))}
                  <th className="excel-header w-32 text-center">Avg Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const avg = getAvgPct(student.id);
                  const avgGrade = getGrade(avg);
                  const avgColor = getRuleColor(avgGrade);
                  return (
                    <tr key={student.id} className="hover:bg-indigo-50/20">
                      <td className="excel-cell-fixed bg-gray-50 text-center font-bold text-gray-600 sticky left-0 z-10 w-14">{student.rollNo}</td>
                      <td className="excel-cell-fixed bg-gray-50 font-semibold text-gray-800 sticky left-14 z-10 w-44 max-w-[176px] truncate">{student.name || <span className="text-gray-300 italic text-xs">—</span>}</td>
                      {testCols.map((_, cIndex) => {
                        const pct = testPct(student.id, cIndex);
                        const tGrade = getGrade(pct);
                        return (
                          <td key={cIndex} className="excel-cell-fixed bg-white text-center w-24">
                            <span className="font-bold text-[#312e81] text-sm">{tGrade}</span>
                          </td>
                        );
                      })}
                      <td className="excel-cell-fixed bg-indigo-50/60 text-center w-32">
                        {avgGrade !== "-" ? (
                          <span
                            className="inline-block px-3 py-0.5 text-sm font-bold text-white"
                            style={{ backgroundColor: avgColor }}
                          >
                            {avgGrade}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-bold">—</span>
                        )}
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
