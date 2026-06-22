import React, { useContext, useState } from "react";
import { AppContext } from "../../App";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { ClassInfo } from "../../types";
import { MarksTable } from "./MarksTable";

interface MarksRegistryProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface AssignedClass {
  term: string;
  category: string;
  classId: string;
}

export const MarksRegistry: React.FC<MarksRegistryProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { academicYear } = useContext(AppContext);
  const [classes] = useLocalStorage<ClassInfo[]>(`christSchool_${academicYear}_classes`, []);
  const [assignedClasses, setAssignedClasses] = useLocalStorage<AssignedClass[]>(`christSchool_${academicYear}_assigned_classes`, []);
  
  const [activeSelection, setActiveSelection] = useState<AssignedClass | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState<{term: string, category: string} | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");

  const terms = ["Term 1", "Term 2"];
  const categories = ["Class Tests", "FA Tests", "Term Tests"];

  const handleAssignClass = () => {
    if (modalContext && selectedClassId) {
      const assignment = { term: modalContext.term, category: modalContext.category, classId: selectedClassId };
      const exists = assignedClasses.find(a => 
        a.term === assignment.term && 
        a.category === assignment.category && 
        a.classId === assignment.classId
      );
      if (!exists) {
        setAssignedClasses([...assignedClasses, assignment]);
      }
      setIsModalOpen(false);
    }
  };

  const getAssignedFor = (term: string, category: string) => {
    return assignedClasses.filter(a => a.term === term && a.category === category);
  };

  const getClassName = (id: string) => classes.find(c => c.id === id)?.name + " " + classes.find(c => c.id === id)?.section;

  return (
    <div className="flex w-full h-full">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-[30%] bg-white border-r border-border flex flex-col h-full absolute md:relative z-10 overflow-y-auto`}>
        <div className="p-4 border-b border-border bg-gray-50">
          <h2 className="font-bold text-secondary">MARKS CATEGORIES</h2>
        </div>
        
        <div className="p-2 space-y-4">
          {terms.map(term => (
            <div key={term} className="border border-border">
              <div className="bg-primary text-white font-bold p-2 text-sm">{term}</div>
              <div className="p-2 space-y-3">
                {categories.map(category => (
                  <div key={category} className="pl-2 border-l-2 border-gray-200">
                    <div className="font-bold text-sm text-gray-700 mb-1">{category}</div>
                    <div className="space-y-1">
                      {getAssignedFor(term, category).map(assigned => {
                        const isSelected = activeSelection?.term === term && 
                                          activeSelection?.category === category && 
                                          activeSelection?.classId === assigned.classId;
                        return (
                          <button
                            key={assigned.classId}
                            onClick={() => {
                              setActiveSelection(assigned);
                              setSidebarOpen(false);
                            }}
                            className={`w-full text-left px-2 py-1 text-sm font-semibold transition-colors ${
                              isSelected ? 'bg-blue-50 text-primary border border-accent' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                            }`}
                          >
                            {getClassName(assigned.classId)}
                          </button>
                        );
                      })}
                      <button 
                        onClick={() => {
                          setModalContext({term, category});
                          setSelectedClassId(classes[0]?.id || "");
                          setIsModalOpen(true);
                        }}
                        className="w-full text-left px-2 py-1 text-xs font-bold text-accent hover:underline mt-1"
                      >
                        + Add Class to Category
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="w-full md:w-[70%] h-full flex flex-col bg-gray-50 overflow-hidden">
        {activeSelection ? (
          <MarksTable 
            selection={activeSelection} 
            academicYear={academicYear} 
            className={getClassName(activeSelection.classId)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a class category from the sidebar to enter marks.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 shadow-xl w-80 border-t-4 border-primary">
            <h3 className="font-bold text-lg mb-4">Add Class to {modalContext?.category}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Select Class</label>
                {classes.length > 0 ? (
                  <select 
                    className="w-full border border-border p-2 focus:border-accent outline-none bg-white"
                    value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}
                  >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                  </select>
                ) : (
                  <div className="text-red-500 text-sm font-bold">No classes exist. Add them in Student Info first.</div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssignClass}
                  disabled={classes.length === 0}
                  className="px-4 py-2 bg-primary text-white font-bold hover:bg-secondary disabled:opacity-50"
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
