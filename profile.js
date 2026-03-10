import { auth, db, storage } from "./firebase-init.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

export function initProfileLogic() {
    // --- 1. Address Book 逻辑 ---
    const addressBtn = document.getElementById('addressBookBtn');
    const addressModal = document.getElementById('addressModal');
    const closeAddressModal = document.getElementById('closeAddressModal');
    const saveAddressBtn = document.getElementById('saveAddressBtn');

    if (addressBtn) {
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

        closeAddressModal.addEventListener('click', () => addressModal.classList.add('hidden'));

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
                alert("Failed to save address.");
            } finally {
                saveAddressBtn.innerText = "Save Address";
                saveAddressBtn.disabled = false;
            }
        });
    }

    // --- 2. Edit Profile (头像与用户名) 逻辑 ---
    const editProfileBtn = document.querySelector('.edit-btn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeEditProfileModal = document.getElementById('closeEditProfileModal');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const avatarInput = document.getElementById('avatarInput');
    const previewAvatar = document.getElementById('previewAvatar');
    const editNameInput = document.getElementById('editNameInput');

    let selectedImageFile = null;

    if (editProfileBtn) {
        // 点击 Edit 按钮，打开弹窗并填入现有资料
        editProfileBtn.addEventListener('click', () => {
            const user = auth.currentUser;
            editNameInput.value = user.displayName || user.email.split('@')[0];
            
            if (user.photoURL) {
                previewAvatar.innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                previewAvatar.innerHTML = '👤';
            }
            editProfileModal.classList.remove('hidden');
        });
    }

    // 点击头像占位符，触发隐藏的 file input
    if (previewAvatar) {
        previewAvatar.addEventListener('click', () => avatarInput.click());
    }

    // 本地图片预览逻辑
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                selectedImageFile = file;
                const reader = new FileReader();
                reader.onload = (event) => {
                    previewAvatar.innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (closeEditProfileModal) {
        closeEditProfileModal.addEventListener('click', () => {
            editProfileModal.classList.add('hidden');
            selectedImageFile = null; // 取消时清空选中的文件
        });
    }

    // 保存头像和用户名到云端
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            const newName = editNameInput.value.trim();
            if (!newName) return alert("Display name cannot be empty.");

            saveProfileBtn.innerText = "Saving...";
            saveProfileBtn.disabled = true;

            try {
                let newPhotoURL = auth.currentUser.photoURL;

                // 如果用户选择了新照片，先上传到 Firebase Storage
                if (selectedImageFile) {
                    // 把图片存在 avatars 文件夹下，文件名为该用户的 UID（防止覆盖别人的）
                    const imageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
                    await uploadBytes(imageRef, selectedImageFile);
                    // 上传完成后，获取图片的公共下载链接
                    newPhotoURL = await getDownloadURL(imageRef);
                }

                // 1. 更新 Firebase 核心 Auth 档案
                await updateProfile(auth.currentUser, {
                    displayName: newName,
                    photoURL: newPhotoURL
                });

                // 2. 更新 Firestore 数据库档案 (用于其他用户看你的主页)
                await setDoc(doc(db, "users", auth.currentUser.uid), {
                    displayName: newName,
                    photoURL: newPhotoURL
                }, { merge: true });

                // 3. 立即更新当前界面的 UI
                document.getElementById('profileName').innerText = newName;
                if (newPhotoURL) {
                    document.getElementById('userAvatar').innerHTML = `<img src="${newPhotoURL}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                }

                alert("Profile updated successfully!");
                editProfileModal.classList.add('hidden');
            } catch (error) {
                console.error("Error updating profile:", error);
                alert("Failed to update profile.");
            } finally {
                saveProfileBtn.innerText = "Save Changes";
                saveProfileBtn.disabled = false;
                selectedImageFile = null;
            }
        });
    }
}