const DATA_URL = "./teachers.json";
const STORAGE_KEY = "teachers_local_cache_v2";

let teachers = [];
let filteredTeachers = [];
let sortState = { key: "name", direction: "asc" };
let lastLoadedFrom = "GitHub";

const teacherTableBody = document.getElementById("teacherTableBody");
const cardList = document.getElementById("cardList");
const jsonOutput = document.getElementById("jsonOutput");
const recordCount = document.getElementById("recordCount");
const dataStatus = document.getElementById("dataStatus");

const reloadBtn = document.getElementById("reloadBtn");
const restoreGithubBtn = document.getElementById("restoreGithubBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const copyJsonBtn = document.getElementById("copyJsonBtn");
const addBtn = document.getElementById("addBtn");
const csvFile = document.getElementById("csvFile");
const downloadSampleCsvBtn = document.getElementById("downloadSampleCsvBtn");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const applyJsonBtn = document.getElementById("applyJsonBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");

const filterSchool = document.getElementById("filterSchool");
const filterGrade = document.getElementById("filterGrade");
const filterClass = document.getElementById("filterClass");
const filterOther = document.getElementById("filterOther");
const filterName = document.getElementById("filterName");
const filterEmail = document.getElementById("filterEmail");

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

async function loadTeachersFromGithub() {
  const res = await fetch(DATA_URL + "?t=" + Date.now());
  if (!res.ok) throw new Error("Nie udało się wczytać teachers.json z GitHub.");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("teachers.json musi zawierać tablicę.");
  teachers = normalizeTeacherArray(data);
  lastLoadedFrom = "GitHub";
  saveToLocal();
  applyFilters();
}

function loadFromLocalIfExists() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return false;
    teachers = normalizeTeacherArray(parsed);
    lastLoadedFrom = "Pamięć lokalna";
    applyFilters();
    return true;
  } catch {
    return false;
  }
}

function saveToLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teachers));
}

function normalizeTeacherArray(arr) {
  return arr.map((item, index) => ({
    id: item.id || safeUuid(index),
    email: item.email || item.lgate || "",
    name: item.name || item["名前"] || "",
    schoolName: item.schoolName || item["学校名"] || "",
    grade: item.grade || item["年"] || "",
    className: item.className || item["組"] || item.group || "",
    other: item.other || item["他の"] || "",
    role: item.role || ""
  }));
}

function safeUuid(index = 0) {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Date.now() + "_" + index;
}

function syncJsonEditor() {
  jsonOutput.value = JSON.stringify(teachers, null, 2);
}

function updateStatus() {
  recordCount.textContent = `Rekordy: ${filteredTeachers.length} / ${teachers.length}`;
  dataStatus.textContent = `Źródło: ${lastLoadedFrom}`;
}

function applyFilters() {
  const schoolVal = filterSchool.value.trim().toLowerCase();
  const gradeVal = filterGrade.value.trim().toLowerCase();
  const classVal = filterClass.value.trim().toLowerCase();
  const otherVal = filterOther.value.trim().toLowerCase();
  const nameVal = filterName.value.trim().toLowerCase();
  const emailVal = filterEmail.value.trim().toLowerCase();

  filteredTeachers = teachers.filter(t => {
    return (
      String(t.schoolName).toLowerCase().includes(schoolVal) &&
      String(t.grade).toLowerCase().includes(gradeVal) &&
      String(t.className).toLowerCase().includes(classVal) &&
      String(t.other).toLowerCase().includes(otherVal) &&
      String(t.name).toLowerCase().includes(nameVal) &&
      String(t.email).toLowerCase().includes(emailVal)
    );
  });

  sortTeachers();
  renderTable();
  renderCards();
  syncJsonEditor();
  updateStatus();
}

function sortTeachers() {
  const { key, direction } = sortState;
  filteredTeachers.sort((a, b) => {
    const av = String(a[key] ?? "").toLowerCase();
    const bv = String(b[key] ?? "").toLowerCase();

    if (!isNaN(av) && !isNaN(bv)) {
      return direction === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    }

    return direction === "asc"
      ? av.localeCompare(bv, "ja")
      : bv.localeCompare(av, "ja");
  });
}

function renderTable() {
  teacherTableBody.innerHTML = "";

  filteredTeachers.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(t.email)}</td>
      <td>${escapeHtml(t.name)}</td>
      <td>${escapeHtml(t.schoolName)}</td>
      <td>${escapeHtml(t.grade)}</td>
      <td>${escapeHtml(t.className)}</td>
      <td>${escapeHtml(t.other)}</td>
      <td>${escapeHtml(t.role)}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="small-edit" data-edit="${t.id}">Edytuj</button>
          <button type="button" class="small-delete" data-delete="${t.id}">Usuń</button>
        </div>
      </td>
    `;
    teacherTableBody.appendChild(tr);
  });

  bindRowButtons();
}

function renderCards() {
  cardList.innerHTML = "";

  filteredTeachers.forEach(t => {
    const card = document.createElement("div");
    card.className = "teacher-card";
    card.innerHTML = `
      <div class="card-name">${escapeHtml(t.name || "(brak imienia)")}</div>
      <div class="card-grid">
        <div><strong>Email:</strong> ${escapeHtml(t.email)}</div>
        <div><strong>学校名:</strong> ${escapeHtml(t.schoolName)}</div>
        <div><strong>年:</strong> ${escapeHtml(t.grade)}</div>
        <div><strong>組:</strong> ${escapeHtml(t.className)}</div>
        <div><strong>他の:</strong> ${escapeHtml(t.other)}</div>
        <div><strong>Role:</strong> ${escapeHtml(t.role)}</div>
      </div>
      <div class="card-actions">
        <button type="button" class="small-edit" data-edit="${t.id}">Edytuj</button>
        <button type="button" class="small-delete" data-delete="${t.id}">Usuń</button>
      </div>
    `;
    cardList.appendChild(card);
  });

  bindRowButtons();
}

function bindRowButtons() {
  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => openEditDialog(btn.dataset.edit);
  });

  document.querySelectorAll("[data-delete]").forEach(btn => {
    btn.onclick = () => deleteTeacher(btn.dataset.delete);
  });
}

function escapeHtml(str) {
  return String(str ?? "")
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
  teacherId.value = t.id;
  email.value = t.email;
  nameField.value = t.name;
  schoolName.value = t.schoolName;
  grade.value = t.grade;
  className.value = t.className;
  other.value = t.other;
  role.value = t.role;

  teacherDialog.showModal();
}

function deleteTeacher(id) {
  if (!confirm("Na pewno usunąć ten wpis?")) return;
  teachers = teachers.filter(t => String(t.id) !== String(id));
  lastLoadedFrom = "Pamięć lokalna / edycja";
  saveToLocal();
  applyFilters();
}

teacherForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const payload = {
    id: teacherId.value || safeUuid(),
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

  lastLoadedFrom = "Pamięć lokalna / edycja";
  saveToLocal();
  teacherDialog.close();
  applyFilters();
});

cancelBtn.addEventListener("click", () => teacherDialog.close());
addBtn.addEventListener("click", openAddDialog);

reloadBtn.addEventListener("click", async () => {
  try {
    await loadTeachersFromGithub();
    alert("Dane odświeżone z GitHub.");
  } catch (err) {
    alert(err.message);
  }
});

restoreGithubBtn.addEventListener("click", async () => {
  if (!confirm("To nadpisze lokalne zmiany danymi z GitHub. Kontynuować?")) return;
  try {
    await loadTeachersFromGithub();
    alert("Przywrócono dane z GitHub.");
  } catch (err) {
    alert(err.message);
  }
});

[filterSchool, filterGrade, filterClass, filterOther, filterName, filterEmail].forEach(input => {
  input.addEventListener("input", applyFilters);
});

clearFiltersBtn.addEventListener("click", () => {
  filterSchool.value = "";
  filterGrade.value = "";
  filterClass.value = "";
  filterOther.value = "";
  filterName.value = "";
  filterEmail.value = "";
  applyFilters();
});

exportJsonBtn.addEventListener("click", () => {
  downloadFile("teachers.json", JSON.stringify(teachers, null, 2), "application/json");
});

copyJsonBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(teachers, null, 2));
    alert("JSON skopiowany do schowka.");
  } catch {
    alert("Nie udało się skopiować automatycznie. Skopiuj ręcznie z pola JSON.");
  }
});

exportCsvBtn.addEventListener("click", () => {
  const csv = toCSV(teachers);
  downloadFile("teachers.csv", csv, "text/csv;charset=utf-8;");
});

downloadSampleCsvBtn.addEventListener("click", () => {
  const sample = [
    ["email", "name", "schoolName", "grade", "className", "other", "role"],
    ["fujiwara758@o365.suita.ed.jp", "藤原 光矢", "第一小学校", "3", "1", "支援", "担任"],
    ["aoyama090@o365.suita.ed.jp", "青山 正道", "第一小学校", "3", "2", "", "副担任"],
    ["ruh302@o365.suita.ed.jp", "安食 葵", "第二小学校", "2", "1", "他校兼務", ""]
  ].map(row => row.map(csvEscape).join(",")).join("\n");

  downloadFile("sample_teachers.csv", sample, "text/csv;charset=utf-8;");
});

applyJsonBtn.addEventListener("click", () => {
  try {
    const parsed = JSON.parse(jsonOutput.value);
    if (!Array.isArray(parsed)) throw new Error();
    teachers = normalizeTeacherArray(parsed);
    lastLoadedFrom = "Pamięć lokalna / JSON";
    saveToLocal();
    applyFilters();
    alert("Wczytano JSON z pola.");
  } catch {
    alert("Niepoprawny JSON. Oczekiwana jest tablica rekordów.");
  }
});

csvFile.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const rows = parseCSV(text);

    teachers = rows.map((row, index) => ({
      id: row.id || safeUuid(index),
      email: pick(row, ["email", "lgate", "igate"]),
      name: pick(row, ["name", "名前"]),
      schoolName: pick(row, ["schoolName", "学校名"]),
      grade: pick(row, ["grade", "年"]),
      className: pick(row, ["className", "組", "group"]),
      other: pick(row, ["other", "他の"]),
      role: pick(row, ["role"])
    }));

    lastLoadedFrom = "Pamięć lokalna / CSV import";
    saveToLocal();
    applyFilters();
    alert("Zaimportowano CSV.");
  } catch {
    alert("Nie udało się odczytać CSV.");
  }

  e.target.value = "";
});

fullscreenBtn.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch {
    alert("Pełny ekran nie jest dostępny w tej przeglądarce.");
  }
});

document.querySelectorAll(".sort-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.sort;
    if (sortState.key === key) {
      sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
    } else {
      sortState.key = key;
      sortState.direction = "asc";
    }
    applyFilters();
  });
});

function pick(obj, keys) {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== "") {
      return String(obj[key]).trim();
    }
  }
  return "";
}

function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim() !== "");
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

function toCSV(items) {
  const headers = ["email", "name", "schoolName", "grade", "className", "other", "role"];
  const rows = [
    headers.join(","),
    ...items.map(item =>
      headers.map(h => csvEscape(item[h] ?? "")).join(",")
    )
  ];
  return "\uFEFF" + rows.join("\n");
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function init() {
  const hasLocal = loadFromLocalIfExists();

  try {
    await loadTeachersFromGithub();
  } catch (err) {
    if (!hasLocal) {
      alert(err.message);
      teachers = [];
      applyFilters();
    }
  }
}

init();
