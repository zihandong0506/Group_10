import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyC3BrcypGhOEqP9wvu4PnBFlDmTmtKdFXc",
    authDomain: "group-10-570d5.firebaseapp.com",
    projectId: "group-10-570d5",
    storageBucket: "group-10-570d5.firebasestorage.app",
    messagingSenderId: "330776905308",
    appId: "1:330776905308:web:251f0f1584e25925070899"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // 新增：导出 Storage 供其他文件使用