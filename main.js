const SCALE = 2;
const FRAME_W = 80;
const FRAME_H = 80;
const FRAMES = 4;
const ACTIONS = ["walk", "run", "bike", "surf", "dive", "fish"];

const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const actionSelect = document.getElementById("actionSelect");
const dropContainer = document.getElementById("dropFields");

let frameIndex = 0;
let directionIndex = 0; // 0 = Down, 1 = Left, 2 = Right, 3 = Up
let currentAction = "walk";
let playing = true; // Animation flag

// Base sprites (default paths)
const baseSprites = {};
ACTIONS.forEach(action => {
    baseSprites[action] = `resources/base/overworld/4/${action}_4.png`;
});

// Uploaded overlay sprites
const overlays = {}; // URL
const overlayImages = {}; // Image object

// Mini canvases inside drop fields
const dropFields = {};

// Load initial base
const baseImages = {};
baseImages[currentAction] = new Image();
baseImages[currentAction].src = baseSprites[currentAction];
baseImages[currentAction].onload = drawFrame;

// Create empty drag & drop fields
ACTIONS.forEach(action => {
    const wrapper = document.createElement("div");
    wrapper.className = "drop-wrapper";

    const label = document.createElement("div");
    label.textContent = action.charAt(0).toUpperCase() + action.slice(1);
    label.className = "drop-label";
    wrapper.appendChild(label);

    const field = document.createElement("canvas");
    field.width = FRAME_W;
    field.height = FRAME_H;
    field.className = "drop-field";
    wrapper.appendChild(field);
    dropContainer.appendChild(wrapper);

    const ctxField = field.getContext("2d");
    ctxField.imageSmoothingEnabled = false;

    dropFields[action] = { canvas: field, ctx: ctxField };

    // Drag & drop events
    field.addEventListener("dragover", e => { e.preventDefault(); field.classList.add("dragover"); });
    field.addEventListener("dragleave", () => field.classList.remove("dragover"));
    field.addEventListener("drop", e => {
        e.preventDefault();
        field.classList.remove("dragover");

        const file = e.dataTransfer.files[0];
        if (file && file.type === "image/png") {
            const url = URL.createObjectURL(file);
            overlays[action] = url;

            // Load overlay image
            const img = new Image();
            img.src = url;
            overlayImages[action] = img;

            img.onload = () => {
                // Show overlay in field
                drawDropField(action);
                // Auto-switch main preview to this action
                switchAction(action)
            };
        }
    });
    field.addEventListener("click", () => {
        switchAction(action);
    });
});

// Play/Pause & Next Frame buttons
const playPauseBtn = document.getElementById("playPauseBtn");
const nextFrameBtn = document.getElementById("nextFrameBtn");

playPauseBtn.addEventListener("click", () => {
    playing = !playing;
    playPauseBtn.textContent = playing ? "Pause" : "Play";
});

nextFrameBtn.addEventListener("click", () => {
    frameIndex = (frameIndex + 1) % FRAMES;
    drawFrame();
    ACTIONS.forEach(a => { if (overlays[a]) drawDropField(a); });
});

// Reusable function to switch action
function switchAction(action) {
    currentAction = action;
    actionSelect.value = action;

    if (!baseImages[currentAction]) {
        const img = new Image();
        img.src = baseSprites[currentAction];
        img.onload = drawFrame;
        baseImages[currentAction] = img;
    } else {
        drawFrame();
    }
}

// Action selector
actionSelect.addEventListener("change", e => {
    switchAction(e.target.value);
});

// Arrow key support
const DIRECTIONS = { "ArrowDown": 0, "ArrowLeft": 1, "ArrowRight": 2, "ArrowUp": 3 };
document.addEventListener("keydown", e => {
    if (DIRECTIONS.hasOwnProperty(e.key)) {
        directionIndex = DIRECTIONS[e.key];
        drawFrame();
        // Update mini drop fields to follow direction
        ACTIONS.forEach(a => { if (overlays[a]) drawDropField(a); });
    }
});

// Draw main canvas
function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const baseImg = baseImages[currentAction];
    if (!baseImg.complete) return;

    ctx.drawImage(
        baseImg,
        frameIndex * FRAME_W, directionIndex * FRAME_H,
        FRAME_W, FRAME_H,
        0, 0, FRAME_W * SCALE, FRAME_H * SCALE
    );

    const overlay = overlayImages[currentAction];
    if (overlay && overlay.complete) {
        ctx.drawImage(
            overlay,
            frameIndex * FRAME_W, directionIndex * FRAME_H,
            FRAME_W, FRAME_H,
            0, 0, FRAME_W * SCALE, FRAME_H * SCALE
        );
    }
}

// Draw mini overlay in drop field
function drawDropField(action) {
    const field = dropFields[action];
    if (!field || !overlayImages[action]) return;

    const ctxF = field.ctx;
    ctxF.clearRect(0, 0, FRAME_W, FRAME_H);

    const img = overlayImages[action];
    if (!img.complete) return;

    ctxF.drawImage(
        img,
        frameIndex * FRAME_W, directionIndex * FRAME_H,
        FRAME_W, FRAME_H,
        0, 0, FRAME_W, FRAME_H
    );
}

// Animate frames
let fps = 6;
let lastTime = 0;

const speedSlider = document.getElementById("speedSlider");
const speedLabel = document.getElementById("speedLabel");

speedSlider.addEventListener("input", e => {
    fps = parseInt(e.target.value);
    speedLabel.textContent = `${fps} FPS`;
});

// Animation loop using requestAnimationFrame for smooth speed control
function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;

    if (playing && delta >= 1000 / fps) {
        frameIndex = (frameIndex + 1) % FRAMES;
        drawFrame();
        ACTIONS.forEach(a => { if (overlays[a]) drawDropField(a); });
        lastTime = timestamp;
    }

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

