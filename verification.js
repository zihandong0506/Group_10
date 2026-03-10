import { auth, db } from "./firebase-init.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 这个变量直接保存在前端内存中，用户不可见，页面不刷新就不会丢失
let mockVerificationCode = "";

export function initVerificationLogic() {
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    const verifyCodeBtn = document.getElementById('verifyCodeBtn');

    if (!sendCodeBtn || !verifyCodeBtn) return;

    // 发送验证码逻辑
    sendCodeBtn.addEventListener('click', () => {
        const eduEmail = document.getElementById('eduEmailInput').value.toLowerCase().trim();
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ca)$/;
        
        if (!regex.test(eduEmail)) {
            alert("Please enter a valid North American university email (.edu or .ca).");
            return;
        }

        const domain = eduEmail.split('@')[1];
        const allowedDomains = ["cornell.edu", "columbia.edu", "nyu.edu", "utoronto.ca", "ubc.ca", "mcgill.ca"];

        if (!allowedDomains.includes(domain)) {
            alert(`The domain "@${domain}" is not currently supported. Dormazon is expanding soon!`);
            return;
        }

        // 生成 6 位随机数并存入内存变量
        mockVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 模拟发送邮件的弹窗
        alert(`[PROTOTYPE SIMULATION]\n\nAn email has been "sent" to ${eduEmail}.\n\nYour verification code is: ${mockVerificationCode}`);
        
        // 显示输入验证码的区域
        document.getElementById('codeSection').classList.remove('hidden');
    });

    // 验证验证码逻辑
    verifyCodeBtn.addEventListener('click', async () => {
        const inputCode = document.getElementById('codeInput').value.trim();
        
        // 与内存中的变量进行严格比对
        if (inputCode === mockVerificationCode && inputCode !== "") {
            try {
                const eduEmail = document.getElementById('eduEmailInput').value.toLowerCase().trim();
                const universityDomain = eduEmail.split('@')[1];

                // 写入 Firebase 数据库，打上学生标签
                await setDoc(doc(db, "users", auth.currentUser.uid), {
                    isStudent: true,
                    studentEmail: eduEmail,
                    university: universityDomain
                }, { merge: true });

                // 强制、立刻更新界面：隐藏验证框，显示 🎓 学生小标
                document.getElementById('verifySection').classList.add('hidden');
                document.getElementById('studentBadge').classList.remove('hidden');
                
                alert("Verification successful! You can now sell items.");

                // 验证成功后清空内存中的验证码，防止重复利用
                mockVerificationCode = "";

            } catch (error) {
                console.error("Error updating verification status:", error);
                alert("Database error during verification.");
            }
        } else {
            alert("Incorrect verification code. Please try again.");
        }
    });
}