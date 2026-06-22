import React, { useState, useEffect, useRef } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { ClassInfo, Student } from "../../types";

interface StudentTableProps {
  activeClass: ClassInfo;
  academicYear: string;
}

// Dynamic width so cells expand as user types — 8px per char + padding
const inputWidth = (val: string) => Math.max(130, (val?.length || 0) * 8 + 32);

export const StudentTable: React.FC<StudentTableProps> = ({ activeClass, academicYear }) => {
  const defaultCols = ["Student Name", "Student ID", "Birth Date", "Address", "Mother/Father No."];

  const [columns, setColumns] = useLocalStorage<string[]>(
    `christSchool_${academicYear}_${activeClass.id}_cols`,
    defaultCols
  );
  const [students, setStudents] = useLocalStorage<Student[]>(
    `christSchool_${academicYear}_${activeClass.id}_students`,
    []
  );

  const [numStudents, setNumStudents] = useState("");
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    const num = parseInt(numStudents);
    if (!isNaN(num) && num > 0) {
      setStudents(
        Array.from({ length: num }).map((_, i) => ({
          id: crypto.randomUUID(),
          rollNo: i + 1,
          name: "", studentId: "", birthDate: "", address: "", parentPhone: "",
        }))
      );
    }
  };

  const handleAddStudent = () => {
    setStudents([...students, {
      id: crypto.randomUUID(),
      rollNo: students.length + 1,
      name: "", studentId: "", birthDate: "", address: "", parentPhone: "",
    }]);
  };

  const handleAddColumn = () => {
    if (newColName.trim() && !columns.includes(newColName.trim())) {
      setColumns([...columns, newColName.trim()]);
    }
    setIsColModalOpen(false);
    setNewColName("");
  };

  const updateStudent = (id: string, field: string, value: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== id) return s;
      if (field === "Student Name") return { ...s, name: value };
      if (field === "Student ID") return { ...s, studentId: value };
      if (field === "Birth Date") return { ...s, birthDate: value };
      if (field === "Address") return { ...s, address: value };
      if (field === "Mother/Father No.") return { ...s, parentPhone: value };
      return { ...s, [field]: value };
    }));
  };

  const getVal = (s: Student, field: string): string => {
    if (field === "Student Name") return s.name || "";
    if (field === "Student ID") return s.studentId || "";
    if (field === "Birth Date") return s.birthDate || "";
    if (field === "Address") return s.address || "";
    if (field === "Mother/Father No.") return s.parentPhone || "";
    return (s[field] as string) || "";
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!tableRef.current) return;
      const t = e.target as HTMLElement;
      if (t.tagName !== "INPUT" || !t.classList.contains("excel-input")) return;
      const r = parseInt(t.getAttribute("data-row") || "-1");
      const c = parseInt(t.getAttribute("data-col") || "-1");
      if (r < 0 || c < 0) return;
      let nr = r, nc = c;
      if (e.key === "ArrowDown") nr++;
      else if (e.key === "ArrowUp") nr--;
      else if (e.key === "ArrowRight") nc++;
      else if (e.key === "ArrowLeft") nc--;
      else if (e.key === "Tab" && !e.shiftKey) nc++;
      else if (e.key === "Tab" && e.shiftKey) nc--;
      else return;
      const next = tableRef.current.querySelector(`[data-row="${nr}"][data-col="${nc}"]`) as HTMLInputElement;
      if (next) { e.preventDefault(); next.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (students.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center m-4">
        <div className="text-center p-8 bg-white border border-border shadow-sm max-w-sm w-full">
          <h3 className="font-bold text-lg mb-1 text-primary">Initialize Class Roster</h3>
          <p className="text-sm text-gray-500 mb-4">Class {activeClass.name} – Section {activeClass.section}</p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-left mb-1">Number of students?</label>
              <input
                type="number" min="1"
                className="w-full border border-border p-2 focus:border-accent outline-none"
                value={numStudents}
                onChange={e => setNumStudents(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleGenerate()}
                autoFocus
              />
            </div>
            <button onClick={handleGenerate} className="w-full bg-primary text-white font-bold py-2 hover:bg-secondary">
              Generate Roster
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Control row — h-14 matches sidebar header */}
      <div className="h-14 px-4 border-b border-border flex justify-between items-center bg-gray-50 shrink-0">
        <div className="font-bold text-base text-primary">
          Class: {activeClass.name}<span className="mx-2 text-gray-300">|</span>Section: {activeClass.section}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsColModalOpen(true)}
            className="px-3 py-1.5 border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-colors text-sm"
          >
            + Add Column
          </button>
          <button
            onClick={handleAddStudent}
            className="px-3 py-1.5 bg-primary text-white font-bold hover:bg-secondary transition-colors text-sm"
          >
            + Add Student
          </button>
        </div>
      </div>

      {/* Table — no fixed width; cells auto-expand with content; scrolls right */}
      <div className="flex-1 overflow-auto" ref={tableRef}>
        <table className="border-collapse bg-white" style={{ width: "max-content", minWidth: "100%" }}>
          <thead>
            <tr>
              <th className="excel-header excel-header-corner w-14 text-center sticky left-0">Rl. No</th>
              {columns.map(col => (
                <th key={col} className="excel-header">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student, rIndex) => (
              <tr key={student.id} className="hover:bg-indigo-50/20">
                <td className="excel-cell-fixed bg-gray-50 text-center font-bold text-gray-600 sticky left-0 z-10 w-14">
                  {student.rollNo}
                </td>
                {columns.map((col, cIndex) => {
                  const val = getVal(student, col);
                  return (
                    <td key={`${student.id}-${col}`} className="excel-cell" style={{ width: inputWidth(val) + "px" }}>
                      <input
                        type="text"
                        className="excel-input"
                        value={val}
                        onChange={e => updateStudent(student.id, col, e.target.value)}
                        style={{ width: inputWidth(val) + "px" }}
                        data-row={rIndex}
                        data-col={cIndex}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isColModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 shadow-xl w-80 border-t-4 border-primary">
            <h3 className="font-bold text-lg mb-4">Add Custom Column</h3>
            <label className="block text-sm font-bold mb-1">Column Header Name</label>
            <input
              type="text"
              className="w-full border border-border p-2 focus:border-accent outline-none"
              value={newColName}
              onChange={e => setNewColName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddColumn()}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setIsColModalOpen(false)}
                className="px-4 py-2 bg-gray-200 font-bold hover:bg-gray-300">Cancel</button>
              <button onClick={handleAddColumn}
                className="px-4 py-2 bg-primary text-white font-bold hover:bg-secondary">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
