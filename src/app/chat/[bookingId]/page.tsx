"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

type ChatMessage = {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  mine: boolean;
  createdAt: string;
  readAt: string | null;
};

export default function ChatPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const bookingId = String(params.bookingId || "");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peerName, setPeerName] = useState("Chat");
  const [bookingMeta, setBookingMeta] = useState<{
    service?: string;
    date?: string;
    time?: string;
    status?: string;
  }>({});
  const [canSend, setCanSend] = useState(true);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAtRef = useRef<string | null>(null);

  const scrollBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const load = useCallback(
    async (incremental = false) => {
      if (!bookingId) return;
      try {
        const qs = new URLSearchParams({ bookingId });
        // Full reload for initial; poll without after to keep simple & consistent
        const res = await fetch(`/api/messages?${qs.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not load chat");
          setLoading(false);
          return;
        }
        setMessages(data.messages || []);
        if (data.peer?.name) setPeerName(data.peer.name);
        if (data.booking) setBookingMeta(data.booking);
        setCanSend(data.canSend !== false);
        setError("");
        const last = (data.messages || []).slice(-1)[0];
        if (last) lastAtRef.current = last.createdAt;
        if (!incremental) setLoading(false);
        setTimeout(scrollBottom, 50);
      } catch {
        setError("Network error");
        setLoading(false);
      }
    },
    [bookingId]
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/chat/${bookingId}`);
      return;
    }
    if (status === "authenticated") load(false);
  }, [status, router, bookingId, load]);

  // Poll every 4s
  useEffect(() => {
    if (status !== "authenticated" || !bookingId) return;
    const t = setInterval(() => load(true), 4000);
    return () => clearInterval(t);
  }, [status, bookingId, load]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending || !canSend) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Send failed");
        setSending(false);
        return;
      }
      setText("");
      if (data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(scrollBottom, 50);
      } else {
        await load(true);
      }
    } catch {
      setError("Network error");
    } finally {
      setSending(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-soft text-sm text-ink-muted">
        Loading chat…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-soft flex flex-col">
      <BrandHeader active="bookings" />

      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col px-4 py-4">
        <div className="bg-white border border-border rounded-2xl shadow-card flex flex-col flex-1 min-h-[70vh] overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
            <div>
              <Link href="/bookings" className="text-xs text-accent font-medium">
                ← Bookings
              </Link>
              <h1 className="font-display font-bold text-ink text-lg">{peerName}</h1>
              <p className="text-xs text-ink-muted">
                {bookingMeta.service}
                {bookingMeta.date ? ` · ${bookingMeta.date}` : ""}
                {bookingMeta.time ? ` ${bookingMeta.time}` : ""}
                {bookingMeta.status ? ` · ${bookingMeta.status}` : ""}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream/30">
            {messages.length === 0 && (
              <p className="text-center text-sm text-ink-muted py-10">
                No messages yet. Say hi and confirm meeting details.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.mine
                      ? "bg-brand-gradient text-white rounded-br-md"
                      : "bg-white border border-border text-ink rounded-bl-md"
                  }`}
                >
                  {!m.mine && (
                    <p className="text-[10px] font-semibold opacity-70 mb-0.5">{m.senderName}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      m.mine ? "text-white/70" : "text-ink-muted"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="px-4 py-2 text-sm text-red-700 bg-red-50 border-t border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={send} className="p-3 border-t border-border flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={canSend ? "Type a message…" : "Chat closed"}
              disabled={!canSend || sending}
              maxLength={2000}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-cream/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!canSend || sending || !text.trim()}
              className="btn-brand px-5 py-2.5 rounded-xl text-sm disabled:opacity-50"
            >
              {sending ? "…" : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
