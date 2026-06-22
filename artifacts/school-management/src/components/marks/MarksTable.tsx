import React, { useState, useEffect, useRef } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { Student, GradingRule } from "../../types";

interface MarksTableProps {
  selection: { term: string; category: string; classId: string };
  academicYear: string;
  className: string;
}

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
        [`test_${testIdx}`]: value
      }
    }));
  };

  const getAverage = (studentId: string): number | null => {
    const marks = marksData[studentId] || {};
    let total = 0;
    let count = 0;
    for (let i = 0; i < numTestsConfig; i++) {
      const val = parseFloat(marks[`test_${i}`]);
      if (!isNaN(val)) {
        total += val;
        count++;
      }
    }
    return count > 0 ? (total / count) : null;
  };

  const getGrade = (avg: number | null): string => {
    if (avg === null) return "-";
    for (const rule of gradingRules) {
      if (avg >= rule.min && avg <= rule.max) return rule.grade;
    }
    return "-";
  };

  const getGradeColor = (grade: string) => {
    if (grade === "A+") return "bg-green-800 text-white";
    if (grade === "A") return "bg-green-500 text-white";
    if (grade === "B") return "bg-blue-500 text-white";
    if (grade === "C") return "bg-yellow-400 text-black";
    if (grade === "D") return "bg-orange-500 text-white";
    if (grade === "E") return "bg-red-600 text-white";
    return "bg-gray-200 text-gray-500";
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tableRef.current) return;
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" || !target.classList.contains("excel-input")) return;
      
      const r = parseInt(target.getAttribute("data-row") || "-1");
      const c = parseInt(target.getAttribute("data-col") || "-1");
      
      if (r === -1 || c === -1) return;

      let nextR = r;
      let nextC = c;

      if (e.key === "ArrowDown") nextR += 1;
      else if (e.key === "ArrowUp") nextR -= 1;
      else if (e.key === "ArrowRight") nextC += 1;
      else if (e.key === "ArrowLeft") nextC -= 1;
      else return;

      const nextInput = tableRef.current.querySelector(`input[data-row="${nextR}"][data-col="${nextC}"]`) as HTMLInputElement;
      if (nextInput) {
        e.preventDefault();
        nextInput.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (students.length === 0) {
    return (
      <div className="p-8 w-full">
        <div className="bg-red-50 border border-red-200 p-4 shadow-sm flex items-center gap-3">
          <span className="text-xl">⚠</span>
          <span className="font-bold text-red-700">No student roster found for this class in Student Info.</span>
        </div>
      </div>
    );
  }

  if (numTestsConfig === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white m-4 border border-border">
        <div className="text-center p-8 bg-gray-50 border border-gray-200 shadow-sm max-w-sm w-full">
          <h3 className="font-bold text-lg mb-4 text-primary">Initialize Test Registry</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-left mb-1">Number of tests conducted?</label>
              <input 
                type="number" 
                className="w-full border border-border p-2 focus:border-accent outline-none"
                value={inputNumTests}
                onChange={e => setInputNumTests(e.target.value)}
                min="1"
              />
            </div>
            <button 
              onClick={handleLoadTests}
              className="w-full bg-primary text-white font-bold py-2 hover:bg-secondary transition-colors"
            >
              Load
            </button>
          </div>
        </div>
      </div>
    );
  }

  const testCols = Array.from({ length: numTestsConfig }).map((_, i) => `Test ${i + 1}`);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Control Row */}
      <div className="p-4 border-b border-border flex flex-col gap-4 bg-gray-50 shrink-0">
        <div className="font-bold text-lg text-primary tracking-tight">
          {selection.term} &gt; {selection.category} <span className="mx-2 text-gray-300">|</span> Class: {className}
        </div>
        
        {/* Grading Key Engine */}
        <div className="flex gap-2 items-center flex-wrap">
          <span className="font-bold text-sm text-secondary mr-2">Grading Key:</span>
          {gradingRules.map((rule, idx) => (
            <div key={idx} className="flex items-center border border-border bg-white overflow-hidden text-xs">
              <span className={`px-2 py-1 font-bold ${getGradeColor(rule.grade)}`}>{rule.grade}</span>
              <input 
                type="number" 
                className="w-10 text-center font-semibold outline-none focus:bg-blue-50"
                value={rule.min}
                onChange={(e) => {
                  const newRules = [...gradingRules];
                  newRules[idx].min = parseInt(e.target.value) || 0;
                  setGradingRules(newRules);
                }}
              />
              <span className="text-gray-500">-</span>
              <input 
                type="number" 
                className="w-10 text-center font-semibold outline-none focus:bg-blue-50"
                value={rule.max}
                onChange={(e) => {
                  const newRules = [...gradingRules];
                  newRules[idx].max = parseInt(e.target.value) || 0;
                  setGradingRules(newRules);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-8" ref={tableRef}>
        
        {/* Table 1: Numeric */}
        <div>
          <h3 className="font-bold text-secondary mb-2">Numeric Marks Ledger</h3>
          <table className="w-full border-collapse bg-white table-fixed">
            <thead>
              <tr>
                <th className="excel-header w-16 text-center border-r border-gray-600">Rl. No</th>
                <th className="excel-header w-48 border-r border-gray-600">Student Name</th>
                {testCols.map(col => (
                  <th key={col} className="excel-header border-r border-gray-600 w-24 text-center">{col}</th>
                ))}
                <th className="excel-header w-24 text-center">Avg (%)</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, rIndex) => {
                const avg = getAverage(student.id);
                return (
                  <tr key={student.id} className="hover:bg-blue-50/30">
                    <td className="excel-cell bg-gray-50 text-center font-semibold text-gray-600">{student.rollNo}</td>
                    <td className="excel-cell bg-gray-50 px-2 font-semibold text-gray-800 truncate">{student.name}</td>
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
                    <td className="excel-cell bg-gray-100 text-center font-bold font-mono">
                      {avg !== null ? avg.toFixed(1) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table 2: Automated Grades */}
        <div>
          <h3 className="font-bold text-[#312e81] mb-2">Automated Grade Ledger</h3>
          <table className="w-full border-collapse bg-white table-fixed">
            <thead>
              <tr>
                <th className="bg-[#312e81] text-white text-sm font-semibold p-2 border border-[#312e81] w-16 text-center">Rl. No</th>
                <th className="bg-[#312e81] text-white text-sm font-semibold p-2 border border-[#312e81] w-48 text-left border-l border-[#4338ca]">Student Name</th>
                {testCols.map(col => (
                  <th key={col} className="bg-[#312e81] text-white text-sm font-semibold p-2 border border-[#312e81] w-24 text-center border-l border-[#4338ca]">{col}</th>
                ))}
                <th className="bg-[#312e81] text-white text-sm font-semibold p-2 border border-[#312e81] w-32 text-center border-l border-[#4338ca]">Average Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const marks = marksData[student.id] || {};
                const avg = getAverage(student.id);
                const grade = getGrade(avg);
                return (
                  <tr key={student.id} className="hover:bg-indigo-50/30">
                    <td className="excel-cell bg-gray-50 text-center font-semibold text-gray-600">{student.rollNo}</td>
                    <td className="excel-cell bg-gray-50 px-2 font-semibold text-gray-800 truncate">{student.name}</td>
                    {testCols.map((_, cIndex) => {
                      const val = parseFloat(marks[`test_${cIndex}`]);
                      const tGrade = !isNaN(val) ? getGrade(val) : "-";
                      return (
                        <td key={cIndex} className="excel-cell bg-white text-center">
                          <span className={`inline-block px-1.5 py-0.5 text-xs font-bold ${getGradeColor(tGrade)}`}>
                            {tGrade}
                          </span>
                        </td>
                      );
                    })}
                    <td className="excel-cell bg-indigo-50 text-center font-bold">
                      <span className={`inline-block px-3 py-1 text-sm font-bold ${getGradeColor(grade)} shadow-sm`}>
                        {grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
