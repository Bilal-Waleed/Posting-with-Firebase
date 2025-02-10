import { 
  auth, db, signOut, doc, getDoc, query, collection, where, getDocs, limit, orderBy
} from "./firebase.js";

const logoutButton = document.getElementById("logout-btn");
const welcomeMessage = document.getElementById("welcome-message");
const searchInput = document.getElementById("search-input");
const searchResultContainer = document.getElementById("search-results-container");
const searchIcon = document.getElementById("search-icon");

document.addEventListener("DOMContentLoaded", async () => {
  const loggedInUserUID = localStorage.getItem("loggedInUserUID");

  if (loggedInUserUID) {
    const userDoc = await getDoc(doc(db, "users", loggedInUserUID));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      welcomeMessage.textContent = `Welcome, ${userData.username}!`;
    } else {
      console.log("No user data found. Redirecting to Login page...");
      localStorage.removeItem("loggedInUserUID");
      window.location.href = "login.html";
    }

    loadUsers();
  } else {
    console.log("No user logged in. Redirecting to Login page...");
    window.location.href = "login.html";
  }
});

async function loadUsers() {
  try {
    searchResultContainer.innerHTML = "";
    const usersRef = collection(db, "users");

    const q = query(usersRef, orderBy("createdAt", "desc"), limit(20));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(docSnapshot => {
      const userData = docSnapshot.data();
      const userUID = docSnapshot.id;

      const userCard = document.createElement("div");
      userCard.classList.add("user-card");

      userCard.innerHTML = `
        <div class="profile-circle">${userData.username.charAt(0).toUpperCase()}</div>
        <p><strong>${userData.username}</strong></p>
        <button class="follow-btn">Follow</button>
      `;

      searchResultContainer.appendChild(userCard);
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    searchResultContainer.textContent = "An error occurred while loading users.";
  }
}

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    localStorage.removeItem("loggedInUserUID");
    alert("Logged out successfully!");
    window.location.href = "login.html";
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});

async function handleSearch() {
  const username = searchInput.value.trim();
  if (!username) {
    loadUsers(); 
    return;
  }

  try {
    searchResultContainer.innerHTML = "";
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      querySnapshot.forEach(docSnapshot => {
        const userData = docSnapshot.data();
        const userUID = docSnapshot.id;

        const userCard = document.createElement("div");
        userCard.classList.add("user-card");

        userCard.innerHTML = `
          <div class="profile-circle">${userData.username.charAt(0).toUpperCase()}</div>
          <p><strong>${userData.username}</strong></p>
          <button class="follow-btn">Follow</button>
        `;
        searchResultContainer.appendChild(userCard);
      });
    } else {
      const noUserCard = document.createElement("div");
      noUserCard.classList.add("user-card");
      noUserCard.innerHTML = `<p>No user found with this username.</p>`;
      searchResultContainer.appendChild(noUserCard);
    }
  } catch (error) {
    console.error("Error searching user:", error);
    searchResultContainer.textContent = "An error occurred. Please try again.";
  }
}

searchInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});

searchIcon.addEventListener("click", handleSearch);

searchInput.addEventListener("input", () => {
  if (searchInput.value.trim() === "") {
    loadUsers();
  }
});
