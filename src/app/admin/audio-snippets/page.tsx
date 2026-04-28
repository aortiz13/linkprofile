"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Square, Play, Pause, Trash2, Plus, Save, Loader2, Volume2,
  ToggleLeft, ToggleRight, X,
} from "lucide-react";

interface AudioSnippet {
  id: string;
  name: string;
  triggerKey: string;
  description: string;
  audioDuration: number | null;
  active: boolean;
  createdAt: string;
}

const TRIGGER_PRESETS = [
  { key: "greeting", label: "Saludo inicial", desc: "Se envía cuando el usuario manda su primer mensaje" },
  { key: "discovery", label: "Descubrimiento", desc: "Se envía durante la fase de descubrimiento para generar confianza" },
  { key: "value_pitch", label: "Propuesta de valor", desc: "Se envía cuando compartes valor o insights clave" },
  { key: "link_offer", label: "Oferta de asesoría", desc: "Se envía junto con el link de asesorías" },
  { key: "followup", label: "Follow-up", desc: "Se envía en el seguimiento después de enviar el link" },
  { key: "closing", label: "Cierre", desc: "Se envía al cerrar la conversación positivamente" },
  { key: "custom", label: "Personalizado", desc: "" },
];

export default function AudioSnippetsPage() {
  const [snippets, setSnippets] = useState<AudioSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [triggerKey, setTriggerKey] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSnippets();
  }, []);

  async function fetchSnippets() {
    try {
      const res = await fetch("/api/admin/audio-snippets");
      const data = await res.json();
      setSnippets(data);
    } catch (err) {
      console.error("Error fetching snippets:", err);
    } finally {
      setLoading(false);
    }
  }

  // ─── Recording ───────────────────────────────────────────────────────────────
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          setRecordedAudio(base64);
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("No se pudo acceder al micrófono. Verificá los permisos del navegador.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function playRecording() {
    if (!recordedAudio) return;
    const audio = new Audio(`data:audio/webm;codecs=opus;base64,${recordedAudio}`);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  }

  function stopPlaying() {
    audioRef.current?.pause();
    setIsPlaying(false);
  }

  function clearRecording() {
    setRecordedAudio(null);
    setRecordingDuration(0);
  }

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function handlePresetChange(presetKey: string) {
    setSelectedPreset(presetKey);
    const preset = TRIGGER_PRESETS.find((p) => p.key === presetKey);
    if (preset && presetKey !== "custom") {
      setTriggerKey(presetKey);
      setName(preset.label);
      setDescription(preset.desc);
    } else {
      setTriggerKey("");
      setName("");
      setDescription("");
    }
  }

  async function handleSave() {
    if (!name || !triggerKey || !description || !recordedAudio) {
      alert("Completá todos los campos y grabá un audio.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/audio-snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          triggerKey,
          description,
          audioBase64: recordedAudio,
          audioDuration: recordingDuration,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error al guardar");
        return;
      }

      await fetchSnippets();
      resetForm();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setShowForm(false);
    setName("");
    setTriggerKey("");
    setDescription("");
    setSelectedPreset("");
    setRecordedAudio(null);
    setRecordingDuration(0);
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      await fetch("/api/admin/audio-snippets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !active }),
      });
      setSnippets((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active: !active } : s))
      );
    } catch (err) {
      console.error("Toggle error:", err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este audio?")) return;
    try {
      await fetch(`/api/admin/audio-snippets?id=${id}`, { method: "DELETE" });
      setSnippets((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            🎙️ Audios Pre-grabados
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Grabá audios tuyos para que el agente los envíe en momentos clave de la conversación
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
          style={{ background: "var(--brand)" }}
        >
          <Plus size={18} />
          Nuevo Audio
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Grabar nuevo audio
              </h2>
              <button onClick={resetForm} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>

            {/* Preset selector */}
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                ¿Cuándo debe enviarse este audio?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {TRIGGER_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => handlePresetChange(preset.key)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      selectedPreset === preset.key
                        ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/50"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedPreset && (
              <>
                {/* Custom fields */}
                {selectedPreset === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">
                        Nombre del audio
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ej: Motivación personal"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">
                        Trigger Key (identificador único)
                      </label>
                      <input
                        value={triggerKey}
                        onChange={(e) => setTriggerKey(e.target.value.replace(/[^a-z0-9_]/g, ""))}
                        placeholder="ej: motivation_pitch"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">
                    Descripción (cuándo se envía)
                  </label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe en qué momento de la conversación se envía este audio"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
                  />
                </div>

                {/* Audio Recorder */}
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                    Audio
                  </label>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border)]">
                    {!recordedAudio ? (
                      <>
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all hover:scale-105"
                            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                          >
                            <Mic size={18} />
                            Grabar Audio
                          </button>
                        ) : (
                          <div className="flex items-center gap-4">
                            <button
                              onClick={stopRecording}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium animate-pulse"
                              style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                            >
                              <Square size={16} />
                              Detener
                            </button>
                            <div className="flex items-center gap-2 text-red-500">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              <span className="font-mono text-sm">
                                {formatDuration(recordingDuration)}
                              </span>
                            </div>
                          </div>
                        )}

                        {!isRecording && (
                          <p className="text-sm text-[var(--text-secondary)]">
                            Hacé click para comenzar a grabar tu audio
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-3 w-full">
                        <button
                          onClick={isPlaying ? stopPlaying : playRecording}
                          className="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
                          style={{ background: "var(--brand)" }}
                        >
                          {isPlaying ? (
                            <Pause size={18} className="text-white" />
                          ) : (
                            <Play size={18} className="text-white ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: "var(--brand)" }}
                              initial={{ width: 0 }}
                              animate={{ width: isPlaying ? "100%" : "0%" }}
                              transition={{ duration: recordingDuration, ease: "linear" }}
                            />
                          </div>
                          <span className="text-xs text-[var(--text-secondary)] mt-1">
                            {formatDuration(recordingDuration)}
                          </span>
                        </div>

                        <button
                          onClick={clearRecording}
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save button */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-base)]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !recordedAudio || !name || !triggerKey}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                    style={{ background: "var(--brand)" }}
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? "Guardando..." : "Guardar Audio"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snippets List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[var(--text-secondary)]" />
        </div>
      ) : snippets.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Volume2 size={48} className="mx-auto text-[var(--text-secondary)] opacity-40" />
          <p className="text-[var(--text-secondary)]">No hay audios pre-grabados aún</p>
          <p className="text-sm text-[var(--text-secondary)] opacity-60">
            Grabá tu primer audio para que el agente lo envíe automáticamente
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {snippets.map((snippet) => (
            <motion.div
              key={snippet.id}
              layout
              className={`rounded-xl border p-4 transition-all ${
                snippet.active
                  ? "border-[var(--border)] bg-[var(--bg-card)]"
                  : "border-[var(--border)] bg-[var(--bg-card)] opacity-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--brand)", opacity: 0.15 }}
                    >
                      <Mic size={16} style={{ color: "var(--brand)" }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{snippet.name}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{snippet.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2 py-1 rounded bg-[var(--bg-base)] text-[var(--text-secondary)]">
                    {snippet.triggerKey}
                  </span>

                  {snippet.audioDuration && (
                    <span className="text-xs text-[var(--text-secondary)]">
                      {formatDuration(snippet.audioDuration)}
                    </span>
                  )}

                  <button
                    onClick={() => toggleActive(snippet.id, snippet.active)}
                    className="transition-colors"
                  >
                    {snippet.active ? (
                      <ToggleRight size={28} style={{ color: "var(--brand)" }} />
                    ) : (
                      <ToggleLeft size={28} className="text-[var(--text-secondary)]" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(snippet.id)}
                    className="text-red-500/60 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
