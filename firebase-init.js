import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 你的 Dormazon 专属配置
const firebaseConfig = {
    apiKey: "AIzaSyC3BrcypGhOEqP9wvu4PnBFlDmTmtKdFXc",
    authDomain: "group-10-570d5.firebaseapp.com",
    projectId: "group-10-570d5",
    storageBucket: "group-10-570d5.firebasestorage.app",
    messagingSenderId: "330776905308",
    appId: "1:330776905308:web:251f0f1584e25925070899"
};

// 初始化并导出 (Export)，让其他文件可以使用
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);