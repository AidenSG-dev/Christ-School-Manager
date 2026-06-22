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

export const MarksTable: React.FC<MarksTableProps> = ({ selection, academicYear, className }) => {
  const [students] = useLocalStorage<Student[]>(
    `christSchool_${academicYear}_${selection.classId}_students`,
    []
  );

  const keyPrefix = `christSchool_${academicYear}_${selection.classId}_${selection.term}_${selection.category}`;

  const [numTestsConfig, setNumTestsConfig] = useLocalStorage<number>(`${keyPrefix}_numTests`, 0);
  const [marksData, setMarksData] = useLocalStorage<Record<string, Record<string, string>>>(`${keyPrefix}_marks`, {});

  const [gradingRules, setGradingRules] = useLocalStorage<GradingRule[]>(`christSchool_${academicYear}_grading_rules`, [
    { grade: "A+", min: 90, max: 100 },
    { grade: "A", min: 75, max: 89 },
    { grade: "B", min: 60, max: 74 },
    { grade: "C", min: 45, max: 59 },
    { grade: "D", min: 30, max: 44 },
    { grade: "E", min: 0, max: 29 },
  ]);

  const [inputNumTests, setInputNumTests] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);

  const totalMarks = TOTAL_MARKS[selection.category] ?? null;

  const handleLoadTests = () => {
    const num = parseInt(inputNumTests);
    if (!isNaN(num) && num > 0) {
      setNumTestsConfig(num);
    }
  };

  const updateMark = (studentId: string, testIdx: number, value: string) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [`test_${testIdx}`]: value,
      },
    }));
  };

  const getAverage = (studentId: string): number | null => {
    const marks = marksData[studentId] || {};
    let total = 0, count = 0;
    for (let i = 0; i < numTestsConfig; i++) {
      const val = parseFloat(marks[`test_${i}`]);
      if (!isNaN(val)) { total += val; count++; }
    }
    return count > 0 ? total / count : null;
  };

  const getGrade = (score: number | null): string => {
    if (score === null) return "-";
    for (const rule of gradingRules) {
      if (score >= rule.min && score <= rule.max) return rule.grade;
    }
    return "-";
  };

  // Colors only used in the Grading Key badge labels — NOT in table cells
  const getKeyBadgeColor = (grade: string) => {
    if (grade === "A+") return "bg-green-700 text-white";
    if (grade === "A") return "bg-green-500 text-white";
    if (grade === "B") return "bg-blue-500 text-white";
    if (grade === "C") return "bg-yellow-400 text-black";
    if (grade === "D") return "bg-orange-500 text-white";
    if (grade === "E") return "bg-red-600 text-white";
    return "bg-gray-200 text-gray-500";
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tableRef.current) return;
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" || !target.classList.contains("excel-input")) return;
      const r = parseInt(target.getAttribute("data-row") || "-1");
      const c = parseInt(target.getAttribute("data-col") || "-1");
      if (r === -1 || c === -1) return;
      let nextR = r, nextC = c;
      if (e.key === "ArrowDown") nextR += 1;
      else if (e.key === "ArrowUp") nextR -= 1;
      else if (e.key === "ArrowRight") nextC += 1;
      else if (e.key === "ArrowLeft") nextC -= 1;
      else return;
      const nextInput = tableRef.current.querySelector(`input[data-row="${nextR}"][data-col="${nextC}"]`) as HTMLInputElement;
      if (nextInput) { e.preventDefault(); nextInput.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
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
      <div className="flex-1 flex items-center justify-center bg-white m-4 border border-border">
        <div className="text-center p-8 bg-gray-50 border border-gray-200 shadow-sm max-w-sm w-full">
          <h3 className="font-bold text-lg mb-1 text-primary">Initialize Test Registry</h3>
          <p className="text-sm text-gray-500 mb-4">
            {selection.term} › {selection.category} — Class {className}
            {totalMarks !== null && (
              <span className="ml-2 font-bold text-primary">/ {totalMarks} marks</span>
            )}
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-left mb-1">
                Number of tests to be conducted?
              </label>
              <input
                type="number"
                className="w-full border border-border p-2 focus:border-accent outline-none"
                value={inputNumTests}
                onChange={e => setInputNumTests(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLoadTests()}
                min="1"
                autoFocus
              />
            </div>
            <button
              onClick={handleLoadTests}
              className="w-full bg-primary text-white font-bold py-2 hover:bg-secondary transition-colors"
            >
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
      {/* Control / Grading Key Header */}
      <div className="p-4 border-b border-border flex flex-col gap-3 bg-gray-50 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-bold text-base text-primary tracking-tight">
            {selection.term} › {selection.category}
            <span className="mx-2 text-gray-300">|</span>
            Class: {className}
          </div>
          {totalMarks !== null && (
            <div className="text-sm font-bold text-white bg-primary px-3 py-1">
              Total Marks: {totalMarks}
            </div>
          )}
        </div>

        {/* Grading Key — colors here only */}
        <div className="flex gap-2 items-center flex-wrap">
          <span className="font-bold text-xs text-secondary mr-1 tracking-wide">GRADING KEY:</span>
          {gradingRules.map((rule, idx) => (
            <div key={idx} className="flex items-center border border-border bg-white overflow-hidden text-xs">
              <span className={`px-2 py-1 font-bold ${getKeyBadgeColor(rule.grade)}`}>
                {rule.grade}
              </span>
              <input
                type="number"
                className="w-10 text-center font-semibold outline-none focus:bg-blue-50 border-x border-border"
                value={rule.min}
                onChange={(e) => {
                  const newRules = [...gradingRules];
                  newRules[idx] = { ...newRules[idx], min: parseInt(e.target.value) || 0 };
                  setGradingRules(newRules);
                }}
              />
              <span className="text-gray-400 px-0.5">–</span>
              <input
                type="number"
                className="w-10 text-center font-semibold outline-none focus:bg-blue-50"
                value={rule.max}
                onChange={(e) => {
                  const newRules = [...gradingRules];
                  newRules[idx] = { ...newRules[idx], max: parseInt(e.target.value) || 0 };
                  setGradingRules(newRules);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tables — horizontal scroll, sidebar unaffected */}
      <div className="flex-1 overflow-auto p-4 space-y-8" ref={tableRef}>

        {/* Table 1: Numeric Marks Ledger */}
        <div>
          <h3 className="font-bold text-primary text-sm tracking-wide mb-2 uppercase">
            Numeric Marks Ledger
          </h3>
          <div className="overflow-x-auto">
            <table className="border-collapse bg-white" style={{ minWidth: "100%" }}>
              <thead>
                <tr>
                  <th className="excel-header w-14 text-center border-r border-blue-300/40 sticky left-0 z-10">Rl. No</th>
                  <th className="excel-header w-44 border-r border-blue-300/40 sticky left-14 z-10">Student Name</th>
                  {testCols.map(col => (
                    <th key={col} className="excel-header border-r border-blue-300/40 w-24 text-center">{col}</th>
                  ))}
                  <th className="excel-header w-24 text-center">Avg (%)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, rIndex) => {
                  const avg = getAverage(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-blue-50/40">
                      <td className="excel-cell bg-gray-50 text-center font-semibold text-gray-600 sticky left-0 z-10">{student.rollNo}</td>
                      <td className="excel-cell bg-gray-50 px-2 font-semibold text-gray-800 sticky left-14 z-10">{student.name || <span className="text-gray-300 italic">—</span>}</td>
                      {testCols.map((_, cIndex) => (
                        <td key={cIndex} className="excel-cell">
                          <input
                            type="text"
                            className="excel-input text-center font-mono"
                            value={(marksData[student.id] || {})[`test_${cIndex}`] || ""}
                            onChange={(e) => updateMark(student.id, cIndex, e.target.value)}
                            data-row={rIndex}
                            data-col={cIndex}
                          />
                        </td>
                      ))}
                      <td className="excel-cell bg-gray-100 text-center font-bold font-mono text-primary">
                        {avg !== null ? avg.toFixed(1) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Automated Grade Ledger — read-only, NO colored cell backgrounds */}
        <div>
          <h3 className="font-bold text-[#312e81] text-sm tracking-wide mb-2 uppercase">
            Automated Grade Ledger
          </h3>
          <div className="overflow-x-auto">
            <table className="border-collapse bg-white" style={{ minWidth: "100%" }}>
              <thead>
                <tr>
                  <th className="bg-[#312e81] text-white text-sm font-bold p-2 border border-[#4338ca] w-14 text-center sticky left-0 z-10">Rl. No</th>
                  <th className="bg-[#312e81] text-white text-sm font-bold p-2 border border-[#4338ca] w-44 text-left sticky left-14 z-10">Student Name</th>
                  {testCols.map(col => (
                    <th key={col} className="bg-[#312e81] text-white text-sm font-bold p-2 border border-[#4338ca] w-24 text-center">{col}</th>
                  ))}
                  <th className="bg-[#312e81] text-white text-sm font-bold p-2 border border-[#4338ca] w-32 text-center">Avg Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const marks = marksData[student.id] || {};
                  const avg = getAverage(student.id);
                  const avgGrade = getGrade(avg);
                  return (
                    <tr key={student.id} className="hover:bg-indigo-50/30">
                      <td className="p-2 border border-[#d1d5f0] bg-gray-50 text-center font-semibold text-gray-600 sticky left-0 z-10 min-w-[56px]">{student.rollNo}</td>
                      <td className="p-2 border border-[#d1d5f0] bg-gray-50 font-semibold text-gray-800 sticky left-14 z-10 min-w-[176px]">{student.name || <span className="text-gray-300 italic">—</span>}</td>
                      {testCols.map((_, cIndex) => {
                        const val = parseFloat(marks[`test_${cIndex}`]);
                        const tGrade = !isNaN(val) ? getGrade(val) : "-";
                        return (
                          <td key={cIndex} className="p-2 border border-[#d1d5f0] bg-white text-center min-w-[96px]">
                            <span className="font-bold text-[#312e81] text-sm">{tGrade}</span>
                          </td>
                        );
                      })}
                      <td className="p-2 border border-[#d1d5f0] bg-indigo-50 text-center min-w-[128px]">
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
