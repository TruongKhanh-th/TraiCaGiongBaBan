// ========================
// 🔹 Cấu hình Firebase
// ========================
const firebaseConfig = {
  apiKey: "AIzaSyACK383pbLnLA1refbDu6XQ4Dp_SqdHGW8",
  authDomain: "traicababan.firebaseapp.com",
  databaseURL: "https://traicababan-default-rtdb.firebaseio.com",
  projectId: "traicababan",
  storageBucket: "traicababan.appspot.com",
  messagingSenderId: "168039844429",
  appId: "1:168039844429:web:9f709934c6e6ad25d22a04",
  measurementId: "G-WE9MJJBPJW"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// ID Google admin (tài khoản của bạn)
const ADMIN_EMAIL = "truongquockhanh8526@gmail.com"; // 👉 đổi thành email Google của bạn

// ========================
// 🔹 Lấy tên cá theo tiêu đề trang
// ========================
const fishName = document.title.trim().toLowerCase().replace(/\s+/g, "-");

// ========================
// 🔹 Lấy điểm đánh giá từ thanh kéo
// ========================
let selectedRating = parseInt(document.getElementById("ratingRange").value);

document.getElementById("ratingRange").addEventListener("input", (e) => {
  selectedRating = parseInt(e.target.value);
});

// ========================
// 🔹 Đăng nhập / Đăng xuất Google
// ========================
const loginBtn = document.createElement("button");
loginBtn.className = "btn";
loginBtn.textContent = "🔑 Đăng nhập Google";
loginBtn.style.margin = "10px 0";
document.body.insertBefore(loginBtn, document.body.firstChild);

let currentUser = null;

loginBtn.addEventListener("click", () => {
  if (currentUser) {
    auth.signOut();
  } else {
    auth.signInWithPopup(provider);
  }
});

auth.onAuthStateChanged(user => {
  currentUser = user;
  if (user) {
    loginBtn.textContent = `👋 ${user.displayName} (Đăng xuất)`;
  } else {
    loginBtn.textContent = "🔑 Đăng nhập Google";
  }
  renderReviews(lastReviewsData);
});

// ========================
// 🔹 Gửi đánh giá mới
// ========================
document.getElementById("submitReview").addEventListener("click", () => {
  const name = document.getElementById("reviewerName").value.trim();
  const content = document.getElementById("reviewContent").value.trim();

  if (!name || !content || selectedRating === 0) {
    alert("Vui lòng chọn số sao, nhập tên và nội dung đánh giá!");
    return;
  }

  const review = {
    name,
    content,
    rating: selectedRating,
    timestamp: new Date().toISOString(),
  };

  db.ref(`reviews/${fishName}`).push(review);
  document.getElementById("reviewerName").value = "";
  document.getElementById("reviewContent").value = "";
  stars.forEach(s => s.classList.remove("selected"));
  selectedRating = 0;
});

// ========================
// 🔹 Trả lời & Xóa đánh giá (chỉ admin)
// ========================
function replyReview(reviewId) {
  const replyName = prompt("Nhập tên của bạn:");
  if (!replyName) return;
  const replyText = prompt("Nhập nội dung trả lời:");
  if (!replyText) return;

  const reply = {
    name: replyName,
    text: replyText,
    timestamp: new Date().toISOString(),
  };
  db.ref(`reviews/${fishName}/${reviewId}/replies`).push(reply);
}

function deleteReview(reviewId) {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    alert("Chỉ admin mới có thể xóa đánh giá!");
    return;
  }
  if (confirm("Bạn có chắc muốn xóa đánh giá này?")) {
    db.ref(`reviews/${fishName}/${reviewId}`).remove();
  }
}

function deleteReply(reviewId, replyId) {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    alert("Chỉ admin mới có thể xóa phản hồi!");
    return;
  }
  if (confirm("Bạn có chắc muốn xóa phản hồi này?")) {
    db.ref(`reviews/${fishName}/${reviewId}/replies/${replyId}`).remove();
  }
}

// ========================
// 🔹 Hiển thị danh sách đánh giá
// ========================
const listContainer = document.getElementById("reviewList");
const avgRating = document.getElementById("avgRating");
const totalReviews = document.getElementById("totalReviews");
let lastReviewsData = null;

function renderReviews(data) {
  lastReviewsData = data;
  listContainer.innerHTML = "";
  let total = 0;
  let count = 0;

  if (!data) {
    listContainer.innerHTML = "<p>Chưa có đánh giá nào.</p>";
    if (avgRating) avgRating.textContent = "0";
    if (totalReviews) totalReviews.textContent = "0";
    return;
  }

  const reviews = Object.entries(data).reverse();
  reviews.forEach(([id, r]) => {
    total += r.rating;
    count++;

    const div = document.createElement("div");
    div.className = "review-item";
    div.innerHTML = `
      <strong>${r.name}</strong> - Điểm: <b>${r.rating}/10</b><br>

      ${r.content}<br>
      <small>${new Date(r.timestamp).toLocaleString()}</small><br>
      <button class="btn" style="background:#666;" onclick="replyReview('${id}')">Trả lời</button>
      ${currentUser && currentUser.email === ADMIN_EMAIL ? `<button class="btn btn-delete" onclick="deleteReview('${id}')">Xóa</button>` : ""}
    `;

    if (r.replies) {
      const replies = Object.entries(r.replies);
      replies.forEach(([rid, rep]) => {
        const repDiv = document.createElement("div");
        repDiv.className = "reply";
        repDiv.style.marginLeft = "20px";
        repDiv.style.background = "#eef";
        repDiv.style.padding = "6px";
        repDiv.style.borderRadius = "6px";
        repDiv.innerHTML = `
          <strong>${rep.name}:</strong> ${rep.text}<br>
          <small>${new Date(rep.timestamp).toLocaleString()}</small><br>
          ${currentUser && currentUser.email === ADMIN_EMAIL ? `<button class="btn btn-delete" style="background:#b32d2e;padding:3px 6px;" onclick="deleteReply('${id}','${rid}')">Xóa</button>` : ""}
        `;
        div.appendChild(repDiv);
      });
    }

    listContainer.appendChild(div);
  });

  const avg = (total / count).toFixed(1);
  if (avgRating) avgRating.textContent = avg;
  if (totalReviews) totalReviews.textContent = count;
}

db.ref(`reviews/${fishName}`).on("value", snapshot => renderReviews(snapshot.val()));
