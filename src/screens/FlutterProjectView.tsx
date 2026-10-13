import React, { useState } from 'react';
import {
  FileCode,
  Download,
  Copy,
  Check,
  X,
  FolderTree,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { FLUTTER_FILES, generateFlutterProjectZip } from '../services/flutterCodebase';

interface FlutterProjectViewProps {
  onBack: () => void;
}

export const FlutterProjectView: React.FC<FlutterProjectViewProps> = ({ onBack }) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>('lib/database/database.dart');
  const [copied, setCopied] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const selectedFile = FLUTTER_FILES.find((f) => f.path === selectedFilePath) || FLUTTER_FILES[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const blob = await generateFlutterProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dhantrack_flutter_android_project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download zip', e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-slate-100 flex flex-col h-full">
      {/* Top Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-[#0b0f19]/90 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white">Flutter Project Codebase</h2>
            <span className="text-[10px] text-teal-400 font-medium">Android · Dart · Drift SQLite · Riverpod</span>
          </div>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isDownloading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{isDownloading ? 'Packaging...' : 'Download (.ZIP)'}</span>
        </button>
      </div>

      <div className="px-5 pt-4 space-y-4 flex-1 flex flex-col">
        {/* Architecture Badges & Guide */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Terminal className="h-4 w-4 text-teal-400" />
            <span>Ready for Android Studio & Flutter CLI</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All Dart source files follow the specification: integer paise storage, reactive Drift SQLite DAOs, local_auth biometrics, and manual Google Drive document backup.
          </p>
        </div>

        {/* File Navigator Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {FLUTTER_FILES.map((file) => (
            <button
              key={file.path}
              onClick={() => setSelectedFilePath(file.path)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap border transition-all ${
                selectedFilePath === file.path
                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {file.path.split('/').pop()}
            </button>
          ))}
        </div>

        {/* Selected File Details & Code Box */}
        <div className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col overflow-hidden min-h-[360px]">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
            <div>
              <span className="font-mono text-teal-400 font-semibold">{selectedFile.path}</span>
              <span className="text-slate-500 text-[11px] ml-2 hidden sm:inline">
                {selectedFile.description}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto flex-1 leading-relaxed selection:bg-teal-500/30 selection:text-teal-200">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
