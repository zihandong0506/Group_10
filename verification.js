import { auth, db } from "./firebase-init.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let mockVerificationCode = "";

// 🎓 全新：大学品牌专属配色字典
// 这里的颜色都是各大学官方的品牌色 (Brand Colors)
const universityBranding = {
    "cornell.edu": { name: "Cornell Student", bg: "#B31B1B", text: "#FFFFFF" }, // 康奈尔红
    "columbia.edu": { name: "Columbia Student", bg: "#B9D9EB", text: "#002B7F" }, // 哥大蓝
    "nyu.edu": { name: "NYU Student", bg: "#57068C", text: "#FFFFFF" }, // NYU紫
    "utoronto.ca": { name: "U of T Student", bg: "#002A5C", text: "#FFFFFF" }, // 多伦多大学蓝
    "ubc.ca": { name: "UBC Student", bg: "#002145", text: "#FFFFFF" }, // UBC深蓝
    "mcgill.ca": { name: "McGill Student", bg: "#ED1B2F", text: "#FFFFFF" } // 麦吉尔红
};

export function initVerificationLogic() {
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    const verifyCodeBtn = document.getElementById('verifyCodeBtn');

    if (!sendCodeBtn || !verifyCodeBtn) return;

    // 1. 发送验证码
    sendCodeBtn.addEventListener('click', () => {
        const eduEmail = document.getElementById('eduEmailInput').value.toLowerCase().trim();
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ca)$/;
        
        if (!regex.test(eduEmail)) {
            alert("Please enter a valid North American university email (.edu or .ca).");
            return;
        }

        const domain = eduEmail.split('@')[1];
        
        // 判断是否在我们的字典白名单中
        if (!universityBranding[domain]) {
            alert(`The domain "@${domain}" is not currently supported. Dormazon is expanding soon!`);
            return;
        }

        mockVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        alert(`[PROTOTYPE SIMULATION]\n\nAn email has been "sent" to ${eduEmail}.\n\nYour verification code is: ${mockVerificationCode}`);
        document.getElementById('codeSection').classList.remove('hidden');
    });

    // 2. 点击验证按钮
    verifyCodeBtn.addEventListener('click', async () => {
        const inputCode = document.getElementById('codeInput').value.trim();
        
        if (inputCode === mockVerificationCode && inputCode !== "") {
            try {
                const eduEmail = document.getElementById('eduEmailInput').value.toLowerCase().trim();
                const universityDomain = eduEmail.split('@')[1];

                // 写入数据库
                await setDoc(doc(db, "users", auth.currentUser.uid), {
                    isStudent: true,
                    studentEmail: eduEmail,
                    university: universityDomain
                }, { merge: true });

                // 验证成功后，立刻调用 UI 刷新函数应用专属 UI
                applyStudentBadgeUI(universityDomain);
                
                alert("🎉 Verification successful! Your exclusive university badge has been unlocked.");
                mockVerificationCode = ""; // 清空内存验证码

            } catch (error) {
                console.error("Fatal Database Error:", error);
                alert("❌ Database error during verification.");
            }
        } else {
            alert("❌ Incorrect verification code. Please try again.");
        }
    });
}

// 供 app.js 每次加载 Profile 时调用的 UI 刷新函数
export async function checkStudentStatusUI() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists() && docSnap.data().isStudent) {
            // 如果是学生，传入他数据库里存的大学域名来渲染专属 UI
            applyStudentBadgeUI(docSnap.data().university);
        } else {
            document.getElementById('verifySection').classList.remove('hidden');
            document.getElementById('studentBadge').classList.add('hidden');
        }
    } catch (e) {
        console.error("Error loading student status UI:", e);
    }
}

// 核心：动态修改徽章样式 (Dynamic Styling)
function applyStudentBadgeUI(domain) {
    const badge = document.getElementById('studentBadge');
    const verifySection = document.getElementById('verifySection');
    
    // 从字典中获取该大学的专属数据。如果没有匹配到，提供一个默认的后备样式 (Fallback)
    const brandData = universityBranding[domain] || { name: "Verified Student", bg: "#e6f4ea", text: "#0f9d58" };

    // 注入专属文本和官方颜色
    badge.innerText = `🎓 ${brandData.name}`;
    badge.style.backgroundColor = brandData.bg;
    badge.style.color = brandData.text;
    badge.style.border = `1px solid ${brandData.bg}`;

    // 隐藏验证框，显示徽章
    verifySection.classList.add('hidden');
    badge.classList.remove('hidden');
}