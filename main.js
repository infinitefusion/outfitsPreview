import { calculateOffset } from './offsets.js';

// ================================
// ======== CONFIG & CONSTANTS =====
// ================================
const SCALE = 2;
const FRAME_W = 80;
const FRAME_H = 80;
const FRAMES = 4;
const ACTIONS = ["walk", "run", "bike", "surf", "dive", "fish"];
const DIRECTIONS = { "ArrowDown": 0, "ArrowLeft": 1, "ArrowRight": 2, "ArrowUp": 3 };

// ================================
// ======== STATE VARIABLES =======
// ================================
let frameIndex = 0;
let directionIndex = 0;
let currentAction = "walk";
let playing = true;
let fps = 6;
let lastTime = 0;

let showHairstyle = true;
let showHat = true;

const baseSprites = {};
const baseImages = {};
const overlays = {};       // URL per overlay
const overlayImages = {};  // Image objects
const dropFields = {};     // Mini canvases

let skinTone = 4

function updateBaseSprites() {
    ACTIONS.forEach(action => {
        baseSprites[action] = `resources/base/overworld/${skinTone}/${action}_${skinTone}.png`;
    });
}
updateBaseSprites();

// ================================
// ======== DOM ELEMENTS ===========
// ================================
const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const actionSelect = document.getElementById("actionSelect");
const skinToneSelect = document.getElementById("skinToneSelect");
const dropContainer = document.getElementById("dropFields");
const speedSlider = document.getElementById("speedSlider");
const speedLabel = document.getElementById("speedLabel");
const playPauseBtn = document.getElementById("playPauseBtn");
const nextFrameBtn = document.getElementById("nextFrameBtn");
const canvasDropOverlay = document.getElementById("canvasDropOverlay");

skinToneSelect.value = skinTone;
const canvasArea = document.getElementById("canvasArea");

canvasArea.addEventListener("dragenter", e => {
    e.preventDefault();
    canvasDropOverlay.classList.add("active");
});

canvasArea.addEventListener("dragover", e => e.preventDefault());

canvasArea.addEventListener("dragleave", e => {
    // Only hide if leaving the canvasArea entirely
    if (!canvasArea.contains(e.relatedTarget)) {
        canvasDropOverlay.classList.remove("active");
    }
});

canvasArea.addEventListener("drop", e => {
    e.preventDefault();
    canvasDropOverlay.classList.remove("active");

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
        if (file.type !== "image/png") continue;

        const targetKey = detectDropTargetFromFilename(file.name);
        if (!targetKey) continue;

        loadFileIntoKey(file, targetKey);
    }
});




// ================================
// ======== HELPER FUNCTIONS =======
// ================================

// ---------- Drop Field ----------
function createDropField({ key, labelText, onClick, onLoadOverlay, container }) {
    const wrapper = document.createElement("div");
    wrapper.className = "drop-wrapper";

    const label = document.createElement("div");
    label.textContent = labelText;
    label.className = "drop-label";
    wrapper.appendChild(label);

    const field = document.createElement("canvas");
    field.width = FRAME_W;
    field.height = FRAME_H;
    field.className = "drop-field";
    wrapper.appendChild(field);

    (container || dropContainer).appendChild(wrapper);

    const ctxField = field.getContext("2d");
    ctxField.imageSmoothingEnabled = false;
    dropFields[key] = { canvas: field, ctx: ctxField };

    // Drag & Drop
    field.addEventListener("dragover", e => { e.preventDefault(); field.classList.add("dragover"); });
    field.addEventListener("dragleave", () => field.classList.remove("dragover"));
    field.addEventListener("drop", e => handleDrop(e, key, onLoadOverlay));

    if (onClick) field.addEventListener("click", () => onClick(key));
}

function handleDrop(e, key, onLoadOverlay) {
    e.preventDefault();
    const field = dropFields[key].canvas;
    field.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    loadFileIntoKey(file, key);

    if (onLoadOverlay) onLoadOverlay(key);
}

function loadFileIntoKey(file, key) {
    if (!file || file.type !== "image/png") return;

    const url = URL.createObjectURL(file);
    overlays[key] = url;

    const img = new Image();
    img.src = url;
    overlayImages[key] = img;

    img.onload = () => {
        drawDropField(key);

        // Auto-switch action if relevant
        if (ACTIONS.includes(key)) {
            switchAction(key);
        } else {
            drawFrame();
        }
    };
}


function detectDropTargetFromFilename(filename){
    const name = filename.toLowerCase();
    for (const action of ACTIONS) {
        if(name.includes("_" + action + "_")) return action;
    }
    if (name.includes("hat") && !name.includes("trainer")) return "hat";
    if (name.includes("hair") && !name.includes("trainer")) return "hairstyle";
}


// ---------- Action Drop Field ----------
function createActionDropField(action) {
    createDropField({
        key: action,
        labelText: action.charAt(0).toUpperCase() + action.slice(1),
        onClick: switchAction,
        onLoadOverlay: switchAction
    });
}

// ---------- Toggle inside label ----------
function createLabelToggle(container, labelSelector, initialValue, onChange, id) {
    const wrapper = container.querySelector(".drop-wrapper");
    const label = wrapper.querySelector(labelSelector);

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = initialValue;
    toggle.className = "toggle-switch";
    toggle.id = id;
    toggle.style.marginLeft = "8px";

    label.appendChild(toggle);
    toggle.addEventListener("change", () => onChange(toggle.checked));
}

// ---------- Draw Mini Drop Field ----------
function drawDropField(key) {
    const field = dropFields[key];
    const img = overlayImages[key];
    if (!field || !img || !img.complete) return;

    const ctxF = field.ctx;
    ctxF.clearRect(0, 0, FRAME_W, FRAME_H);

    if (key === "hat") {
        ctxF.drawImage(img, 0, directionIndex * FRAME_H, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
    } else {
        ctxF.drawImage(img, frameIndex * FRAME_W, directionIndex * FRAME_H, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
    }
}

// ---------- Switch Action ----------
function switchAction(action) {
    currentAction = action;
    actionSelect.value = action;
    if (!baseImages[action]) {
        const img = new Image();
        img.src = baseSprites[action];
        img.onload = drawFrame;
        baseImages[action] = img;
    } else drawFrame();
}

function switchSkinTone(tone) {
    skinTone = tone;
    skinToneSelect.value = tone;
    updateBaseSprites();
    ACTIONS.forEach(action => {
        delete baseImages[action];
    });

    const img = new Image();
    img.src = baseSprites[currentAction];
    img.onload = drawFrame;
    baseImages[currentAction] = img;
}

// ================================
// ======== DRAW FUNCTIONS =========
// ================================
function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const baseImg = baseImages[currentAction];
    if (!baseImg.complete) return;

    ctx.drawImage(baseImg, frameIndex * FRAME_W, directionIndex * FRAME_H, FRAME_W, FRAME_H, 0, 0, FRAME_W * SCALE, FRAME_H * SCALE);

    const overlay = overlayImages[currentAction];
    if (overlay && overlay.complete) {
        ctx.drawImage(overlay, frameIndex * FRAME_W, directionIndex * FRAME_H, FRAME_W, FRAME_H, 0, 0, FRAME_W * SCALE, FRAME_H * SCALE);
    }

    const hairstyle = overlayImages["hairstyle"];
    if (showHairstyle && hairstyle && hairstyle.complete) {
        const [ox, oy] = calculateOffset(currentAction, directionIndex, frameIndex, false);
        ctx.drawImage(hairstyle, frameIndex * FRAME_W, directionIndex * FRAME_H, FRAME_W, FRAME_H, ox * SCALE, oy * SCALE, FRAME_W * SCALE, FRAME_H * SCALE);
    }

    const hat = overlayImages["hat"];
    if (showHat && hat && hat.complete) {
        const [ox, oy] = calculateOffset(currentAction, directionIndex, frameIndex, true);
        ctx.drawImage(hat, 0, directionIndex * FRAME_H, FRAME_W, FRAME_H, ox * SCALE, oy * SCALE, FRAME_W * SCALE, FRAME_H * SCALE);
    }
}

// ================================
// ======== INITIALIZATION =========
// ================================

// Load base image
baseImages[currentAction] = new Image();
baseImages[currentAction].src = baseSprites[currentAction];
baseImages[currentAction].onload = drawFrame;

// Create action fields
ACTIONS.forEach(createActionDropField);

// Hairstyle & Hat fields
createDropField({ key: "hairstyle", labelText: "Hairstyle", container: document.getElementById("hairstyleContainer"), onLoadOverlay: drawFrame });
createDropField({ key: "hat", labelText: "Hat", container: document.getElementById("hatContainer"), onLoadOverlay: drawFrame });
createLabelToggle(document.getElementById("hairstyleContainer"), ".drop-label", showHairstyle, v => { showHairstyle = v; drawFrame(); }, "hairstyleToggle");
createLabelToggle(document.getElementById("hatContainer"), ".drop-label", showHat, v => { showHat = v; drawFrame(); }, "hatToggle");

// ================================
// ======== CONTROLS ===============
// ================================
actionSelect.addEventListener("change", e => switchAction(e.target.value));
skinToneSelect.addEventListener("change", e => switchSkinTone(e.target.value));

document.addEventListener("keydown", e => {
    if (DIRECTIONS.hasOwnProperty(e.key)) {
        directionIndex = DIRECTIONS[e.key];
        drawFrame();
        ACTIONS.forEach(a => { if (overlays[a]) drawDropField(a); });
    }
});

playPauseBtn.addEventListener("click", () => {
    playing = !playing;
    playPauseBtn.textContent = playing ? "Pause" : "Play";
});

nextFrameBtn.addEventListener("click", () => {
    frameIndex = (frameIndex + 1) % FRAMES;
    drawFrame();
    ACTIONS.forEach(a => { if (overlays[a]) drawDropField(a); });
});

speedSlider.addEventListener("input", e => {
    fps = parseInt(e.target.value);
    speedLabel.textContent = `${fps} FPS`;
});

// ================================
// ======== ANIMATION LOOP =========
// ================================
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
