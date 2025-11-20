// src/chip.js
import * as THREE from 'three';
import { callGemini } from './api.js';
import { materials } from './objects.js';

export class ChipController {
    constructor(rig, props, mallow, scene) {
        this.rig = rig;
        this.props = props;
        this.mallow = mallow;
        this.scene = scene;

        this.currentState = "IDLE";
        this.actionHistory = ["IDLE"];
        this.nextThoughtTime = 0;
        this.THOUGHT_INTERVAL = 20;

        this.bubbleEl = document.getElementById('thought-bubble');
        this.statusIndicator = document.getElementById('consciousness-status');
        this.messagesContainer = document.getElementById('chat-messages');

        // Initial message
        this.addMessage("I've got legs now! And a little friend called Mallow. Let's explore! ✨", 'chip');
    }

    showThought(text) {
        this.bubbleEl.innerText = text;
        this.bubbleEl.classList.add('visible');
        this.updateBubblePosition(null); // Pass camera later or update in animate
        setTimeout(() => this.bubbleEl.classList.remove('visible'), 5000);
    }

    updateBubblePosition(camera) {
        if (!camera) return;
        const headPos = new THREE.Vector3(0, 5, 0);
        headPos.applyMatrix4(this.rig.group.matrixWorld);
        headPos.project(camera);
        const x = (headPos.x * .5 + .5) * window.innerWidth;
        const y = (-(headPos.y * .5) + .5) * window.innerHeight;
        this.bubbleEl.style.left = `${x}px`;
        this.bubbleEl.style.top = `${y - 100}px`;
    }

    addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;
        this.messagesContainer.appendChild(msgDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    resetPose() {
        this.props.laptop.visible = false;
        this.props.book.visible = false;
        this.props.wand.visible = false;
        materials.screen.color.setHex(0xffffff);
        // Note: Lights are in scene.js, we might need to pass them or access via scene
        // For now, let's assume simple resets or we can emit events.
        // scene.background.setHex(0x202025); // This needs access to scene
        materials.wandTip.color.setHex(0x00ffff);
        this.rig.group.position.y = 0;
    }

    async consciousTick() {
        this.statusIndicator.innerText = "Thinking...";
        const historyStr = this.actionHistory.slice(-3).join(", ");

        const systemPrompt = `
            You are Chip, a sentient 3D cookie with a sidekick Mallow.
            Current state history: [${historyStr}].
            Choose a NEW action (do not repeat the last one).

            ACTIONS:
            - "WALK": Pace around thinking.
            - "READ": Read a book.
            - "MAGIC": Cast a spell with wand.
            - "DANCE": Disco time.
            - "SLEEP": Nap.
            - "WORK": Code on laptop.
            - "FLOAT": Anti-gravity.

            Return JSON: {"action": "ACTION_NAME", "thought": "internal monologue (max 10 words)"}
        `;

        try {
            const data = await callGemini("What's next?", systemPrompt);
            const decision = JSON.parse(data.candidates[0].content.parts[0].text);

            console.log("Chip Decided:", decision);
            this.showThought(decision.thought);
            this.addMessage(`*begins to ${decision.action.toLowerCase()}*`, 'system');

            this.resetPose();
            this.currentState = decision.action;
            this.actionHistory.push(this.currentState);
            this.statusIndicator.innerText = `Currently: ${decision.action}`;

            // Instant Prop Setup
            if(this.currentState === "WORK") {
                 this.props.laptop.visible = true;
                 this.props.laptop.position.copy(this.rig.leftHand.getWorldPosition(new THREE.Vector3()));
            }
            if(this.currentState === "READ") this.props.book.visible = true;
            if(this.currentState === "MAGIC") this.props.wand.visible = true;

        } catch (e) {
            console.error("Consciousness Glitch:", e);
            this.statusIndicator.innerText = "Brain Freeze";
        }
    }

    updateAnimation(time) {
        // Default/Reset targets
        let targetY = 0;
        let targetX = 0;
        let targetRotY = Math.sin(time * 0.5) * 0.1;
        let leftArmRotX = 0; let rightArmRotX = 0;
        let leftLegRotX = 0; let rightLegRotX = 0;
        let mallowTargetY = 2 + Math.sin(time * 2) * 0.2;
        let mallowTargetX = 4;

        // We need to access the scene background color somehow if we want to change it
        // Ideally we pass a callback or the scene object is mutable.
        // this.scene is available.

        switch(this.currentState) {
            case "WALK":
                const walkSpeed = 5;
                const stride = 0.6;
                leftLegRotX = Math.sin(time * walkSpeed) * stride;
                rightLegRotX = Math.sin(time * walkSpeed + Math.PI) * stride;
                leftArmRotX = Math.sin(time * walkSpeed + Math.PI) * (stride * 0.5);
                rightArmRotX = Math.sin(time * walkSpeed) * (stride * 0.5);

                targetX = Math.sin(time * 0.5) * 6;
                targetRotY = Math.PI / 2 * (Math.cos(time * 0.5) > 0 ? 1 : -1);
                targetY = Math.abs(Math.sin(time * walkSpeed)) * 0.3;
                mallowTargetX = targetX - (Math.cos(time * 0.5) > 0 ? 3 : -3);
                if(this.scene) this.scene.background.setHex(0x202025);
                break;

            case "READ":
                targetY = -3;
                leftLegRotX = -Math.PI / 2;
                rightLegRotX = -Math.PI / 2;
                leftArmRotX = -0.5;
                rightArmRotX = -1;
                mallowTargetX = 2;
                mallowTargetY = 0;
                if(this.scene) this.scene.background.setHex(0x202025);
                break;

            case "MAGIC":
                rightArmRotX = Math.sin(time * 5) * 0.5 - 1;
                materials.wandTip.color.setHSL(time * 0.5 % 1, 1, 0.5);
                mallowTargetY = 3 + Math.sin(time * 10) * 1;
                if(this.scene) this.scene.background.setHex(0x202025);
                break;

            case "WORK":
                targetY = -3;
                leftLegRotX = -Math.PI / 2; rightLegRotX = -Math.PI / 2;
                leftArmRotX = -0.8; rightArmRotX = -0.8;
                this.props.laptop.position.set(this.rig.group.position.x, -4, 2.5);
                this.props.laptop.rotation.y = Math.PI;
                this.props.laptop.visible = true;
                materials.screen.emissiveIntensity = 0.5 + Math.sin(time * 15) * 0.5;
                if(this.scene) this.scene.background.setHex(0x202025);
                break;

            case "DANCE":
                if(this.scene) this.scene.background.setHex(0x442244);
                targetY = Math.abs(Math.sin(time * 8)) * 1.5;
                leftArmRotX = Math.sin(time * 10) * 2;
                rightArmRotX = Math.cos(time * 10) * 2;
                targetRotY = time * 2;
                mallowTargetY = 4;
                break;

            case "FLOAT":
                if(this.scene) this.scene.background.setHex(0x87CEEB);
                targetY = 3 + Math.sin(time) * 1;
                leftLegRotX = 0.5; rightLegRotX = 0.5;
                leftArmRotX = -Math.PI; rightArmRotX = -Math.PI;
                break;
            default:
                if(this.scene) this.scene.background.setHex(0x202025);
        }

        // Apply Animations (Lerping for smoothness)
        const s = 0.1;
        this.lerpPos(this.rig.group, 'y', targetY, s);
        this.lerpPos(this.rig.group, 'x', targetX, s);
        this.lerpRot(this.rig.group, 'y', targetRotY, s);

        this.lerpRot(this.rig.leftLegPivot, 'x', leftLegRotX, s);
        this.lerpRot(this.rig.rightLegPivot, 'x', rightLegRotX, s);
        this.lerpRot(this.rig.leftArmPivot, 'x', leftArmRotX, s);
        this.lerpRot(this.rig.rightArmPivot, 'x', rightArmRotX, s);

        // Mallow Animation
        this.lerpPos(this.mallow, 'x', mallowTargetX, 0.05);
        this.lerpPos(this.mallow, 'y', mallowTargetY, 0.05);
        this.mallow.lookAt(this.rig.group.position);
    }

    lerpRot(obj, axis, target, speed) {
        obj.rotation[axis] = THREE.MathUtils.lerp(obj.rotation[axis], target, speed);
    }
    lerpPos(obj, axis, target, speed) {
        obj.position[axis] = THREE.MathUtils.lerp(obj.position[axis], target, speed);
    }
}
