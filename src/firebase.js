import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// ─────────────────────────────────────────────────────────
//  CONFIGURAÇÃO DO FIREBASE
//
//  1. Acesse https://console.firebase.google.com
//  2. Crie um projeto (ou use um existente)
//  3. Vá em "Realtime Database" → Criar banco de dados
//     Escolha o modo de teste por enquanto (mude as regras
//     de segurança antes de compartilhar com o grupo)
//  4. Em Visão geral do projeto → </> → Registrar app
//  5. Cole os valores do firebaseConfig abaixo
// ─────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
