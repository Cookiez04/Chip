// src/main.js
import * as THREE from 'three';
import { createScene } from './scene.js';
import { createChip, createProps, createMallow } from './objects.js';
import { ChipController } from './chip.js';
import { callGemini } from './api.js';

// Initialization
const { scene, camera, renderer, controls } = createScene();

const rig = createChip();
scene.add(rig.group);

const props = createProps(rig);
scene.add(props.laptop); // Add to scene for global manipulation if needed

const mallow = createMallow();
scene.add(mallow);

const chipController = new ChipController(rig, props, mallow, scene);

// Chat UI Interaction
const chatBtn = document.getElementById('chat-toggle-btn');
const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
let isChatOpen = false;

chatBtn.addEventListener('click', () => {
    isChatOpen = !isChatOpen;
    chatWindow.classList.toggle('open', isChatOpen);
});

async function handleChat() {
    const userText = chatInput.value.trim();
    if (!userText) return;

    chipController.addMessage(userText, 'user');
    chatInput.value = '';

    try {
        const data = await callGemini(userText, "You are Chip. Short witty cookie reply.");
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Crumbs...";
        chipController.addMessage(reply, 'chip');
    } catch (error) {
        chipController.addMessage("Net error.", 'system');
    }
}

sendBtn.addEventListener('click', handleChat);
chatInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') handleChat();
});

// Animation Loop
const clock = new THREE.Clock();
document.getElementById('loading').style.opacity = 0;

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    if (time > chipController.nextThoughtTime) {
        chipController.consciousTick();
        chipController.nextThoughtTime = time + chipController.THOUGHT_INTERVAL;
    }

    chipController.updateAnimation(time);
    if (chipController.bubbleEl.classList.contains('visible')) {
        chipController.updateBubblePosition(camera);
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();
