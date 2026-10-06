const DATA_URL = "./teachers.json";

let teachers = [];
let filteredTeachers = [];

const teacherTableBody = document.getElementById("teacherTableBody");
const jsonOutput = document.getElementById("jsonOutput");

const reloadBtn = document.getElementById("reloadBtn");
const exportBtn = document.getElementById("exportBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const copyBtn = document.getElementById("copyBtn");
const addBtn = document.getElementById("addBtn");
const csvFile = document.getElementById("csvFile");
const downloadSampleCsvBtn = document.getElementById("downloadSampleCsvBtn");

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
    const res = await fetch(DATA_URL + "?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("Nie udało się wczytać teachers.json");
    const data = await res.json();
    teachers = Array.isArray(data) ? normalizeTeachers(data) : [];
    populateFilterOptionsFromCurrentTeachers();
    applyFilters();
  } catch (err) {
    alert(err.message);
  }
}

function normalizeTeachers(data) {
  return data.map((row, index) => ({
    id: row.id || safeId(index),
    email: row.email || row.lgate || "",
    name: row.name || row["名前"] || "",
    schoolName: row.schoolName || row["学校名"] || "",
    grade: row.grade || row["年"] || "",
    className: row.className || row["組"] || row.group || "",
    other: row.other || row["他の"] || "",
    role: row.role || ""
  }));
}

function safeId(index = 0) {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "id_" + Date.now() + "_" + index;
}

function syncJsonEditor() {
  jsonOutput.value = JSON.stringify(teachers, null, 2);
}

function populateFilterOptionsFromCurrentTeachers() {
  fillSelect(filterSchool, "学校名 / wszystkie szkoły", uniqueValues(teachers, "schoolName"));
  fillSelect(filterGrade, "年 / wszystkie", uniqueValues(teachers, "grade"));
  fillSelect(filterClass, "組 / wszystkie", uniqueValues(teachers, "className"));
  fillSelect(filterOther, "他の / wszystkie", uniqueValues(teachers, "other"));
}

function uniqueValues(data, key) {
  return [...new Set(
    data
      .map(item => String(item[key] || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "ja"));
}

function fillSelect(selectEl, defaultLabel, values) {
  const currentValue = selectEl.value;
  selectEl.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = defaultLabel;
  selectEl.appendChild(defaultOption);

  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectEl.appendChild(option);
  });

  if (values.includes(currentValue)) {
    selectEl.value = currentValue;
  } else {
    selectEl.value = "";
  }
}

function applyFilters() {
  const schoolVal = filterSchool.value.trim().toLowerCase();
  const gradeVal = filterGrade.value.trim().toLowerCase();
  const classVal = filterClass.value.trim().toLowerCase();
  const otherVal = filterOther.value.trim().toLowerCase();
  const nameVal = filterName.value.trim().toLowerCase();

  filteredTeachers = teachers.filter(t => {
    const schoolMatch = !schoolVal || String(t.schoolName || "").toLowerCase() === schoolVal;
    const gradeMatch = !gradeVal || String(t.grade || "").toLowerCase() === gradeVal;
    const classMatch = !classVal || String(t.className || "").toLowerCase() === classVal;
    const otherMatch = !otherVal || String(t.other || "").toLowerCase() === otherVal;
    const nameMatch =
      String(t.name || "").toLowerCase().includes(nameVal) ||
      String(t.email || "").toLowerCase().includes(nameVal);

    return schoolMatch && gradeMatch && classMatch && otherMatch && nameMatch;
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
        <button type="button" class="action-btn" data-edit="${t.id}">Edytuj</button>
        <button type="button" class="action-btn delete-btn" data-delete="${t.id}">Usuń</button>
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
  return String(str || "")
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
  populateFilterOptionsFromCurrentTeachers();
  applyFilters();
}

teacherForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const payload = {
    id: teacherId.value || safeId(),
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
  populateFilterOptionsFromCurrentTeachers();
  applyFilters();
});

cancelBtn.addEventListener("click", () => teacherDialog.close());
addBtn.addEventListener("click", openAddDialog);
reloadBtn.addEventListener("click", loadTeachers);

[filterSchool, filterGrade, filterClass, filterOther].forEach(select => {
  select.addEventListener("change", applyFilters);
});

filterName.addEventListener("input", applyFilters);

exportBtn.addEventListener("click", () => {
  downloadTextFile("teachers.json", JSON.stringify(teachers, null, 2), "application/json");
});

exportCsvBtn.addEventListener("click", () => {
  const csv = toCSV(teachers);
  downloadTextFile("teachers.csv", csv, "text/csv;charset=utf-8");
});

downloadSampleCsvBtn.addEventListener("click", () => {
  const sampleRows = [
    ["email", "name", "schoolName", "grade", "className", "other", "role"],
    ["fujiwara758@o365.suita.ed.jp", "藤原 光矢", "第一小学校", "3", "1", "支援", "担任"],
    ["aoyama090@o365.suita.ed.jp", "青山 正道", "第一小学校", "3", "2", "", "副担任"],
    ["ruh302@o365.suita.ed.jp", "安食 葵", "第二小学校", "2", "1", "他校兼務", ""]
  ];

  const csv = "\uFEFF" + sampleRows.map(row => row.map(csvEscape).join(",")).join("\n");
  downloadTextFile("sample_teachers.csv", csv, "text/csv;charset=utf-8");
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
    teachers = normalizeTeachers(parsed);
    populateFilterOptionsFromCurrentTeachers();
    applyFilters();
  } catch {
    alert("Niepoprawny JSON.");
    syncJsonEditor();
  }
});

csvFile.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const rows = parseCSV(text);

    teachers = rows.map((row, index) => ({
      id: row.id || safeId(index),
      email: row.email || row.lgate || "",
      name: row.name || row["名前"] || "",
      schoolName: row.schoolName || row["学校名"] || "",
      grade: row.grade || row["年"] || "",
      className: row.className || row["組"] || row.group || "",
      other: row.other || row["他の"] || "",
      role: row.role || ""
    }));

    populateFilterOptionsFromCurrentTeachers();
    applyFilters();
    alert("CSV został zaimportowany.");
  } catch (err) {
    alert("Nie udało się odczytać CSV.");
  }

  e.target.value = "";
});

function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const headers = splitCSVLine(lines[0]).map(h => h.trim());

  return lines.slice(1).map(line => {
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

function csvEscape(value) {
  const str = String(value ?? "");
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function toCSV(data) {
  const headers = ["email", "name", "schoolName", "grade", "className", "other", "role"];
  const rows = [
    headers,
    ...data.map(item => headers.map(h => item[h] ?? ""))
  ];

  return "\uFEFF" + rows.map(row => row.map(csvEscape).join(",")).join("\n");
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

loadTeachers();
