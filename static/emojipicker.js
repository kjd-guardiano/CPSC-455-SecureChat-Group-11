const emojiContainer = document.querySelector(".emoji-container");
const emojiInput = document.querySelector(".emoji-input");

const emojis = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "😉", "😍", "😘", "😗", "😚", "😋", "😜", "🤪", "😝", "🤑",
  "🤗", "🤔", "🤐", "🤨", "😐", "😑", "😶", "🙄", "😏", "😒",
  "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩",
  "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "👀", "😎", "👍",
  "👎", "🔥", "❤️", "💀", "🎉", "✨", "💯", "🙌", "👏", "🙏"
];

// Display the emojis
emojis.forEach((emoji) => {
  const emojiDiv = document.createElement("div");
  emojiDiv.classList.add("emoji");
  emojiDiv.innerText = emoji;
  emojiContainer.appendChild(emojiDiv);
});

// Show the emoji picker
emojiInput.addEventListener("focus", () => {
  emojiContainer.style.display = "grid"; // Must be grid for layout
});

// Hide the emoji picker shortly after blur
emojiInput.addEventListener("blur", () => {
  setTimeout(() => {
    emojiContainer.style.display = "none";
  }, 200);
});

// Insert clicked emoji into input
emojiContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("emoji")) {
    emojiInput.value += e.target.innerText;
  }
});