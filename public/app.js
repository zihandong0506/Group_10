import { auth, db } from "./firebase-init.js";
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, setDoc, getDoc, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { initProfileLogic } from "./profile.js";
import { initVerificationLogic, checkStudentStatusUI } from "./verification.js";

const authView = document.getElementById('authView');
const homeView = document.getElementById('homeView');
const sellView = document.getElementById('sellView');
const profileView = document.getElementById('profileView');
const bottomNav = document.getElementById('bottomNav');
const productGrid = document.getElementById('productGrid');

const navHome = document.getElementById('navHome');
const navSell = document.getElementById('navSell');
const navProfile = document.getElementById('navProfile');

const formTitle = document.getElementById('formTitle');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const mainAuthBtn = document.getElementById('mainAuthBtn');
const toggleModeBtn = document.getElementById('toggleModeBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');

let isLoginMode = true;

initProfileLogic();
initVerificationLogic();

toggleModeBtn.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        formTitle.innerText = "Student Login";
        mainAuthBtn.innerText = "Login";
        toggleModeBtn.innerText = "Don't have an account? Sign up";
    } else {
        formTitle.innerText = "Create Account";
        mainAuthBtn.innerText = "Sign Up";
        toggleModeBtn.innerText = "Already have an account? Login";
    }
});

mainAuthBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    if (!email || !password) return alert("Please enter credentials!");

    if (isLoginMode) {
        signInWithEmailAndPassword(auth, email, password).catch(err => alert("Login Error: " + err.message));
    } else {
        createUserWithEmailAndPassword(auth, email, password).catch(err => alert("Signup Error: " + err.message));
    }
});

googleLoginBtn.addEventListener('click', () => {
    signInWithPopup(auth, new GoogleAuthProvider()).catch(err => alert("Google Auth Error: " + err.message));
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        authView.classList.add('hidden');
        homeView.classList.remove('hidden');
        bottomNav.classList.remove('hidden');
        await saveUserToDatabase(user);
        fetchProductsFromDatabase();
    } else {
        authView.classList.remove('hidden');
        homeView.classList.add('hidden');
        sellView.classList.add('hidden');
        profileView.classList.add('hidden');
        bottomNav.classList.add('hidden');
        emailInput.value = '';
        passwordInput.value = '';
    }
});

// --- 核心更新：注册/登录时自动进行学生认证 ---
async function saveUserToDatabase(user) {
    try {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        
        // 基础资料
        let userData = {
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            lastLoginTime: new Date().toISOString()
        };

        // 如果用户是第一次用学校邮箱注册/登录，直接自动颁发学生认证！
        const emailStr = user.email.toLowerCase().trim();
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ca)$/;
        const domain = emailStr.split('@')[1];
        const allowedDomains = ["cornell.edu", "columbia.edu", "nyu.edu", "utoronto.ca", "ubc.ca", "mcgill.ca"];

        // 仅当用户当前没有 isStudent 标签，且邮箱符合规定时执行自动认证
        if ((!docSnap.exists() || !docSnap.data().isStudent) && regex.test(emailStr) && allowedDomains.includes(domain)) {
            userData.isStudent = true;
            userData.studentEmail = emailStr;
            userData.university = domain;
            console.log("Auto-verified student via login email!");
        }

        await setDoc(userRef, userData, { merge: true });
    } catch (error) {
        console.error("Database error:", error);
    }
}

function switchView(viewName) {
    homeView.classList.add('hidden');
    sellView.classList.add('hidden');
    profileView.classList.add('hidden');
    navHome.classList.remove('active');
    navSell.classList.remove('active');
    navProfile.classList.remove('active');

    if (viewName === 'home') {
        homeView.classList.remove('hidden');
        navHome.classList.add('active');
        fetchProductsFromDatabase(); 
    } else if (viewName === 'sell') {
        sellView.classList.remove('hidden');
        navSell.classList.add('active');
    } else if (viewName === 'profile') {
        profileView.classList.remove('hidden');
        navProfile.classList.add('active');
        loadProfileData(); 
    }
}

navHome.addEventListener('click', () => switchView('home'));
navSell.addEventListener('click', () => switchView('sell'));
navProfile.addEventListener('click', () => switchView('profile'));

document.getElementById('logoutBtn').addEventListener('click', () => {
    if(confirm("Are you sure you want to log out?")) {
        signOut(auth).catch(err => console.error("Logout error", err));
    }
});

async function loadProfileData() {
    const user = auth.currentUser;
    if (!user) return;
    
    document.getElementById('profileName').innerText = user.displayName || user.email.split('@')[0];
    document.getElementById('profileEmail').innerText = user.email;

    if (user.photoURL) {
        document.getElementById('userAvatar').innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    } else {
        document.getElementById('userAvatar').innerHTML = '👤';
    }

    const docSnap = await getDoc(doc(db, "users", user.uid));
    
    if (docSnap.exists() && docSnap.data().isStudent) {
        document.getElementById('profileEmail').innerText = docSnap.data().studentEmail;
    }

    await checkStudentStatusUI();
}

async function fetchProductsFromDatabase() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        if (querySnapshot.empty) {
            productGrid.innerHTML = `<div class="empty-state">No items available right now.</div>`;
            return;
        }
        productGrid.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            productGrid.innerHTML += `
                <div class="product-card">
                    <div class="img-placeholder">Image Here</div>
                    <h3>${data.title}</h3>
                    <div class="condition">Condition: ${data.condition}</div>
                    <p class="price">$${parseFloat(data.price).toFixed(2)}</p>
                </div>`;
        });
    } catch (error) {
        productGrid.innerHTML = `<div class="empty-state" style="color:red;">Failed to load data.</div>`;
    }
}

const submitPostBtn = document.getElementById('submitPostBtn');
if (submitPostBtn) {
    submitPostBtn.addEventListener('click', async () => {
        const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (!docSnap.exists() || !docSnap.data().isStudent) {
            alert("Only verified students can post items! Please go to your Profile to verify your .edu email.");
            switchView('profile');
            return;
        }

        const title = document.getElementById('postTitle').value;
        const price = document.getElementById('postPrice').value;
        const condition = document.getElementById('postCondition').value;

        if (!title || !price) return alert("Please fill in both title and price!");

        try {
            submitPostBtn.innerText = "Publishing...";
            submitPostBtn.disabled = true;
            await addDoc(collection(db, "products"), {
                title: title,
                price: price,
                condition: condition,
                sellerId: auth.currentUser.uid,
                createdAt: new Date().toISOString()
            });
            alert("Item published successfully!");
            document.getElementById('postTitle').value = '';
            document.getElementById('postPrice').value = '';
            switchView('home');
        } catch (error) {
            alert("Failed to publish item.");
        } finally {
            submitPostBtn.innerText = "Publish Item";
            submitPostBtn.disabled = false;
        }
    });
}