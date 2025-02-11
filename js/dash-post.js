import {
    auth,
    db,
    signOut,
    doc,
    getDoc,
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
  } from "./firebase.js";
  
  const logoutButton = document.getElementById("logout-btn");
  const welcomeMessage = document.getElementById("welcome-message");
  const createPostBtn = document.getElementById("create-post-btn");
  const createPostModal = document.getElementById("create-post-modal");
  const closeModalIcon = document.getElementById("close-modal");
  const postText = document.getElementById("post-text");
  const postButton = document.getElementById("post-btn");
  const searchResultsContainer = document.getElementById("search-results-container");
  const myPostsBtn = document.getElementById("my-posts-btn");
  const modalTitle = document.getElementById("modal-title");
  
  let showingMyPosts = false;
  let currentEditingPostId = null;
  const userCache = new Map(); 
  
  document.addEventListener("DOMContentLoaded", async () => {
    const loggedInUserUID = localStorage.getItem("loggedInUserUID");
  
    if (loggedInUserUID) {
      const userDoc = await getDoc(doc(db, "users", loggedInUserUID));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${userData.username}!`;
      } else {
        localStorage.removeItem("loggedInUserUID");
        window.location.href = "login.html";
      }

      if (showingMyPosts) {
        loadMyPosts();
      } else {
        loadPosts();
      }
    } else {
      window.location.href = "login.html";
    }
  });

  if (logoutButton) {
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
  }

  if (createPostBtn) {
    createPostBtn.addEventListener("click", () => {
      openPostModal("Create Post", "");
    });
  }

  if (closeModalIcon) {
    closeModalIcon.addEventListener("click", closePostModal);
  }
  
  if (postButton) {
    postButton.addEventListener("click", async () => {
      const postContent = postText.value.trim();
  
      if (!postContent) {
        alert("Please enter some text for your post.");
        return;
      }
  
      if (postContent.length > 180) {
        alert(`Post content is too long! Please keep it under 180 characters. Current length: ${postContent.length}`);
        return;
      }
  
      postButton.disabled = true; 
  
      const loggedInUserUID = localStorage.getItem("loggedInUserUID");
  
      try {
        if (currentEditingPostId) {
          await updateDoc(doc(db, "posts", currentEditingPostId), {
            content: postContent,
          });
          console.log("Post updated successfully!");
        } else {
          await addDoc(collection(db, "posts"), {
            uid: loggedInUserUID,
            content: postContent,
            createdAt: serverTimestamp(),
          });
          console.log("Post created successfully!");
        }
  
        postText.value = "";
        closePostModal();
        if (showingMyPosts) {
          loadMyPosts();
        } else {
          loadPosts();
        }
      } catch (error) {
        alert(`Error: ${error.message}`);
      } finally {
        postButton.disabled = false; 
      }
    });
  }

  if (myPostsBtn) {
    myPostsBtn.addEventListener("click", () => {
      showingMyPosts ? loadPosts() : loadMyPosts();
      myPostsBtn.textContent = showingMyPosts ? "My Posts" : "All Posts";
      showingMyPosts = !showingMyPosts;
    });
  }

  async function loadPosts() {
    try {
      searchResultsContainer.innerHTML = "";
      const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const postsSnapshot = await getDocs(postsQuery);
      const posts = postsSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      renderPosts(posts);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  }

  async function loadMyPosts() {
    const loggedInUserUID = localStorage.getItem("loggedInUserUID");
    if (!loggedInUserUID) return;
  
    try {
      searchResultsContainer.innerHTML = "";
  
      const postsSnapshot = await getDocs(collection(db, "posts"));
      let posts = postsSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

      posts = posts.filter((post) => post.uid === loggedInUserUID);
  
      posts.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
  
      renderPosts(posts);
    } catch (error) {
      console.error("Error loading user posts:", error);
    }
  }

  function renderPosts(posts) {
    searchResultsContainer.innerHTML = "";
    const fragment = document.createDocumentFragment();
  
    posts.forEach((post) => {
      const postElement = createPostElement(post);
      fragment.appendChild(postElement);
    });
  
    searchResultsContainer.appendChild(fragment);
  }
  
  function createPostElement(post) {
    const postElement = document.createElement("div");
    postElement.classList.add("post-card");

    let username = userCache.get(post.uid) || "Loading...";

    let formattedTime = "No timestamp"; 
    if (post.createdAt) {
        const timestamp = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
        formattedTime = timestamp.toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
    });
    }

    postElement.innerHTML = `
    <p><strong>${username}</strong> - ${formattedTime}</p>
    <p>${post.content}</p>
    <div class="post-actions"></div>
    `;


  
    const postActions = postElement.querySelector(".post-actions");
    const loggedInUserUID = localStorage.getItem("loggedInUserUID");
  
    if (post.uid === loggedInUserUID && showingMyPosts) {
      const editButton = document.createElement("button");
      editButton.classList.add("action-btn", "edit-btn");
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => {
        openPostModal("Edit Post", post.content, post.id);
      });
  
      const deleteButton = document.createElement("button");
      deleteButton.classList.add("action-btn", "delete-btn");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this post?")) {
          deletePost(post.id);
        }
      });
  
      postActions.appendChild(editButton);
      postActions.appendChild(deleteButton);
    }
  
    fetchUsername(post.uid).then((fetchedUsername) => {
      postElement.querySelector("strong").textContent = fetchedUsername;
    });
  
    return postElement;
  }
  
  async function fetchUsername(uid) {
    if (userCache.has(uid)) return userCache.get(uid);
  
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const username = userDoc.data().username;
        userCache.set(uid, username);
        return username;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
    return "Unknown User";
  }
  
  function openPostModal(title, content = "", postId = null) {
    modalTitle.textContent = title;
    postText.value = content;
    currentEditingPostId = postId;
    createPostModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  
  function closePostModal() {
    createPostModal.classList.add("hidden");
    document.body.style.overflow = "auto";
    currentEditingPostId = null;
  }
  
  async function deletePost(postId) {
    try {
      await deleteDoc(doc(db, "posts", postId));
      loadMyPosts();
    } catch (error) {
      alert(`Error deleting post: ${error.message}`);
    }
  }
  