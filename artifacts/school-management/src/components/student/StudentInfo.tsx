import React, { useState, useContext } from "react";
import { AppContext } from "../../App";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { ClassInfo } from "../../types";
import { StudentTable } from "./StudentTable";

interface StudentInfoProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const StudentInfo: React.FC<StudentInfoProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { academicYear } = useContext(AppContext);
  const [classes, setClasses] = useLocalStorage<ClassInfo[]>(`christSchool_${academicYear}_classes`, []);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClass, setNewClass] = useState("I");
  const [newSection, setNewSection] = useState("A");

  const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const sections = ["A", "B", "C", "D"];

  const handleAddClass = () => {
    const id = `${newClass}-${newSection}`;
    if (!classes.find(c => c.id === id)) {
      setClasses([...classes, { id, name: newClass, section: newSection }]);
    }
    setIsModalOpen(false);
  };

  const activeClass = classes.find(c => c.id === activeClassId);

  return (
    <div className="flex w-full h-full">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-[30%] bg-white border-r border-border flex flex-col h-full absolute md:relative z-10`}>
        <div className="p-4 border-b border-border bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-secondary">CLASSES</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-2 py-1 text-sm font-bold rounded-sm hover:bg-secondary"
          >
            + Add New Class
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setActiveClassId(c.id);
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 font-semibold transition-colors ${
                activeClassId === c.id 
                  ? 'bg-blue-50 border-l-4 border-accent text-primary' 
                  : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'
              }`}
            >
              {c.name} {c.section}
            </button>
          ))}
          {classes.length === 0 && (
            <div className="text-gray-400 text-sm text-center py-8">No classes added yet.</div>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="w-full md:w-[70%] h-full flex flex-col bg-gray-50 overflow-hidden">
        {activeClass ? (
          <StudentTable activeClass={activeClass} academicYear={academicYear} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a class from the sidebar to view student info.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 shadow-xl w-80 border-t-4 border-primary">
            <h3 className="font-bold text-lg mb-4">Add New Class</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Class</label>
                <select 
                  className="w-full border border-border p-2 focus:border-accent outline-none bg-white"
                  value={newClass} onChange={e => setNewClass(e.target.value)}
                >
                  {romanNumerals.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Section</label>
                <select 
                  className="w-full border border-border p-2 focus:border-accent outline-none bg-white"
                  value={newSection} onChange={e => setNewSection(e.target.value)}
                >
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddClass}
                  className="px-4 py-2 bg-primary text-white font-bold hover:bg-secondary"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
