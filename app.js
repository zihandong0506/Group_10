import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// View Elements
const authView = document.getElementById('authView');
const homeView = document.getElementById('homeView');
const sellView = document.getElementById('sellView');
const bottomNav = document.getElementById('bottomNav');
const productGrid = document.getElementById('productGrid');

// Nav Buttons
const navHome = document.getElementById('navHome');
const navSell = document.getElementById('navSell');
const navProfile = document.getElementById('navProfile');

// Form Elements
const formTitle = document.getElementById('formTitle');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const mainAuthBtn = document.getElementById('mainAuthBtn');
const toggleModeBtn = document.getElementById('toggleModeBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');

let isLoginMode = true;

// --- Auth Logic ---
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

onAuthStateChanged(auth, (user) => {
    if (user) {
        authView.classList.add('hidden');
        homeView.classList.remove('hidden');
        bottomNav.classList.remove('hidden');
        
        saveUserToDatabase(user);
        fetchProductsFromDatabase();
    } else {
        authView.classList.remove('hidden');
        homeView.classList.add('hidden');
        sellView.classList.add('hidden');
        bottomNav.classList.add('hidden');
        emailInput.value = '';
        passwordInput.value = '';
    }
});

async function saveUserToDatabase(user) {
    try {
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            lastLoginTime: new Date().toISOString()
        }, { merge: true });
    } catch (error) {
        console.error("Database error:", error);
    }
}

// --- Navigation Logic ---
function switchView(viewName) {
    homeView.classList.add('hidden');
    sellView.classList.add('hidden');
    navHome.classList.remove('active');
    navSell.classList.remove('active');

    if (viewName === 'home') {
        homeView.classList.remove('hidden');
        navHome.classList.add('active');
        fetchProductsFromDatabase(); 
    } else if (viewName === 'sell') {
        sellView.classList.remove('hidden');
        navSell.classList.add('active');
    }
}

navHome.addEventListener('click', () => switchView('home'));
navSell.addEventListener('click', () => switchView('sell'));

navProfile.addEventListener('click', () => {
    if(confirm("Do you want to logout?")) {
        signOut(auth).catch(err => console.error("Logout error", err));
    }
});

// --- Database Logic: Read Products ---
async function fetchProductsFromDatabase() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        
        if (querySnapshot.empty) {
            productGrid.innerHTML = `<div class="empty-state">No items available right now.<br>Be the first to sell something!</div>`;
            return;
        }

        productGrid.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const productHTML = `
                <div class="product-card">
                    <div class="img-placeholder">Image Here</div>
                    <h3>${data.title}</h3>
                    <div class="condition">Condition: ${data.condition}</div>
                    <p class="price">$${parseFloat(data.price).toFixed(2)}</p>
                </div>
            `;
            productGrid.innerHTML += productHTML;
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        productGrid.innerHTML = `<div class="empty-state" style="color:red;">Failed to load data. Check console.</div>`;
    }
}

// --- Database Logic: Write/Publish Product ---
const submitPostBtn = document.getElementById('submitPostBtn');
if (submitPostBtn) {
    submitPostBtn.addEventListener('click', async () => {
        const title = document.getElementById('postTitle').value;
        const price = document.getElementById('postPrice').value;
        const condition = document.getElementById('postCondition').value;

        if (!title || !price) {
            alert("Please fill in both title and price!");
            return;
        }

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
            document.getElementById('postCondition').value = 'Brand New';

            switchView('home');
        } catch (error) {
            console.error("Error publishing item:", error);
            alert("Failed to publish item.");
        } finally {
            submitPostBtn.innerText = "Publish Item";
            submitPostBtn.disabled = false;
        }
    });
}