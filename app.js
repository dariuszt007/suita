const DATA_URL = "./teachers.json";

let teachers = [];
let filteredTeachers = [];

const teacherTableBody = document.getElementById("teacherTableBody");
const jsonOutput = document.getElementById("jsonOutput");

const reloadBtn = document.getElementById("reloadBtn");
const exportBtn = document.getElementById("exportBtn");
const copyBtn = document.getElementById("copyBtn");
const addBtn = document.getElementById("addBtn");
const csvFile = document.getElementById("csvFile");

const filterSchool = document.getElementById("filterSchool");
const filterGrade = document.getElementById("filterGrade");
const filterClass = document.getElementById("filterClass");
const filterOther = document.getElementById("filterOther");
const filterName = document.getElementById("filterName");

const teacherDialog = document.getElementById("teacherDialog");
const teacherForm = document.getElementById("teacherForm");
const dialogTitle = document.getElementById("dialogTitle");
const cancelBtn = document.getElementById("cancelBtn");

const teacherId = document.getElementById("teacherId");
const email = document.getElementById("email");
const nameField = document.getElementById("name");
const schoolName = document.getElementById("schoolName");
const grade = document.getElementById("grade");
const className = document.getElementById("className");
const other = document.getElementById("other");
const role = document.getElementById("role");

async function loadTeachers() {
  try {
    const res = await fetch(DATA_URL + "?t=" + Date.now());
    if (!res.ok) throw new Error("Nie udało się wczytać teachers.json");
    teachers = await res.json();
    if (!Array.isArray(teachers)) teachers = [];
    applyFilters();
  } catch (err) {
    alert(err.message);
  }
}

function syncJsonEditor() {
  jsonOutput.value = JSON.stringify(teachers, null, 2);
}

function applyFilters() {
  const schoolVal = filterSchool.value.trim().toLowerCase();
  const gradeVal = filterGrade.value.trim().toLowerCase();
  const classVal = filterClass.value.trim().toLowerCase();
  const otherVal = filterOther.value.trim().toLowerCase();
  const nameVal = filterName.value.trim().toLowerCase();

  filteredTeachers = teachers.filter(t => {
    return (
      String(t.schoolName || "").toLowerCase().includes(schoolVal) &&
      String(t.grade || "").toLowerCase().includes(gradeVal) &&
      String(t.className || "").toLowerCase().includes(classVal) &&
      String(t.other || "").toLowerCase().includes(otherVal) &&
      String(t.name || "").toLowerCase().includes(nameVal)
    );
  });

  renderTable();
  syncJsonEditor();
}

function renderTable() {
  teacherTableBody.innerHTML = "";

  filteredTeachers.forEach(t => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(t.email || "")}</td>
      <td>${escapeHtml(t.name || "")}</td>
      <td>${escapeHtml(t.schoolName || "")}</td>
      <td>${escapeHtml(t.grade || "")}</td>
      <td>${escapeHtml(t.className || "")}</td>
      <td>${escapeHtml(t.other || "")}</td>
      <td>${escapeHtml(t.role || "")}</td>
      <td>
        <button class="action-btn" data-edit="${t.id}">Edytuj</button>
        <button class="action-btn delete-btn" data-delete="${t.id}">Usuń</button>
      </td>
    `;

    teacherTableBody.appendChild(tr);
  });

  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openEditDialog(btn.dataset.edit));
  });

  document.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => deleteTeacher(btn.dataset.delete));
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openAddDialog() {
  dialogTitle.textContent = "Dodaj nauczyciela";
  teacherId.value = "";
  email.value = "";
  nameField.value = "";
  schoolName.value = "";
  grade.value = "";
  className.value = "";
  other.value = "";
  role.value = "";
  teacherDialog.showModal();
}

function openEditDialog(id) {
  const t = teachers.find(x => String(x.id) === String(id));
  if (!t) return;

  dialogTitle.textContent = "Edytuj nauczyciela";
  teacherId.value = t.id || "";
  email.value = t.email || "";
  nameField.value = t.name || "";
  schoolName.value = t.schoolName || "";
  grade.value = t.grade || "";
  className.value = t.className || "";
  other.value = t.other || "";
  role.value = t.role || "";
  teacherDialog.showModal();
}

function deleteTeacher(id) {
  if (!confirm("Na pewno usunąć ten wpis?")) return;
  teachers = teachers.filter(t => String(t.id) !== String(id));
  applyFilters();
}

teacherForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const payload = {
    id: teacherId.value || crypto.randomUUID(),
    email: email.value.trim(),
    name: nameField.value.trim(),
    schoolName: schoolName.value.trim(),
    grade: grade.value.trim(),
    className: className.value.trim(),
    other: other.value.trim(),
    role: role.value.trim()
  };

  const index = teachers.findIndex(t => String(t.id) === String(payload.id));

  if (index >= 0) {
    teachers[index] = payload;
  } else {
    teachers.push(payload);
  }

  teacherDialog.close();
  applyFilters();
});

cancelBtn.addEventListener("click", () => teacherDialog.close());
addBtn.addEventListener("click", openAddDialog);
reloadBtn.addEventListener("click", loadTeachers);

[filterSchool, filterGrade, filterClass, filterOther, filterName].forEach(input => {
  input.addEventListener("input", applyFilters);
});

exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(teachers, null, 2)], {
    type: "application/json"
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "teachers.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(teachers, null, 2));
    alert("JSON skopiowany do schowka.");
  } catch {
    alert("Nie udało się skopiować. Skopiuj ręcznie z pola poniżej.");
  }
});

jsonOutput.addEventListener("change", () => {
  try {
    const parsed = JSON.parse(jsonOutput.value);
    if (!Array.isArray(parsed)) throw new Error();
    teachers = parsed;
    applyFilters();
  } catch {
    alert("Niepoprawny JSON.");
    syncJsonEditor();
  }
});

csvFile.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const text = await file.text();
  const rows = parseCSV(text);

  teachers = rows.map((row, index) => ({
    id: row.id || crypto.randomUUID() || String(index + 1),
    email: row.email || row.lgate || "",
    name: row.name || row["名前"] || "",
    schoolName: row.schoolName || row["学校名"] || "",
    grade: row.grade || row["年"] || "",
    className: row.className || row["組"] || "",
    other: row.other || row["他の"] || "",
    role: row.role || ""
  }));

  applyFilters();
  e.target.value = "";
});

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];

  const headers = splitCSVLine(lines[0]).map(h => h.trim());

  return lines.slice(1).filter(Boolean).map(line => {
    const values = splitCSVLine(line);
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = (values[i] || "").trim();
    });
    return obj;
  });
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

loadTeachers();
