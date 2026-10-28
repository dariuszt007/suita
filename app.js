const REPO_PATH = "/suita/";
const SITE_URL = "https://dariuszt007.github.io/suita/";

const auth0Config = {
  domain: "dev-zrgy8kuujx18b5rt.us.auth0.com",
  clientId: "5OlwdoLSDfHMJdgO38IINVWJj2cArs12",
  authorizationParams: {
    redirect_uri: SITE_URL
  }
};

let auth0Client;

const MOBILE_WIDTH = 520;

const STORAGE_KEY = `teachersData_${location.host}_${location.pathname}`;
const JSON_SOURCE_URL = "teachers.json";

const SCHOOL_OPTIONS = [
  "J01 第一中学校",
  "J02 第二中学校",
  "J03 第三中学校",
  "J04 第五中学校",
  "J05 第六中学校",
  "J06 片山中学校",
  "J07 佐井寺中学校",
  "J08 南千里中学校",
  "J09 豊津中学校",
  "J10 豊津西中学校",
  "J11 山田中学校",
  "J12 西山田中学校",
  "J13 山田東中学校",
  "J14 千里丘中学校",
  "J15 高野台中学校",
  "J16 青山台中学校",
  "J17 竹見台中学校",
  "J18 古江台中学校",
  "S01 吹田第一小学校",
  "S02 吹田第二小学校",
  "S03 吹田第三小学校",
  "S04 吹田東小学校",
  "S05 吹田南小学校",
  "S06 吹田第六小学校",
  "S07 千里第一小学校",
  "S08 千里第二小学校",
  "S09 千里第三小学校",
  "S10 千里新田小学校",
  "S11 佐井寺小学校",
  "S12 東佐井寺小学校",
  "S13 岸部第一小学校",
  "S14 岸部第二小学校",
  "S15 豊津第一小学校",
  "S16 豊津第二小学校",
  "S17 江坂大池小学校",
  "S18 山手小学校",
  "S19 片山小学校",
  "S20 山田第一小学校",
  "S21 山田第二小学校",
  "S22 山田第三小学校",
  "S23 山田第五小学校",
  "S24 東山田小学校",
  "S25 南山田小学校",
  "S26 西山田小学校",
  "S27 北山田小学校",
  "S28 千里丘北小学校",
  "S29 佐竹台小学校",
  "S30 高野台小学校",
  "S31 津雲台小学校",
  "S32 古江台小学校",
  "S33 藤白台小学校",
  "S34 青山台小学校",
  "S35 桃山台小学校",
  "S36 千里たけみ小学校"
];

const SCHOOL_COLOR_ORDER = [
  0, 9, 18, 27, 36, 45,
  1, 10, 19, 28, 37, 46,
  2, 11, 20, 29, 38, 47,
  3, 12, 21, 30, 39, 48,
  4, 13, 22, 31, 40, 49,
  5, 14, 23, 32, 41, 50,
  6, 15, 24, 33, 42, 51,
  7, 16, 25, 34, 43, 52,
  8, 17, 26, 35, 44, 53
];

const loginScreen = document.getElementById("loginScreen");
const appContent = document.getElementById("appContent");

const loginError = document.getElementById("loginError");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const toolbar = document.getElementById("toolbar");
const toggleToolbarBtn = document.getElementById("toggleToolbarBtn");
const syncStatus = document.getElementById("syncStatus");

const csvFileInput = document.getElementById("csvFile");
const downloadSampleCsvBtn = document.getElementById("downloadSampleCsvBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const copyBtn = document.getElementById("copyBtn");
const reloadJsonBtn = document.getElementById("reloadJsonBtn");
const clearLocalBtn = document.getElementById("clearLocalBtn");
const addBtn = document.getElementById("addBtn");

const filterType = document.getElementById("filterType");
const filterGrade = document.getElementById("filterGrade");
const filterClass = document.getElementById("filterClass");
const filterName = document.getElementById("filterName");

const teacherTableBody = document.getElementById("teacherTableBody");
const jsonOutput = document.getElementById("jsonOutput");

const teacherDialog = document.getElementById("teacherDialog");
const teacherForm = document.getElementById("teacherForm");
const dialogTitle = document.getElementById("dialogTitle");
const cancelBtn = document.getElementById("cancelBtn");

const teacherIdInput = document.getElementById("teacherId");
const emailInput = document.getElementById("email");
const nameInput = document.getElementById("name");
const schoolNameInput = document.getElementById("schoolName");
const gradeInput = document.getElementById("grade");
const classNameInput = document.getElementById("className");
const remarksInput = document.getElementById("remarks");

const tableHead = document.querySelector(".table-wrap thead");

let teachers = [];
let sortState = [];
let draggedTeacherIndex = null;
let justAddedTeacher = null;

function isMobileView() {
  return window.innerWidth <= MOBILE_WIDTH;
}

function setSyncStatus(message, isError = false) {
  if (!syncStatus) return;
  syncStatus.textContent = message;
  syncStatus.style.color = isError ? "#c62828" : "";
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSchoolBadgeClass(schoolName) {
  const index = SCHOOL_OPTIONS.indexOf(String(schoolName ?? "").trim());

  if (index === -1) {
    return "school-color-default";
  }

  const paletteIndex = SCHOOL_COLOR_ORDER[index] ?? index;
  return `school-color-${paletteIndex + 1}`;
}

function updateJsonOutput() {
  if (jsonOutput) {
    jsonOutput.value = JSON.stringify(teachers, null, 2);
  }
}

function saveTeachersToLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teachers));
}

function clearTeachersLocal() {
  localStorage.removeItem(STORAGE_KEY);
}

function loadTeachersFromLocal() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return false;

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      teachers = parsed;
      return true;
    }
  } catch (error) {
    console.error("Błąd odczytu localStorage:", error);
  }

  return false;
}

async function fetchTeachersJson(useCacheBuster = false) {
  const url = useCacheBuster
    ? `${JSON_SOURCE_URL}${JSON_SOURCE_URL.includes("?") ? "&" : "?"}t=${Date.now()}`
    : JSON_SOURCE_URL;

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("teachers.json nie zawiera tablicy");
  }

  return data;
}

async function loadTeachersFromJson() {
  try {
    const data = await fetchTeachersJson(false);
    teachers = data;
    saveTeachersToLocal();
    return true;
  } catch (error) {
    console.error("Błąd wczytywania teachers.json:", error);
    return false;
  }
}

async function reloadTeachersFromJson() {
  try {
    setSyncStatus("Ładowanie danych z JSON...");
    const data = await fetchTeachersJson(true);

    clearTeachersLocal();
    teachers = data;
    sortState = [];
    justAddedTeacher = null;
    saveTeachersToLocal();
    populateFilters();
    updateSortButtons();
    renderTable();

    setSyncStatus("Dane z teachers.json zostały odświeżone.");
    alert("Dane z teachers.json zostały odświeżone.");
  } catch (error) {
    console.error("Błąd odświeżania teachers.json:", error);
    setSyncStatus("Nie udało się odświeżyć danych z JSON.", true);
    alert("Nie udało się odświeżyć danych z teachers.json.");
  }
}

function clearLocalStorageData() {
  const confirmed = window.confirm("Czy na pewno chcesz wyczyścić localStorage dla tej strony?");
  if (!confirmed) return;

  clearTeachersLocal();
  teachers = [];
  sortState = [];
  justAddedTeacher = null;
  populateFilters();
  updateSortButtons();
  renderTable();
  setSyncStatus("Wyczyszczono localStorage.");
  alert("Wyczyszczono localStorage.");
}

function getUniqueSortedValues(key) {
  const values = [...new Set(teachers.map(item => String(item[key] ?? "").trim()).filter(Boolean))];
  return values.sort((a, b) => a.localeCompare(b, "pl", { numeric: true, sensitivity: "base" }));
}

function refillSelect(selectElement, values, defaultLabel) {
  const currentValue = selectElement.value;

  selectElement.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = defaultLabel;
  selectElement.appendChild(defaultOption);

  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectElement.appendChild(option);
  });

  selectElement.value = values.includes(currentValue) ? currentValue : "";
}

function getFilteredValuesForSelect(sourceItems, key) {
  const values = [
    ...new Set(
      sourceItems
        .map(item => String(item[key] ?? "").trim())
        .filter(Boolean)
    )
  ];

  return values.sort((a, b) =>
    a.localeCompare(b, "pl", { numeric: true, sensitivity: "base" })
  );
}

function populateFilters() {
  const selectedSchool = filterType.value;
  const selectedGrade = filterGrade.value;
  const selectedClass = filterClass.value;

  const schoolValues = getFilteredValuesForSelect(teachers, "schoolName");

  const gradeSource = teachers.filter(item => {
    if (selectedSchool && String(item.schoolName ?? "") !== selectedSchool) {
      return false;
    }
    return true;
  });
  const gradeValues = getFilteredValuesForSelect(gradeSource, "grade");

  const classSource = teachers.filter(item => {
    if (selectedSchool && String(item.schoolName ?? "") !== selectedSchool) {
      return false;
    }
    if (selectedGrade && String(item.grade ?? "") !== selectedGrade) {
      return false;
    }
    return true;
  });
  const classValues = getFilteredValuesForSelect(classSource, "className");

  refillSelect(filterType, schoolValues, "学校");
  refillSelect(filterGrade, gradeValues, "年");
  refillSelect(filterClass, classValues, "組");

  if (selectedSchool && schoolValues.includes(selectedSchool)) {
    filterType.value = selectedSchool;
  }

  if (selectedGrade && gradeValues.includes(selectedGrade)) {
    filterGrade.value = selectedGrade;
  } else {
    filterGrade.value = "";
  }

  if (selectedClass && classValues.includes(selectedClass)) {
    filterClass.value = selectedClass;
  } else {
    filterClass.value = "";
  }
}

function getFilteredTeachers() {
  const selectedType = filterType.value;
  const selectedGrade = filterGrade.value;
  const selectedClass = filterClass.value;
  const searchText = normalizeText(filterName.value);

  return teachers.filter(item => {
    if (selectedType && String(item.schoolName ?? "") !== selectedType) return false;
    if (selectedGrade && String(item.grade ?? "") !== selectedGrade) return false;
    if (selectedClass && String(item.className ?? "") !== selectedClass) return false;

    if (searchText) {
      const haystack = [
        item.email,
        item.name,
        item.schoolName,
        item.grade,
        item.className,
        item.remarks
      ]
        .map(value => String(value ?? ""))
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(searchText)) return false;
    }

    return true;
  });
}

function compareValues(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""), "pl", {
    numeric: true,
    sensitivity: "base"
  });
}

function compareStudentOrder(a, b) {
  const schoolResult = compareValues(a.schoolName, b.schoolName);
  if (schoolResult !== 0) return schoolResult;

  const gradeResult = compareValues(a.grade, b.grade);
  if (gradeResult !== 0) return gradeResult;

  return compareValues(a.className, b.className);
}

function insertTeacher(teacher) {
  teachers.push(teacher);
}

function sortTeachers(items) {
  if (!sortState.length) {
    return [...items].sort(compareStudentOrder);
  }

  return [...items].sort((a, b) => {
    for (const rule of sortState) {
      const result = compareValues(a[rule.key], b[rule.key]);
      if (result !== 0) {
        return rule.direction === "asc" ? result : -result;
      }
    }
    return 0;
  });
}

function hasActiveFilters() {
  return Boolean(
    filterType.value ||
    filterGrade.value ||
    filterClass.value ||
    normalizeText(filterName.value)
  );
}

function hasActiveSorting() {
  return sortState.length > 0;
}

function canDragRows() {
  return !hasActiveSorting() && !hasActiveFilters();
}

function getDragBlockReason() {
  if (hasActiveSorting()) {
    return "Przeciąganie działa tylko przy wyłączonym sortowaniu.";
  }
  if (hasActiveFilters()) {
    return "Przeciąganie działa tylko bez aktywnych filtrów i wyszukiwania.";
  }
  return "";
}

function updateSortButtons() {
  const buttons = document.querySelectorAll(".sort-btn");

  buttons.forEach(btn => {
    const baseLabel = btn.dataset.label || btn.textContent.replace(/\s*[▲▼]\d*$/, "").trim();

    if (!btn.dataset.label) {
      btn.dataset.label = baseLabel;
    }

    const sortIndex = sortState.findIndex(rule => rule.key === btn.dataset.sort);

    if (sortIndex >= 0) {
      const rule = sortState[sortIndex];
      const arrow = rule.direction === "asc" ? "▲" : "▼";
      btn.textContent = `${baseLabel} ${arrow}${sortIndex + 1}`;
    } else {
      btn.textContent = baseLabel;
    }
  });
}

function renderEmptyState() {
  teacherTableBody.innerHTML = `
    <tr>
      <td colspan="7">Brak danych do wyświetlenia.</td>
    </tr>
  `;
}

function renderTable() {
  const filtered = sortTeachers(getFilteredTeachers());
  const dragEnabled = canDragRows();

  teacherTableBody.innerHTML = "";

  if (filtered.length === 0) {
    renderEmptyState();
    updateJsonOutput();
    if (justAddedTeacher) {
      justAddedTeacher = null;
    }
    return;
  }

  filtered.forEach((teacher, index) => {
    const tr = document.createElement("tr");

    if (justAddedTeacher === teacher) {
      tr.classList.add("just-added");
      setTimeout(() => {
        tr.classList.remove("just-added");
      }, 2000);
    }

    const realIndex = teachers.indexOf(teacher);

    if (dragEnabled) {
      tr.draggable = true;
      tr.dataset.realIndex = String(realIndex);
      tr.title = "Przeciągnij, aby zmienić kolejność";
    } else {
      tr.draggable = false;
      tr.title = getDragBlockReason();
    }

    tr.innerHTML = `
      <td>${escapeHtml(teacher.email)}</td>
      <td>${escapeHtml(teacher.name)}</td>
      <td>
        <span class="type-badge ${getSchoolBadgeClass(teacher.schoolName)}">
          ${escapeHtml(teacher.schoolName)}
        </span>
      </td>
      <td>${escapeHtml(teacher.grade)}</td>
      <td>${escapeHtml(teacher.className)}</td>
      <td>${escapeHtml(teacher.remarks)}</td>
      <td>
        <button type="button" class="action-btn edit-btn" data-index="${index}">Edytuj</button>
        <button type="button" class="action-btn delete-btn" data-index="${index}">Usuń</button>
      </td>
    `;

    teacherTableBody.appendChild(tr);
  });

  updateJsonOutput();

  if (justAddedTeacher) {
    justAddedTeacher = null;
  }
}

function resetForm() {
  teacherIdInput.value = "";
  emailInput.value = "";
  nameInput.value = "";
  schoolNameInput.value = "J01 第一中学校";
  gradeInput.value = "";
  classNameInput.value = "";
  remarksInput.value = "";
}

function openAddDialog() {
  resetForm();
  dialogTitle.textContent = "Dodaj nauczyciela";
  teacherDialog.showModal();
}

function openEditDialog(filteredIndex) {
  const filtered = sortTeachers(getFilteredTeachers());
  const teacher = filtered[filteredIndex];
  if (!teacher) return;

  const realIndex = teachers.indexOf(teacher);
  if (realIndex === -1) return;

  teacherIdInput.value = String(realIndex);
  emailInput.value = teacher.email ?? "";
  nameInput.value = teacher.name ?? "";
  schoolNameInput.value = teacher.schoolName ?? "J01 第一中学校";
  gradeInput.value = teacher.grade ?? "";
  classNameInput.value = teacher.className ?? "";
  remarksInput.value = teacher.remarks ?? "";

  dialogTitle.textContent = "Edytuj nauczyciela";
  teacherDialog.showModal();
}

function upsertTeacherFromForm() {
  const teacher = {
    email: emailInput.value.trim(),
    name: nameInput.value.trim(),
    schoolName: schoolNameInput.value,
    grade: gradeInput.value.trim(),
    className: classNameInput.value.trim(),
    remarks: remarksInput.value.trim()
  };

  const editIndex = teacherIdInput.value;

  if (editIndex === "") {
    insertTeacher(teacher);
    justAddedTeacher = teacher;
  } else {
    teachers[Number(editIndex)] = teacher;
    justAddedTeacher = null;
  }

  saveTeachersToLocal();
  populateFilters();
  renderTable();
  setSyncStatus("Zapisano lokalne zmiany.");
}

function deleteTeacher(filteredIndex) {
  const filtered = sortTeachers(getFilteredTeachers());
  const teacher = filtered[filteredIndex];
  if (!teacher) return;

  const realIndex = teachers.indexOf(teacher);
  if (realIndex === -1) return;

  const confirmed = window.confirm(`Usunąć wpis: ${teacher.name || teacher.email || "bez nazwy"}?`);
  if (!confirmed) return;

  teachers.splice(realIndex, 1);
  saveTeachersToLocal();
  populateFilters();
  renderTable();
  setSyncStatus("Usunięto wpis i zapisano lokalnie.");
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map(value => value.trim());
}

function toCsvValue(value) {
  const text = String(value ?? "");
  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function importCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    alert("Plik CSV nie zawiera danych.");
    return;
  }

  const header = parseCsvLine(lines[0]).map(item => item.toLowerCase());
  const mapIndex = name => header.indexOf(name.toLowerCase());

  const imported = lines.slice(1).map(line => {
    const cols = parseCsvLine(line);

    return {
      email: cols[mapIndex("email")] ?? "",
      name: cols[mapIndex("name")] ?? "",
      schoolName: cols[mapIndex("schoolName")] ?? "J01 第一中学校",
      grade: cols[mapIndex("grade")] ?? "",
      className: cols[mapIndex("className")] ?? "",
      remarks: cols[mapIndex("remarks")] ?? ""
    };
  });

  teachers = imported;
  sortState = [];
  justAddedTeacher = null;
  saveTeachersToLocal();
  populateFilters();
  updateSortButtons();
  renderTable();
  setSyncStatus("Zaimportowano dane z CSV.");
}

function exportCsv() {
  const rows = [
    ["email", "name", "schoolName", "grade", "className", "remarks"],
    ...teachers.map(item => [
      item.email,
      item.name,
      item.schoolName,
      item.grade,
      item.className,
      item.remarks
    ])
  ];

  const csv = rows.map(row => row.map(toCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "teachers.csv";
  link.click();

  URL.revokeObjectURL(url);
  setSyncStatus("Wyeksportowano CSV.");
}

function downloadSampleCsv() {
  const sampleRows = [
    ["email", "name", "schoolName", "grade", "className", "remarks"],
    ["○○○○@o365.suita.ed.jp", "○○ ○○", "S05 吹田南小学校", "1", "1", "サンプル"],
    ["1", "山田 太郎", "J01 第一中学校", "2", "3", ""]
  ];

  const csv = sampleRows.map(row => row.map(toCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "teachers_sample.csv";
  link.click();

  URL.revokeObjectURL(url);
  setSyncStatus("Pobrano przykładowy CSV.");
}

async function copyJsonToClipboard() {
  const text = JSON.stringify(teachers, null, 2);

  try {
    await navigator.clipboard.writeText(text);
    setSyncStatus("JSON skopiowany.");
    alert("JSON skopiowany.");
  } catch (error) {
    console.error("Błąd kopiowania:", error);
    setSyncStatus("Nie udało się skopiować JSON.", true);
    alert("Nie udało się skopiować JSON.");
  }
}

function updateToolbarButtonLabel() {
  if (!toggleToolbarBtn || !toolbar) return;

  if (!isMobileView()) {
    toggleToolbarBtn.textContent = "Ukryj przyciski";
    return;
  }

  toggleToolbarBtn.textContent = toolbar.classList.contains("hidden-toolbar")
    ? "Pokaż przyciski"
    : "Ukryj przyciski";
}

function applyResponsiveToolbarState() {
  if (!toolbar) return;

  if (isMobileView()) {
    toolbar.classList.add("hidden-toolbar");
  } else {
    toolbar.classList.remove("hidden-toolbar");
  }

  updateToolbarButtonLabel();
}

function toggleToolbar() {
  if (!toolbar) return;

  toolbar.classList.toggle("hidden-toolbar");
  updateToolbarButtonLabel();
}

function handleSortClick(event) {
  const btn = event.target.closest(".sort-btn");
  if (!btn) return;

  const key = btn.dataset.sort;
  if (!key) return;

  const existingIndex = sortState.findIndex(rule => rule.key === key);

  if (existingIndex === -1) {
    sortState.push({ key, direction: "asc" });
  } else if (sortState[existingIndex].direction === "asc") {
    sortState[existingIndex].direction = "desc";
  } else {
    sortState.splice(existingIndex, 1);
  }

  updateSortButtons();
  renderTable();
}

function handleTableClick(event) {
  const editBtn = event.target.closest(".edit-btn");
  if (editBtn) {
    openEditDialog(Number(editBtn.dataset.index));
    return;
  }

  const deleteBtn = event.target.closest(".delete-btn");
  if (deleteBtn) {
    deleteTeacher(Number(deleteBtn.dataset.index));
  }
}



function handleDragStart(event) {
  const row = event.target.closest("tr");
  if (!row || !canDragRows()) {
    event.preventDefault();
    return;
  }

  draggedTeacherIndex = Number(row.dataset.realIndex);
  row.classList.add("dragging");

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(draggedTeacherIndex));
  }
}

function handleDragOver(event) {
  if (!canDragRows()) return;

  const row = event.target.closest("tr");
  if (!row || !row.dataset.realIndex) return;

  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

function handleDrop(event) {
  if (!canDragRows()) return;

  const row = event.target.closest("tr");
  if (!row || !row.dataset.realIndex) return;

  event.preventDefault();

  const targetIndex = Number(row.dataset.realIndex);
  const sourceIndex = draggedTeacherIndex;

  if (
    sourceIndex === null ||
    Number.isNaN(sourceIndex) ||
    Number.isNaN(targetIndex) ||
    sourceIndex === targetIndex
  ) {
    return;
  }

  const movedItem = teachers[sourceIndex];
  if (!movedItem) return;

  teachers.splice(sourceIndex, 1);
  teachers.splice(targetIndex, 0, movedItem);

  draggedTeacherIndex = null;

  saveTeachersToLocal();
  renderTable();
  setSyncStatus("Zmieniono kolejność i zapisano lokalnie.");
}

function handleDragEnd() {
  draggedTeacherIndex = null;
  teacherTableBody.querySelectorAll("tr").forEach(row => {
    row.classList.remove("dragging");
  });
}

async function init() {
  setSyncStatus("Uruchamianie...");

  const loadedLocal = loadTeachersFromLocal();

  if (loadedLocal) {
    populateFilters();
    renderTable();
    setSyncStatus("Wczytano dane lokalne.");
  }

  const loadedRemote = await loadTeachersFromJson();

  if (loadedRemote) {
    populateFilters();
    renderTable();
    setSyncStatus("Wczytano najnowsze dane z JSON.");
  } else if (!loadedLocal) {
    teachers = [];
    populateFilters();
    renderTable();
    setSyncStatus("Nie udało się wczytać danych.", true);
  }

  updateSortButtons();
  applyResponsiveToolbarState();
}


toggleToolbarBtn.addEventListener("click", toggleToolbar);

downloadSampleCsvBtn.addEventListener("click", downloadSampleCsv);
exportCsvBtn.addEventListener("click", exportCsv);
copyBtn.addEventListener("click", copyJsonToClipboard);
reloadJsonBtn.addEventListener("click", reloadTeachersFromJson);
clearLocalBtn.addEventListener("click", clearLocalStorageData);
addBtn.addEventListener("click", openAddDialog);

csvFileInput.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    importCsv(String(e.target?.result ?? ""));
    csvFileInput.value = "";
  };
  reader.readAsText(file, "utf-8");
});

[filterType, filterGrade, filterClass].forEach(element => {
  element.addEventListener("change", () => {
    populateFilters();
    renderTable();
  });
});

filterName.addEventListener("input", renderTable);
filterName.addEventListener("change", renderTable);

teacherTableBody.addEventListener("click", handleTableClick);
teacherTableBody.addEventListener("dragstart", handleDragStart);
teacherTableBody.addEventListener("dragover", handleDragOver);
teacherTableBody.addEventListener("drop", handleDrop);
teacherTableBody.addEventListener("dragend", handleDragEnd);

tableHead?.addEventListener("click", handleSortClick);

teacherForm.addEventListener("submit", event => {
  event.preventDefault();
  upsertTeacherFromForm();
  teacherDialog.close();
});

cancelBtn.addEventListener("click", () => {
  teacherDialog.close();
});

window.addEventListener("resize", applyResponsiveToolbarState);

async function initAuth() {
  try {
    auth0Client = await auth0.createAuth0Client(auth0Config);

    if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
      await auth0Client.handleRedirectCallback();
      window.history.replaceState({}, document.title, REPO_PATH);
    }

    const isAuthenticated = await auth0Client.isAuthenticated();

    loginBtn.onclick = async () => {
      try {
        loginError.hidden = true;
        await auth0Client.loginWithRedirect();
      } catch (e) {
        loginError.hidden = false;
        loginError.textContent = "Błąd logowania: " + (e.message || "Spróbuj ponownie.");
      }
    };

    logoutBtn.onclick = async () => {
      try {
        await auth0Client.logout({
          logoutParams: { returnTo: SITE_URL }
        });
      } catch (e) {
        loginError.hidden = false;
        loginError.textContent = "Błąd wylogowania: " + (e.message || JSON.stringify(e));
        console.error("LOGOUT ERROR", e);
      }
    };

    if (isAuthenticated) {
      loginScreen.classList.add("hidden");
      appContent.classList.remove("hidden");
      logoutBtn.hidden = false;
      init();
    } else {
      loginScreen.classList.remove("hidden");
      appContent.classList.add("hidden");
      logoutBtn.hidden = true;
    }
  } catch (e) {
    loginError.hidden = false;
    loginError.textContent = "Błąd Auth0: " + (e.message || "Nie udało się uruchomić logowania.");
    console.error("AUTH0 ERROR", e);
  }
}
initAuth();
