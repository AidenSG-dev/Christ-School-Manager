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
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({ "Term 1": true, "Term 2": false });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState<{ term: string; category: string } | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");

  const terms = ["Term 1", "Term 2"];
  const categories = ["Class Tests", "FA Tests", "Term Tests"];

  const handleAssignClass = () => {
    if (modalContext && selectedClassId) {
      const assignment = { term: modalContext.term, category: modalContext.category, classId: selectedClassId };
      const exists = assignedClasses.find(
        a => a.term === assignment.term && a.category === assignment.category && a.classId === assignment.classId
      );
      if (!exists) setAssignedClasses([...assignedClasses, assignment]);
      setIsModalOpen(false);
    }
  };

  const getAssignedFor = (term: string, category: string) =>
    assignedClasses.filter(a => a.term === term && a.category === category);

  const getClassName = (id: string) => {
    const c = classes.find(c => c.id === id);
    return c ? `${c.name} – ${c.section}` : id;
  };

  const toggleTerm = (term: string) =>
    setExpandedTerms(prev => ({ ...prev, [term]: !prev[term] }));

  const marksTableKey = activeSelection
    ? `${activeSelection.term}_${activeSelection.category}_${activeSelection.classId}`
    : null;

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-[30%] bg-white border-r border-border h-full absolute md:relative z-20 shrink-0`}
      >
        {/* Sidebar header — h-14 to match table control row */}
        <div className="h-14 px-4 border-b border-border bg-gray-50 flex items-center shrink-0">
          <h2 className="font-bold text-secondary tracking-wide text-sm">MARKS CATEGORIES</h2>
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {terms.map(term => (
            <div key={term} className="border border-border">
              <button
                onClick={() => toggleTerm(term)}
                className="w-full bg-primary text-white font-bold p-2 text-sm text-left flex justify-between items-center hover:bg-secondary transition-colors"
              >
                <span>{term}</span>
                <span className="text-blue-200">{expandedTerms[term] ? "▲" : "▼"}</span>
              </button>
              {expandedTerms[term] && (
                <div className="p-2 space-y-3">
                  {categories.map(category => (
                    <div key={category} className="pl-2 border-l-2 border-blue-100">
                      <div className="font-bold text-xs text-secondary mb-1 uppercase tracking-wide">{category}</div>
                      <div className="space-y-0.5">
                        {getAssignedFor(term, category).map(assigned => {
                          const isSelected =
                            activeSelection?.term === term &&
                            activeSelection?.category === category &&
                            activeSelection?.classId === assigned.classId;
                          return (
                            <button
                              key={assigned.classId}
                              onClick={() => {
                                setActiveSelection(assigned);
                                setSidebarOpen(false);
                              }}
                              className={`w-full text-left px-2 py-1.5 text-sm font-semibold transition-colors border-l-4 ${
                                isSelected
                                  ? 'bg-blue-50 text-primary border-l-primary'
                                  : 'bg-gray-50 hover:bg-gray-100 border-l-transparent text-gray-700'
                              }`}
                            >
                              Class {getClassName(assigned.classId)}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => {
                            setModalContext({ term, category });
                            setSelectedClassId(classes[0]?.id || "");
                            setIsModalOpen(true);
                          }}
                          className="w-full text-left px-2 py-1 text-xs font-bold text-primary hover:underline mt-0.5"
                        >
                          + Add Class to Category
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {activeSelection && marksTableKey ? (
          <MarksTable
            key={marksTableKey}
            selection={activeSelection}
            academicYear={academicYear}
            className={getClassName(activeSelection.classId)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a class category from the sidebar to enter marks.
          </div>
        )}
      </div>

      {/* Add Class to Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 shadow-xl w-80 border-t-4 border-primary">
            <h3 className="font-bold text-lg mb-1">Add Class to Category</h3>
            <p className="text-sm text-gray-500 mb-4">
              {modalContext?.term} › {modalContext?.category}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Select Class</label>
                {classes.length > 0 ? (
                  <select
                    className="w-full border border-border p-2 focus:border-accent outline-none bg-white"
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>Class {c.name} – {c.section}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-red-600 text-sm font-bold bg-red-50 p-2 border border-red-200">
                    No classes found. Add them in Student Info first.
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignClass}
                  disabled={classes.length === 0}
                  className="px-4 py-2 bg-primary text-white font-bold hover:bg-secondary disabled:opacity-40"
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
