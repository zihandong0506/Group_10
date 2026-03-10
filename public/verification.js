import { auth, db } from "./firebase-init.js";
// 新增了 query, where, collection, getDocs 用于查重
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let mockVerificationCode = "";

const universityBranding = {
    "cornell.edu": { name: "Cornell Student", bg: "#B31B1B", text: "#FFFFFF" },
    "columbia.edu": { name: "Columbia Student", bg: "#B9D9EB", text: "#002B7F" },
    "nyu.edu": { name: "NYU Student", bg: "#57068C", text: "#FFFFFF" },
    "utoronto.ca": { name: "U of T Student", bg: "#002A5C", text: "#FFFFFF" },
    "ubc.ca": { name: "UBC Student", bg: "#002145", text: "#FFFFFF" },
    "mcgill.ca": { name: "McGill Student", bg: "#ED1B2F", text: "#FFFFFF" }
};

export function initVerificationLogic() {
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    const verifyCodeBtn = document.getElementById('verifyCodeBtn');

    if (!sendCodeBtn || !verifyCodeBtn) return;

    // 1. 发送验证码（加入查重拦截）
    sendCodeBtn.addEventListener('click', async () => {
        const eduEmail = document.getElementById('eduEmailInput').value.toLowerCase().trim();
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ca)$/;
        
        if (!regex.test(eduEmail)) {
            alert("Please enter a valid North American university email (.edu or .ca).");
            return;
        }

        const domain = eduEmail.split('@')[1];
        if (!universityBranding[domain]) {
            alert(`The domain "@${domain}" is not currently supported. Dormazon is expanding soon!`);
            return;
        }

        // --- 核心防线：检查该邮箱是否已经被别的账号绑定 ---
        try {
            const q = query(collection(db, "users"), where("studentEmail", "==", eduEmail));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                alert(`The email ${eduEmail} is already linked to an existing Dormazon account. Please log in directly with that email!`);
                return; // 立即拦截，不再发送验证码
            }
        } catch (error) {
            console.error("Error checking email uniqueness:", error);
            alert("System error. Please try again later.");
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

                await setDoc(doc(db, "users", auth.currentUser.uid), {
                    isStudent: true,
                    studentEmail: eduEmail,
                    university: universityDomain
                }, { merge: true });

                applyStudentBadgeUI(universityDomain);
                
                // 将个人资料里显示的邮箱立刻改成验证成功的学校邮箱
                document.getElementById('profileEmail').innerText = eduEmail;
                
                alert("🎉 Verification successful! Your exclusive university badge has been unlocked.");
                mockVerificationCode = ""; 

            } catch (error) {
                console.error("Fatal Database Error:", error);
                alert("❌ Database error during verification.");
            }
        } else {
            alert("❌ Incorrect verification code. Please try again.");
        }
    });
}

export async function checkStudentStatusUI() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists() && docSnap.data().isStudent) {
            applyStudentBadgeUI(docSnap.data().university);
        } else {
            document.getElementById('verifySection').classList.remove('hidden');
            document.getElementById('studentBadge').classList.add('hidden');
        }
    } catch (e) {
        console.error("Error loading student status UI:", e);
    }
}

function applyStudentBadgeUI(domain) {
    const badge = document.getElementById('studentBadge');
    const verifySection = document.getElementById('verifySection');
    
    const brandData = universityBranding[domain] || { name: "Verified Student", bg: "#e6f4ea", text: "#0f9d58" };

    badge.innerText = `🎓 ${brandData.name}`;
    badge.style.backgroundColor = brandData.bg;
    badge.style.color = brandData.text;
    badge.style.border = `1px solid ${brandData.bg}`;

    verifySection.classList.add('hidden');
    badge.classList.remove('hidden');
}