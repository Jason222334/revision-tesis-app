"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, Send, Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "bot";
  content: string;
}

export function Chatbot() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "¡Hola! Soy tu asistente de tesis. ¿En qué puedo ayudarte hoy?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (!session) return null;

  const handleSend = async (text?: string) => {
    const messageToSend = text || input;
    if (!messageToSend.trim()) return;

    const newMessages = [...messages, { role: "user", content: messageToSend } as Message];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    console.log("Enviando mensaje al chatbot:", messageToSend);
    console.log("Estado de la sesión actual:", session);
    
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/chat`;
      console.log("URL de la API:", apiUrl);
      
      const token = (session as any)?.accessToken || (session as any)?.user?.accessToken;
      console.log("Token utilizado:", token ? "Token presente" : "Token ausente/undefined");

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Tu sesión ha expirado o es inválida. Por favor, CIERRA SESIÓN y vuelve a ingresar para usar el Chatbot.");
        }
        throw new Error(`Error en la respuesta: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Respuesta recibida:", data);
      setMessages([...newMessages, { role: "bot", content: data.response }]);
    } catch (error: any) {
      console.error("Error en chatbot:", error);
      setMessages([
        ...newMessages,
        { role: "bot", content: `Error: ${error.message || "No se pudo conectar con el asistente."}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "es-ES";
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <Card className="w-80 h-96 flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5">
          <div className="p-3 bg-primary text-primary-foreground flex justify-between items-center rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Asistente Tesis</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-2 rounded-lg text-sm relative group ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                    {m.role === "bot" && (
                      <button
                        onClick={() => speak(m.content)}
                        className="absolute -right-6 top-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-2 rounded-lg text-sm animate-pulse">Escribiendo...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-3 border-t flex gap-2">
            <Input
              placeholder="Pregunta algo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="text-xs"
            />
            <Button size="icon" className="h-9 w-9" onClick={() => handleSend()}>
              <Send className="w-4 h-4" />
            </Button>
            <Button
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              className="h-9 w-9"
              onClick={toggleListening}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}
