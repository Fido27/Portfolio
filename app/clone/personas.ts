export type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
  ts: number;
  streaming?: boolean; // True while message is being streamed
};

export type ChatSession = {
  id: string;
  title: string;
  personaId: string;
  messages: Message[];
  updatedAt: number;
};

export type Persona = {
  id: string;
  name: string;
  description: string;
};

export const PERSONAS: Persona[] = [
  { id: "fido", name: "Fido", description: "Friendly and helpful – your AI companion." },
  { id: "tutor", name: "Tutor Quiglim", description: "Explains with steps and examples." },
  { id: "random", name: "Choose for me", description: "Picks a tone for each reply." },
];
