const emojiContainer = document.querySelector(".emoji-container");
const emojiInput = document.querySelector(".emoji-input");
  
const emojis = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "👍", "❤️", "👎", "😞", "👀", "😎"]; // add as many emojis as you want
  
// Display the emojis
emojis.forEach((emoji) => {
    const emojiDiv = document.createElement("div");
    emojiDiv.classList.add("emoji");
    emojiDiv.innerText = emoji;
    emojiContainer.appendChild(emojiDiv);
});

// Show the emoji picker when the input field is clicked
emojiInput.addEventListener("focus", () => {
    emojiContainer.style.display = "grid";
});

// Hide the emoji picker when it's not focused
emojiInput.addEventListener("blur", () => {
    setTimeout(() => {
        emojiContainer.style.display = "none";
    }, 200);
});

// Insert the clicked emoji into the input field
emojiContainer.addEventListener("click", (e) => {
    emojiInput.value += e.target.innerText;
});