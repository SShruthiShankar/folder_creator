import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AlertCircle, CheckCircle2, Folder, FolderPlus, HardDrive, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import "./styles.css";

const DEFAULT_SUBFOLDERS = [
  { id: "photography", name: "Photography", enabled: true },
  { id: "ai", name: "AI", enabled: true },
  { id: "2d", name: "2D", enabled: true },
];

const INVALID_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g;
const RESERVED = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

function cleanName(value = "") {
  return value.replace(INVALID_CHARS, "-").replace(/[. ]+$/g, "").trim();
}

function parseSeries(value) {
  // Commas, semicolons and new lines preserve spaces inside a series name.
  // If none are present, spaces act as delimiters.
  const raw = /[,;\n]/.test(value) ? value.split(/[,;\n]+/) : value.split(/\s+/);
  const seen = new Set();
  return raw.map(cleanName).filter(Boolean).filter((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function validateName(name) {
  if (!name) return "Folder name cannot be empty.";
  if (RESERVED.test(name)) return `“${name}” is a reserved folder name.`;
  return "";
}

function App() {
  const [seriesInput, setSeriesInput] = useState("");
  const [subfolders, setSubfolders] = useState(DEFAULT_SUBFOLDERS);
  const [newFolder, setNewFolder] = useState("");
  const [status, setStatus] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const series = useMemo(() => parseSeries(seriesInput), [seriesInput]);
  const enabledSubfolders = subfolders.filter((folder) => folder.enabled && cleanName(folder.name));
  const totalFolders = series.length * (1 + enabledSubfolders.length);

  function updateSubfolder(id, changes) {
    setSubfolders((items) => items.map((item) => item.id === id ? { ...item, ...changes } : item));
  }

  function addSubfolder() {
    const name = cleanName(newFolder);
    if (!name) return;
    if (subfolders.some((folder) => cleanName(folder.name).toLowerCase() === name.toLowerCase())) {
      setStatus({ type: "error", message: `“${name}” is already in the subfolder list.` });
      return;
    }
    setSubfolders((items) => [...items, { id: crypto.randomUUID(), name, enabled: true }]);
    setNewFolder("");
    setStatus(null);
  }

  function downloadManifest() {
    const paths = series.flatMap((name) => [name, ...enabledSubfolders.map((folder) => `${name}/${cleanName(folder.name)}`)]);
    const blob = new Blob([paths.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "folder-structure.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function createFolders() {
    setStatus(null);
    if (!series.length) {
      setStatus({ type: "error", message: "Enter at least one series name." });
      return;
    }

    const invalid = [...series, ...enabledSubfolders.map((folder) => cleanName(folder.name))]
      .map(validateName).find(Boolean);
    if (invalid) {
      setStatus({ type: "error", message: invalid });
      return;
    }

    if (!("showDirectoryPicker" in window)) {
      downloadManifest();
      setStatus({ type: "info", message: "Direct folder creation is not supported in this browser. A folder-structure manifest was downloaded instead. Use Microsoft Edge or Chrome for direct creation." });
      return;
    }

    try {
      setIsCreating(true);
      const root = await window.showDirectoryPicker({ mode: "readwrite" });
      for (const seriesName of series) {
        const seriesHandle = await root.getDirectoryHandle(seriesName, { create: true });
        for (const subfolder of enabledSubfolders) {
          await seriesHandle.getDirectoryHandle(cleanName(subfolder.name), { create: true });
        }
      }
      setStatus({ type: "success", message: `Created ${totalFolders} folders successfully inside “${root.name}”.` });
    } catch (error) {
      setStatus(error?.name === "AbortError"
        ? { type: "info", message: "Folder selection was cancelled. No folders were created." }
        : { type: "error", message: error?.message || "Folders could not be created." });
    } finally {
      setIsCreating(false);
    }
  }

  function reset() {
    setSeriesInput("");
    setSubfolders(DEFAULT_SUBFOLDERS.map((folder) => ({ ...folder })));
    setNewFolder("");
    setStatus(null);
  }

  return <div className="app-shell">
    <header>
      <div className="header-inner">
        <div className="brand"><span className="brand-icon"><FolderPlus size={21}/></span><div><h1>Series Folder Creator</h1><p>Create consistent production folder structures in one step</p></div></div>
        <button className="button ghost" onClick={reset}><RotateCcw size={16}/> Reset</button>
      </div>
    </header>

    <main>
      <section className="workspace">
        <article className="card">
          <div className="section-heading"><span className="step">1</span><div><h2>Enter series names</h2><p>Use commas, spaces, semicolons, or new lines. Use commas when a series name contains spaces.</p></div></div>
          <textarea value={seriesInput} onChange={(event) => { setSeriesInput(event.target.value); setStatus(null); }} placeholder={"Example:\nStoneland, Bellatier, Realyn"}/>
          <div className="helper-row"><span>Duplicates and blank entries are removed automatically.</span><strong>{series.length} series</strong></div>
        </article>

        <article className="card">
          <div className="section-heading"><span className="step">2</span><div><h2>Choose and edit subfolders</h2><p>Checked folders will be created inside every series folder.</p></div></div>
          <div className="folder-options">
            {subfolders.map((folder) => <div className="folder-option" key={folder.id}>
              <input type="checkbox" checked={folder.enabled} onChange={(event) => updateSubfolder(folder.id, { enabled: event.target.checked })}/>
              <Folder size={18} className={folder.enabled ? "orange" : "muted"}/>
              <input className="folder-name" aria-label="Subfolder name" value={folder.name} onChange={(event) => updateSubfolder(folder.id, { name: event.target.value })}/>
              <Pencil size={15} className="muted"/>
              <button className="icon-button danger" aria-label={`Delete ${folder.name}`} onClick={() => setSubfolders((items) => items.filter((item) => item.id !== folder.id))}><Trash2 size={16}/></button>
            </div>)}
          </div>
          <div className="add-row"><input value={newFolder} onChange={(event) => setNewFolder(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addSubfolder()} placeholder="Add another subfolder"/><button className="button secondary" onClick={addSubfolder}><Plus size={16}/> Add</button></div>
        </article>

        {status && <div className={`status ${status.type}`}>{status.type === "success" ? <CheckCircle2 size={19}/> : <AlertCircle size={19}/>}<span>{status.message}</span></div>}
        <button className="button primary create" disabled={isCreating || !series.length} onClick={createFolders}><FolderPlus size={19}/>{isCreating ? "Creating folders..." : "Choose Location & Create Folders"}</button>
      </section>

      <aside className="card preview-card">
        <div className="preview-heading"><span className="drive-icon"><HardDrive size={18}/></span><div><h2>Structure preview</h2><p>Local or synced SharePoint location</p></div></div>
        {!series.length ? <div className="empty">Enter series names to preview the folder structure.</div> : <div className="tree-list">{series.map((name) => <div className="tree-root" key={name}><div className="root-name"><Folder size={17}/>{name}</div>{enabledSubfolders.length > 0 && <div className="children">{enabledSubfolders.map((folder) => <div key={folder.id}><Folder size={15}/>{cleanName(folder.name)}</div>)}</div>}</div>)}</div>}
        <div className="stats"><div><b>{series.length}</b><span>Series folders</span></div><div><b>{totalFolders}</b><span>Total folders</span></div></div>
        <p className="note">The destination is requested only when you create folders. For SharePoint, select a library already synced to your computer.</p>
      </aside>
    </main>
  </div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
