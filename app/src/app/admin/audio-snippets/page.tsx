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
  { key: "greeting", label: "🎤 Saludo inicial", desc: "Se envía cuando el usuario manda su primer mensaje" },
  { key: "discovery", label: "🔍 Descubrimiento", desc: "Se envía durante la fase de descubrimiento para generar confianza" },
  { key: "value_pitch", label: "💡 Propuesta de valor", desc: "Se envía cuando compartes valor o insights clave" },
  { key: "link_offer", label: "🔗 Oferta de asesoría", desc: "Se envía junto con el link de asesorías" },
  { key: "followup", label: "🔄 Follow-up", desc: "Se envía en el seguimiento después de enviar el link" },
  { key: "closing", label: "✅ Cierre", desc: "Se envía al cerrar la conversación positivamente" },
  { key: "custom", label: "⚙️ Personalizado", desc: "" },
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
      setName(preset.label.replace(/^[^\s]+\s/, "")); // Remove emoji
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
  const isFormVisible = showForm || (!loading && snippets.length === 0);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            🎙️ Audios Pre-grabados
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
            Grabá audios tuyos para que el agente los envíe en momentos clave
          </p>
        </div>
        {snippets.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "#0ea5e9",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <Plus size={18} />
            Nuevo Audio
          </button>
        )}
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {isFormVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              borderRadius: 16,
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              padding: 24,
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                {snippets.length === 0 ? "Grabá tu primer audio" : "Grabar nuevo audio"}
              </h2>
              {snippets.length > 0 && (
                <button
                  onClick={resetForm}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Step 1: Preset selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 10 }}>
                Paso 1: ¿Cuándo debe enviarse este audio?
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                {TRIGGER_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => handlePresetChange(preset.key)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 500,
                      border: selectedPreset === preset.key
                        ? "2px solid #0ea5e9"
                        : "1px solid var(--border)",
                      background: selectedPreset === preset.key ? "rgba(14,165,233,0.08)" : "transparent",
                      color: selectedPreset === preset.key ? "#0ea5e9" : "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      textAlign: "left",
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedPreset && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
              >
                {/* Custom fields */}
                {selectedPreset === "custom" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                        Nombre del audio
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ej: Motivación personal"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "var(--bg-base)",
                          color: "var(--text-primary)",
                          fontSize: 14,
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                        Trigger Key (identificador único)
                      </label>
                      <input
                        value={triggerKey}
                        onChange={(e) => setTriggerKey(e.target.value.replace(/[^a-z0-9_]/g, ""))}
                        placeholder="ej: motivation_pitch"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "var(--bg-base)",
                          color: "var(--text-primary)",
                          fontSize: 14,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                    Paso 2: Descripción (cuándo se envía)
                  </label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe en qué momento de la conversación se envía este audio"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--bg-base)",
                      color: "var(--text-primary)",
                      fontSize: 14,
                    }}
                  />
                </div>

                {/* Step 3: Audio Recorder */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 10 }}>
                    Paso 3: Grabá tu audio
                  </label>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: 20,
                    borderRadius: 12,
                    background: "var(--bg-base)",
                    border: "1px solid var(--border)",
                  }}>
                    {!recordedAudio ? (
                      <>
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "12px 24px",
                              borderRadius: 12,
                              border: "none",
                              background: "linear-gradient(135deg, #ef4444, #dc2626)",
                              color: "white",
                              fontWeight: 600,
                              fontSize: 14,
                              cursor: "pointer",
                            }}
                          >
                            <Mic size={18} />
                            Grabar Audio
                          </button>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <button
                              onClick={stopRecording}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "12px 24px",
                                borderRadius: 12,
                                border: "none",
                                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                color: "white",
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: "pointer",
                                animation: "pulse 2s infinite",
                              }}
                            >
                              <Square size={16} />
                              Detener
                            </button>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ef4444" }}>
                              <span style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "#ef4444",
                                animation: "pulse 1s infinite",
                                display: "inline-block",
                              }} />
                              <span style={{ fontFamily: "monospace", fontSize: 14 }}>
                                {formatDuration(recordingDuration)}
                              </span>
                            </div>
                          </div>
                        )}

                        {!isRecording && (
                          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                            Hacé click para comenzar a grabar tu audio
                          </p>
                        )}
                      </>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                        <button
                          onClick={isPlaying ? stopPlaying : playRecording}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            border: "none",
                            background: "#0ea5e9",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          {isPlaying ? (
                            <Pause size={18} color="white" />
                          ) : (
                            <Play size={18} color="white" style={{ marginLeft: 2 }} />
                          )}
                        </button>

                        <div style={{ flex: 1 }}>
                          <div style={{ height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                            <motion.div
                              style={{ height: "100%", borderRadius: 4, background: "#0ea5e9" }}
                              initial={{ width: 0 }}
                              animate={{ width: isPlaying ? "100%" : "0%" }}
                              transition={{ duration: recordingDuration, ease: "linear" }}
                            />
                          </div>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, display: "block" }}>
                            Duración: {formatDuration(recordingDuration)}
                          </span>
                        </div>

                        <button
                          onClick={clearRecording}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save button */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  {snippets.length > 0 && (
                    <button
                      onClick={resetForm}
                      style={{
                        padding: "10px 20px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--text-secondary)",
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving || !recordedAudio || !name || !triggerKey}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 24px",
                      borderRadius: 10,
                      border: "none",
                      background: saving || !recordedAudio || !name || !triggerKey ? "#94a3b8" : "#0ea5e9",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: saving || !recordedAudio || !name || !triggerKey ? "not-allowed" : "pointer",
                      opacity: saving || !recordedAudio || !name || !triggerKey ? 0.5 : 1,
                    }}
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? "Guardando..." : "Guardar Audio"}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snippets List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-secondary)" }} />
        </div>
      ) : snippets.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {snippets.map((snippet) => (
            <motion.div
              key={snippet.id}
              layout
              style={{
                borderRadius: 14,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                padding: 16,
                opacity: snippet.active ? 1 : 0.5,
                transition: "opacity 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(14,165,233,0.1)",
                  }}>
                    <Mic size={16} color="#0ea5e9" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                      {snippet.name}
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                      {snippet.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: "var(--bg-base)",
                    color: "var(--text-secondary)",
                  }}>
                    {snippet.triggerKey}
                  </span>

                  {snippet.audioDuration != null && (
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {formatDuration(snippet.audioDuration)}
                    </span>
                  )}

                  <button
                    onClick={() => toggleActive(snippet.id, snippet.active)}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    {snippet.active ? (
                      <ToggleRight size={28} color="#0ea5e9" />
                    ) : (
                      <ToggleLeft size={28} color="var(--text-secondary)" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(snippet.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", opacity: 0.6 }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
