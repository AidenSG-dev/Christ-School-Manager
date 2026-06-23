# Custom School Management System

A high-performance, full-stack enterprise dashboard built specifically for educators to streamline classroom administration, student profiling, and academic grading metrics. 

Unlike basic prototypes that rely on volatile local browser storage, this platform features a robust relational database infrastructure, a multi-term "cross-intelligence" grading engine, and fluid, spreadsheet-style keyboard interactions engineered for rapid, real-time data entry.

---

## 💎 Core Highlights

### 🎨 Sharp, High-Contrast Interface
* **Bold Aesthetic:** Designed with a clean, low-rounding geometric layout (no soft, fully rounded Web 2.0 components) to maintain a highly professional, enterprise software feel.
* **Responsive Command Center:** A 30% width nested directory that seamlessly collapses into a compact toggle overlay (`☰`) on smaller displays or when horizontal data matrices expand.
* **Context-Aware Highlights:** Selected states, active tabs, and focused grid inputs are strictly indicated using sharp, light-blue accent border rings rather than fuzzy shadows.

### 🏢 Architecture & Workflow Logic
* **Academic Year Lock:** A global security gatekeeper dropdown that scopes all local data fetches, configurations, and operations to a selected academic calendar loop.
* **Dynamic Student Directory:** Allows teachers to instantly batch-generate empty rosters based on an intake quantity query (e.g., creating 22 empty entries instantly) and append custom tracking parameters on the fly via a flexible database layer.
* **Cross-Intelligence Marks Registry:** Automatically pulls and populates student identification records directly from the Student Info roster. Features a **Dual-Ledger Matrix**:
  * **Numeric Ledger:** Accepts direct test inputs (0–100) and displays a live rolling average.
  * **Automated Grade Ledger:** A read-only mirror table that dynamically parses the numeric ledger against a customizable grading key to generate real-time color-coded alpha badges.

### ⌨️ Fluent Spreadsheet Keyboard Engine
Features specialized keypress listeners that mimic software like Microsoft Excel or Airtable, allowing teachers to blitz through report card entries completely hands-free from the mouse:
* `ArrowRight (→)` or `Tab` — Jumps cursor focus immediately to the next cell to the right.
* `ArrowLeft (←)` or `Shift + Tab` — Jumps focus to the previous cell to the left.
* `ArrowDown (↓)` & `ArrowUp (↑)` — Shifts cursor directly to the corresponding input box in the row below or above.

---

## 🛠️ Tech Stack

* **Frontend Environment:** Next.js (React)
* **Styling Framework:** Tailwind CSS
* **Database & BaaS Backend:** Supabase (PostgreSQL relational architecture)
* **Hosting Pipeline:** Vercel (CI/CD via connected GitHub repository)

---

## 🗄️ Relational Database Blueprint (SQL)

The system maintains strict data integrity using structured SQL constraints and automated cascading deletes:

```sql
-- Scopes the entire database states to specific academic cycles
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_label VARCHAR(9) UNIQUE NOT NULL
);

-- Handles unique class and section configurations per year
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    roman_numeral VARCHAR(4) NOT NULL,
    section VARCHAR(1) NOT NULL,
    UNIQUE(academic_year_id, roman_numeral, section)
);

-- Houses the master student registry (Student Info Tab)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    roll_number VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    student_id_number VARCHAR(50) UNIQUE NOT NULL,
    birth_date DATE,
    address TEXT,
    parent_number VARCHAR(20),
    custom_attributes JSONB DEFAULT '{}'::jsonb  -- Dynamically maps custom added columns
);

-- Sets up the test matrices per term segment
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    term_name VARCHAR(10) NOT NULL,
    type_name VARCHAR(20) NOT NULL,
    test_count INT NOT NULL DEFAULT 0,
    UNIQUE(class_id, term_name, type_name)
);

-- Syncs test scores directly back to relational student rows
CREATE TABLE marks_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    scores INT[] NOT NULL DEFAULT '{}',
    UNIQUE(assessment_id, student_id)
);
