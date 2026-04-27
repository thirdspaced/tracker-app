"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, Download, FileSpreadsheet } from 'lucide-react';

const AL2_STUDENTS = ["Amari Savea", "Anjali Agarwal", "Aviel Miller", "Eagan Tsai", "Fritz Schallich", "Gelsa Aliotti-Goretsky", "Isolina Diaz Perez", "Josephine Pfeffmadja", "Kilolani Jeong", "Kylah Cohen", "Mika Moon-Hoffman", "Miles Reinhardt", "Misa Jayasekera", "Rio Aviram-Goerzen", "Rowan Kwong", "Shiloh Post", "Timothy Sharp", "Tucker (Tuck) Eskay", "William Estevez"];
const AL3_STUDENTS = ["Amitav Lalovic", "Anshen (Anson) Li", "Brandon Kwong", "Edith Fineman", "Eve Waterson", "Gabriel Goldberg", "Hagan Schallich", "Kash Kohli", "Leslie (Grace) Price", "Linus Lane", "Megan Chaset", "Russell Rubinstein", "Sage Camilli", "Shuwen Tan", "Wyatt Stein", "Zaiya Kohli"];
const AL4_STUDENTS = ["Abigail Martinez", "Ada Nissen", "Althea Jordan", "Avalyn Hayward Casis", "Caleb Romero", "Carlo Mattos-Tance", "Dania Juarez Rizo", "Ella Rae Everett", "Emma Montoya Romero", "Isabella Araujo", "Isis Wilson", "Ivan DeVries", "Jamarie Price", "Javier Ruiz", "Kharis Patton", "Lyra Pupius", "Nicollas Araujo", "Olivia Holmes", "Sebastian (Bash) Ma", "Skye Camilli", "Tess Light"];

export default function TrackerApp() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const getStudentInfo = (rawName: string) => {
    if (!rawName) return null;
    const nl = rawName.toString().trim().toLowerCase();
    if (!nl || nl.includes('finisher') || nl.includes('check') || nl.includes('group') || nl.includes('student')) return null;

    if (nl === 'ami') return { name: "Amitav Lalovic", level: "AL3" };
    if (nl === 'kilo') return { name: "Kilolani Jeong", level: "AL2" };
    if (nl === 'tuck') return { name: "Tucker (Tuck) Eskay", level: "AL2" };
    if (nl === 'grace') return { name: "Leslie (Grace) Price", level: "AL3" };
    if (nl === 'anson') return { name: "Anshen (Anson) Li", level: "AL3" };
    if (nl === 'gabe') return { name: "Gabriel Goldberg", level: "AL3" };
    if (nl === 'abby') return { name: "Abigail Martinez", level: "AL4" };
    if (nl === 'ava') return { name: "Avalyn Hayward Casis", level: "AL4" };
    if (nl === 'bella') return { name: "Isabella Araujo", level: "AL4" };
    if (nl === 'jamari' || nl === 'jamarie') return { name: "Jamarie Price", level: "AL4" };
    if (nl === 'javi') return { name: "Javier Ruiz", level: "AL4" };
    if (nl === 'nick') return { name: "Nicollas Araujo", level: "AL4" };
    if (nl === 'bash' || nl === 'sebastian') return { name: "Sebastian (Bash) Ma", level: "AL4" };
    if (nl === 'amari') return { name: "Amari Savea", level: "AL2" };
    if (nl === 'ella') return { name: "Ella Rae Everett", level: "AL4" };

    for (let full of AL2_STUDENTS) if (full.toLowerCase().includes(nl)) return { name: full, level: "AL2" };
    for (let full of AL3_STUDENTS) if (full.toLowerCase().includes(nl)) return { name: full, level: "AL3" };
    for (let full of AL4_STUDENTS) if (full.toLowerCase().includes(nl)) return { name: full, level: "AL4" };
    
    return null;
  };

  const mapContent = (val0: string, val1: string) => {
    const raw = ((val0 || "") + " " + (val1 || "")).toLowerCase();
    if (/comp|math|fluency|beast|reflex|problem|addition|subtraction|zearn|number|multiplication|division|count|board|stamp|geometry|area|fraction|ba\b|weight/.test(raw)) return "Computation";
    if (/read|lexia|raz|book|novel/.test(raw)) return "Reading";
    if (/writ|draft|handwriting|typing|quill|spell|essay|sentence/.test(raw)) return "Writing";
    if (/comm|email|speech/.test(raw)) return "Communication";
    if (val0 && val0 !== "undefined") return val0.toString().split('\n')[0].trim();
    return "Other";
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setLogs([]);
    addLog("Initializing thorough row-by-row parser...");

    let allRecords: any[] = [];

    for (const file of files) {
      addLog(`Reading file: ${file.name}`);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      workbook.SheetNames.forEach(sheetName => {
        // Process if it is a single-tab CSV, OR if the tab name contains 'week'
        if (workbook.SheetNames.length > 1 && !sheetName.toLowerCase().includes('week')) return;
        
        const ws = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
        
        let currentStudentMap: Record<number, {name: string, level: string}> = {};
        let expectingStudents = false;
        let currentContent: string | null = null;

        sheetData.forEach(row => {
          const val0 = row[0] ? row[0].toString().trim() : "";
          const val1 = row[1] ? row[1].toString().trim() : "";

          if (val0 === "Group" || val1.includes("Checked") || val1.includes("Ready to Assign") || (row[2] && row[2].toString().includes("Student Check"))) {
            expectingStudents = true;
            currentStudentMap = {};
            currentContent = null;
            return;
          }

          if (expectingStudents) {
            expectingStudents = false;
            for (let c = 2; c < row.length; c++) {
              const sName = row[c] ? row[c].toString().trim() : "";
              const info = getStudentInfo(sName);
              if (info) currentStudentMap[c] = info;
            }
            return;
          }

          if (Object.keys(currentStudentMap).length === 0) return;

          if (val0.toLowerCase().includes("flex") || val1.toLowerCase().includes("flex") || val1.toLowerCase().includes("additional goal")) {
            if (val0.toLowerCase().includes("flex")) currentStudentMap = {};
            return;
          }

          if (val0) {
            currentContent = mapContent(val0, val1);
          } else if (!currentContent && val1) {
            const inferred = mapContent("", val1);
            if (inferred !== "Other") currentContent = inferred;
          }

          const assignment = val1;
          if (!assignment || assignment.toLowerCase().includes("finisher") || assignment.toLowerCase().includes("choose from")) return;
          if (currentContent && currentContent.toLowerCase().includes("flex")) return;
          
          const assignLower = assignment.toLowerCase();
          if (assignLower.includes("flex") || assignLower.includes("additional goal") || assignLower.includes("extra dear") || assignLower.includes("personal goal") || assignLower.includes("duolingo") || assignLower.includes("bridge drawing")) return;

          if (!currentContent) currentContent = "Other";

          for (const c in currentStudentMap) {
            if (parseInt(c) >= row.length) continue;
            const statusVal = row[c].toString().trim().toLowerCase();
            let status = "";
            if (statusVal === "true") status = "Complete";
            else if (statusVal === "false") status = "Missing";
            else continue;

            let cleanWeekName = sheetName.trim();
            const weekMatch = file.name.match(/Week\s*\d+/i) || sheetName.match(/Week\s*\d+/i);
            if (weekMatch) {
               cleanWeekName = weekMatch[0];
            }

            allRecords.push({
              "AL Level": currentStudentMap[c].level,
              "Student Name": currentStudentMap[c].name,
              "Week Number": cleanWeekName,
              "Content Type": currentContent,
              "Assignment": assignment,
              "Status": status
            });
          }
        });
      });
    }

    if (allRecords.length === 0) {
        addLog("Error: No valid student tasks found. Please ensure the file matches the standard format.");
        setIsProcessing(false);
        return;
    }

    addLog(`Extracted ${allRecords.length} task records. Building Excel workbooks...`);
    exportWorkbooks(allRecords);
    setIsProcessing(false);
  };

  const exportWorkbooks = (records: any[]) => {
    const levels = ["AL2", "AL3", "AL4"];
    
    levels.forEach(level => {
      const levelRecords = records.filter(r => r["AL Level"] === level).map(({"AL Level": _, ...rest}) => rest);
      if (levelRecords.length === 0) return;

      levelRecords.sort((a, b) => {
        if (a["Student Name"] !== b["Student Name"]) return a["Student Name"].localeCompare(b["Student Name"]);
        const wA = parseInt(a["Week Number"].replace(/\D/g, '')) || 0;
        const wB = parseInt(b["Week Number"].replace(/\D/g, '')) || 0;
        if (wA !== wB) return wA - wB;
        return a["Content Type"].localeCompare(b["Content Type"]);
      });

      const wb = XLSX.utils.book_new();
      
      const wsMaster = XLSX.utils.json_to_sheet(levelRecords);
      if (wsMaster['!ref']) {
          wsMaster['!autofilter'] = { ref: wsMaster['!ref'] as string };
      }
      XLSX.utils.book_append_sheet(wb, wsMaster, "Master Sheet");

      const students = Array.from(new Set(levelRecords.map(r => r["Student Name"]))).sort() as string[];
      students.forEach(student => {
        const studentData = levelRecords.filter(r => r["Student Name"] === student);
        const wsStudent = XLSX.utils.json_to_sheet(studentData);
        if (wsStudent['!ref']) {
            wsStudent['!autofilter'] = { ref: wsStudent['!ref'] as string };
        }
        XLSX.utils.book_append_sheet(wb, wsStudent, student.substring(0, 31)); 
      });

      XLSX.writeFile(wb, `${level}_Student_Tracker_Processed.xlsx`);
      addLog(`Downloaded ${level} Tracker.`);
    });
    
    addLog("Process complete!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center space-x-3 mb-2">
          <FileSpreadsheet className="text-blue-600 w-8 h-8" />
          <h1 className="text-3xl font-bold text-gray-900">Task Tracker Processor</h1>
        </div>
        <p className="text-gray-600 mb-8">Upload weekly CSVs. The system will search one by one and generate sorted AL spreadsheets with built-in drop-down filters.</p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center bg-gray-50 hover:bg-gray-100 transition relative">
          <input 
            type="file" 
            multiple 
            accept=".csv, .xlsx" 
            onChange={handleFileChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          />
          <div className="pointer-events-none">
            <UploadCloud className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <span className="text-lg font-semibold text-gray-700 block">
              {files.length > 0 ? `${files.length} file(s) selected` : "Click or drag files here"}
            </span>
          </div>
        </div>

        <button 
          onClick={processFiles} 
          disabled={files.length === 0 || isProcessing}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg shadow transition disabled:bg-gray-400 flex justify-center items-center"
        >
          {isProcessing ? "Processing Data..." : "Process & Download Excel Trackers"}
          {!isProcessing && <Download className="ml-2 w-5 h-5" />}
        </button>

        {logs.length > 0 && (
          <div className="mt-8 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-48 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
