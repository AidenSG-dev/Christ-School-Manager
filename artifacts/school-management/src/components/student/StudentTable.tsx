import React, { useState, useEffect, useRef } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { ClassInfo, Student } from "../../types";

interface StudentTableProps {
  activeClass: ClassInfo;
  academicYear: string;
}

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

  const [numStudents, setNumStudents] = useState<string>("");
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    const num = parseInt(numStudents);
    if (!isNaN(num) && num > 0) {
      const newStudents: Student[] = Array.from({ length: num }).map((_, i) => ({
        id: crypto.randomUUID(),
        rollNo: i + 1,
        name: "",
        studentId: "",
        birthDate: "",
        address: "",
        parentPhone: "",
      }));
      setStudents(newStudents);
    }
  };

  const handleAddStudent = () => {
    const newStudent: Student = {
      id: crypto.randomUUID(),
      rollNo: students.length + 1,
      name: "",
      studentId: "",
      birthDate: "",
      address: "",
      parentPhone: "",
    };
    setStudents([...students, newStudent]);
  };

  const handleAddColumn = () => {
    if (newColName && !columns.includes(newColName)) {
      setColumns([...columns, newColName]);
    }
    setIsColModalOpen(false);
    setNewColName("");
  };

  const updateStudent = (id: string, field: string, value: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        if (field === "Student Name") return { ...s, name: value };
        if (field === "Student ID") return { ...s, studentId: value };
        if (field === "Birth Date") return { ...s, birthDate: value };
        if (field === "Address") return { ...s, address: value };
        if (field === "Mother/Father No.") return { ...s, parentPhone: value };
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const getFieldValue = (student: Student, field: string) => {
    if (field === "Student Name") return student.name || "";
    if (field === "Student ID") return student.studentId || "";
    if (field === "Birth Date") return student.birthDate || "";
    if (field === "Address") return student.address || "";
    if (field === "Mother/Father No.") return student.parentPhone || "";
    return student[field] || "";
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
      <div className="flex-1 flex items-center justify-center bg-white m-4 border border-border">
        <div className="text-center p-8 bg-gray-50 border border-gray-200 shadow-sm max-w-sm w-full">
          <h3 className="font-bold text-lg mb-4 text-primary">Initialize Class Roster</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-left mb-1">Number of students?</label>
              <input 
                type="number" 
                className="w-full border border-border p-2 focus:border-accent outline-none"
                value={numStudents}
                onChange={e => setNumStudents(e.target.value)}
                min="1"
              />
            </div>
            <button 
              onClick={handleGenerate}
              className="w-full bg-primary text-white font-bold py-2 hover:bg-secondary transition-colors"
            >
              Generate
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Control Row */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50 shrink-0">
        <div className="font-bold text-lg text-primary tracking-tight">
          Class: {activeClass.name} <span className="mx-2 text-gray-300">|</span> Section: {activeClass.section}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsColModalOpen(true)}
            className="px-3 py-1.5 border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-colors text-sm"
          >
            [+ Add Column]
          </button>
          <button 
            onClick={handleAddStudent}
            className="px-3 py-1.5 bg-primary text-white font-bold hover:bg-secondary transition-colors text-sm"
          >
            [+ Add Student]
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto p-4" ref={tableRef}>
        <table className="w-full border-collapse bg-white table-fixed">
          <thead>
            <tr>
              <th className="excel-header w-16 text-center border-r border-gray-600">Rl. No</th>
              {columns.map(col => (
                <th key={col} className="excel-header border-r border-gray-600">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student, rIndex) => (
              <tr key={student.id} className="hover:bg-blue-50/30">
                <td className="excel-cell bg-gray-50 text-center font-semibold text-gray-600">
                  {student.rollNo}
                </td>
                {columns.map((col, cIndex) => (
                  <td key={`${student.id}-${col}`} className="excel-cell">
                    <input
                      type="text"
                      className="excel-input"
                      value={getFieldValue(student, col)}
                      onChange={(e) => updateStudent(student.id, col, e.target.value)}
                      data-row={rIndex}
                      data-col={cIndex}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Column Modal */}
      {isColModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 shadow-xl w-80 border-t-4 border-primary">
            <h3 className="font-bold text-lg mb-4">Add Column</h3>
            <div>
              <label className="block text-sm font-bold mb-1">Column Name</label>
              <input 
                type="text"
                className="w-full border border-border p-2 focus:border-accent outline-none"
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setIsColModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-bold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddColumn}
                className="px-4 py-2 bg-primary text-white font-bold hover:bg-secondary"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
