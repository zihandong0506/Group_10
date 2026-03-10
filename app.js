import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC3BrcypGhOEqP9wvu4PnBFlDmTmtKdFXc",
    authDomain: "group-10-570d5.firebaseapp.com",
    projectId: "group-10-570d5",
    storageBucket: "group-10-570d5.firebasestorage.app",
    messagingSenderId: "330776905308",
    appId: "1:330776905308:web:251f0f1584e25925070899"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Views
const authView = document.getElementById('authView');
const homeView = document.getElementById('homeView');
const sellView = document.getElementById('sellView');
const profileView = document.getElementById('profileView');
const bottomNav = document.getElementById('bottomNav');
const productGrid = document.getElementById('productGrid');

// Nav
const navHome = document.getElementById('navHome');
const navSell = document.getElementById('navSell');
const navProfile = document.getElementById('navProfile');

// Auth Form
const formTitle = document.getElementById('formTitle');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const mainAuthBtn = document.getElementById('mainAuthBtn');
const toggleModeBtn = document.getElementById('toggleModeBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');

let isLoginMode = true;

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

async function saveUserToDatabase(user) {
    try {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            lastLoginTime: new Date().toISOString()
        }, { merge: true });
    } catch (error) {
        console.error("Database error:", error);
    }
}

// --- Navigation ---
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

// --- Products Logic ---
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
        const userRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.data().isStudent) {
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

// --- Student Verification Logic ---
let mockVerificationCode = "";

async function loadProfileData() {
    const user = auth.currentUser;
    if (!user) return;
    
    document.getElementById('profileName').innerText = user.displayName || user.email.split('@')[0];
    document.getElementById('profileEmail').innerText = user.email;

    const docSnap = await getDoc(doc(db, "users", user.uid));
    const userData = docSnap.data();

    if (userData && userData.isStudent) {
        // UI Fix: Explicitly enforce UI changes when verified
        document.getElementById('verifySection').classList.add('hidden');
        document.getElementById('studentBadge').classList.remove('hidden');
    } else {
        document.getElementById('verifySection').classList.remove('hidden');
        document.getElementById('studentBadge').classList.add('hidden');
    }
}

document.getElementById('sendCodeBtn').addEventListener('click', () => {
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

    mockVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`[PROTOTYPE SIMULATION]\n\nAn email has been "sent" to ${eduEmail}.\n\nYour verification code is: ${mockVerificationCode}`);
    document.getElementById('codeSection').classList.remove('hidden');
});

document.getElementById('verifyCodeBtn').addEventListener('click', async () => {
    const inputCode = document.getElementById('codeInput').value.trim(); // Added trim to remove accidental spaces
    
    if (inputCode === mockVerificationCode && inputCode !== "") {
        try {
            const eduEmail = document.getElementById('eduEmailInput').value.toLowerCase().trim();
            const universityDomain = eduEmail.split('@')[1];

            // 1. Write to DB
            await setDoc(doc(db, "users", auth.currentUser.uid), {
                isStudent: true,
                studentEmail: eduEmail,
                university: universityDomain
            }, { merge: true });

            // 2. EXPLICIT UI FIX: Force the box to hide immediately without waiting for DB reload
            document.getElementById('verifySection').classList.add('hidden');
            document.getElementById('studentBadge').classList.remove('hidden');
            
            alert("Verification successful! You can now sell items.");

        } catch (error) {
            console.error("Error updating verification status:", error);
            alert("Database error during verification.");
        }
    } else {
        alert("Incorrect verification code. Please try again.");
    }
});