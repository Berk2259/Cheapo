"use client";

import { useEffect, useRef, useState } from "react";

type Question = { q: string; a: string };
type Message = { id: number; from: "user" | "bot"; text: string };

export function FaqChat({ questions }: { questions: Question[] }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: "bot",
      text: "Merhaba! Aşağıdan bir soru seç, hemen cevaplayayım.",
    },
  ]);
  const [asked, setAsked] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);
  const [visible, setVisible] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bölüm ekrana girince kart yükselerek gelir.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Yeni mesaj gelince yalnızca sohbet kutusunu aşağı kaydır (sayfayı değil).
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  // Sayfadan çıkılırsa bekleyen cevap zamanlayıcısını temizle.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function ask(index: number) {
    if (typing || asked.includes(index)) return;

    const item = questions[index];
    setAsked((prev) => [...prev, index]);
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, from: "user", text: item.q },
    ]);
    setTyping(true);

    timer.current = setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, from: "bot", text: item.a },
      ]);
    }, 1100);
  }

  const allAsked = asked.length === questions.length;

  return (
    <div ref={rootRef} className={visible ? "pf-in" : ""}>
      <div className="pf-rise mx-auto max-w-[900px] overflow-hidden rounded-[28px] border border-line bg-white text-left shadow-[0_26px_56px_rgba(13,148,136,0.13)]">
        {/* Başlık */}
        <div className="flex items-center gap-3 bg-ink px-5 py-4 text-white">
          <div className="relative grid h-[38px] w-[38px] place-items-center rounded-full bg-[linear-gradient(135deg,#5eead4,#0d9488)] text-ink">
            <svg
              viewBox="0 0 24 24"
              width={18}
              height={18}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
              <path d="m21.854 2.147-10.94 10.939" />
            </svg>
            <span className="pf-online absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-ink bg-green-400" />
          </div>
          <div>
            <b className="block leading-tight">Cheapo</b>
            <small className="text-xs text-[#a9cdc7]">çevrimiçi</small>
          </div>
        </div>

        {/* Mesajlar */}
        <div
          ref={listRef}
          className="flex h-[340px] flex-col gap-2.5 overflow-y-auto bg-[linear-gradient(180deg,#f4fbfa,#eaf7f5)] p-5 md:px-7"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.from === "user"
                  ? "pf-msg max-w-[78%] origin-bottom-right self-end rounded-[18px] rounded-br-[5px] bg-brand px-[15px] py-[11px] text-[15px] text-white"
                  : "pf-msg max-w-[78%] origin-bottom-left self-start rounded-[18px] rounded-bl-[5px] border border-line bg-white px-[15px] py-[11px] text-[15px] text-ink"
              }
            >
              {m.text}
            </div>
          ))}

          {typing && (
            <div
              className="pf-msg flex origin-bottom-left gap-[5px] self-start rounded-[18px] rounded-bl-[5px] border border-line bg-white px-4 py-3.5"
              aria-label="Bot yazıyor"
            >
              <i className="pf-dot" />
              <i className="pf-dot" />
              <i className="pf-dot" />
            </div>
          )}
        </div>

        {/* Soru butonları */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-white px-[18px] pb-[18px] pt-3.5 md:px-7">
          {questions.map((item, i) => (
            <button
              key={item.q}
              type="button"
              onClick={() => ask(i)}
              disabled={typing || asked.includes(i)}
              className="rounded-full border-[1.5px] border-brand px-[15px] py-[9px] text-sm font-semibold text-brand-dark transition enabled:hover:-translate-y-0.5 enabled:hover:bg-brand enabled:hover:text-white disabled:cursor-default disabled:opacity-45"
            >
              {item.q}
            </button>
          ))}

          {allAsked && (
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=norelsoft@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="pf-msg ml-auto text-sm font-bold text-brand hover:text-brand-dark"
            >
              Başka sorun mu var? Bize yaz →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}