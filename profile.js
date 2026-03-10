import { auth, db } from "./firebase-init.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 导出一个初始化函数，给 app.js 调用
export function initProfileLogic() {
    const addressBtn = document.getElementById('addressBookBtn');
    const addressModal = document.getElementById('addressModal');
    const closeAddressModal = document.getElementById('closeAddressModal');
    const saveAddressBtn = document.getElementById('saveAddressBtn');

    if (!addressBtn) return;

    // 1. 点击 Address Book，打开弹窗并从数据库读取现有地址
    addressBtn.addEventListener('click', async () => {
        addressModal.classList.remove('hidden');
        
        try {
            const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
            if (snap.exists() && snap.data().address) {
                const addr = snap.data().address;
                document.getElementById('addrStreet').value = addr.street || '';
                document.getElementById('addrCity').value = addr.city || '';
                document.getElementById('addrZip').value = addr.zip || '';
            }
        } catch (error) {
            console.error("Failed to load address", error);
        }
    });

    // 2. 点击 Cancel，关闭弹窗
    closeAddressModal.addEventListener('click', () => {
        addressModal.classList.add('hidden');
    });

    // 3. 点击 Save，保存到 Firebase
    saveAddressBtn.addEventListener('click', async () => {
        const street = document.getElementById('addrStreet').value;
        const city = document.getElementById('addrCity').value;
        const zip = document.getElementById('addrZip').value;

        if (!street) return alert("Street address is required!");

        saveAddressBtn.innerText = "Saving...";
        saveAddressBtn.disabled = true;

        try {
            await setDoc(doc(db, "users", auth.currentUser.uid), {
                address: { street, city, zip }
            }, { merge: true });

            alert("Address successfully saved!");
            addressModal.classList.add('hidden');
        } catch (error) {
            console.error("Error saving address", error);
            alert("Failed to save address.");
        } finally {
            saveAddressBtn.innerText = "Save Address";
            saveAddressBtn.disabled = false;
        }
    });
}