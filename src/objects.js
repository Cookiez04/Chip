// src/objects.js
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Materials
export const materials = {
    cookie: new THREE.MeshStandardMaterial({ color: 0xdca35b, roughness: 0.9, bumpScale: 0.1 }),
    chip: new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.4, metalness: 0.1 }),
    glassesFrame: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.1 }),
    glassesLens: new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.0, metalness: 0.8 }),
    laptopBody: new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.7 }),
    screen: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    bookCover: new THREE.MeshStandardMaterial({ color: 0x8e44ad, roughness: 0.6 }),
    bookPages: new THREE.MeshStandardMaterial({ color: 0xfffdd0, roughness: 0.9 }),
    wand: new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.4 }),
    wandTip: new THREE.MeshBasicMaterial({ color: 0x00ffff }),
    limb: new THREE.MeshStandardMaterial({ color: 0xdca35b, roughness: 0.9, bumpScale: 0.1 })
};

function createLimbMesh(points, radius = 0.25) {
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, 12, radius, 8, false);
    const mesh = new THREE.Mesh(tubeGeo, materials.limb);
    mesh.castShadow = true;
    return mesh;
}

export function createChip() {
    const rig = {
        group: new THREE.Group(),
        body: null,
        head: new THREE.Group(),
        leftArmPivot: new THREE.Group(),
        rightArmPivot: new THREE.Group(),
        leftLegPivot: new THREE.Group(),
        rightLegPivot: new THREE.Group(),
        leftHand: new THREE.Group(),
        rightHand: new THREE.Group()
    };

    // 1. Body (Root)
    const bodyGeo = new THREE.CylinderGeometry(4, 4, 1.2, 32);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, materials.cookie);
    body.castShadow = true; body.receiveShadow = true;
    rig.group.add(body);
    rig.body = body;
    rig.body.add(rig.head);

    // 2. Face (Attached to Head Group)
    // Chips
    const chipGeo = new THREE.SphereGeometry(0.4, 16, 16);
    chipGeo.scale(1, 1, 0.4);
    const chipPositions = [
        {x: 1.5, y: 2.5}, {x: -1.5, y: 2.8}, {x: 0, y: 3.2}, {x: -2.5, y: 1.0}, {x: 2.8, y: 0.5},
        {x: 1.0, y: -2.5}, {x: -1.2, y: -3.0}, {x: -2.8, y: -1.5}, {x: 2.2, y: -2.0}, {x: 0.5, y: 0.5}, {x: -0.8, y: 1.5}
    ];
    chipPositions.forEach(pos => {
        const chip = new THREE.Mesh(chipGeo, materials.chip);
        chip.position.set(pos.x, pos.y, 0.6);
        chip.rotation.z = Math.random() * Math.PI;
        rig.head.add(chip);
    });

    // Glasses
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.8, 0.8);
    rig.head.add(glassesGroup);
    const lensGeo = new RoundedBoxGeometry(1.8, 1.4, 0.2, 4, 0.2);
    const leftLens = new THREE.Mesh(lensGeo, materials.glassesLens); leftLens.position.set(-1, 0, 0); leftLens.rotation.z = 0.1; glassesGroup.add(leftLens);
    const rightLens = new THREE.Mesh(lensGeo, materials.glassesLens); rightLens.position.set(1, 0, 0); rightLens.rotation.z = -0.1; glassesGroup.add(rightLens);
    const bridgeGeo = new THREE.BoxGeometry(0.6, 0.2, 0.1); const bridge = new THREE.Mesh(bridgeGeo, materials.glassesFrame); bridge.position.set(0, 0.2, 0); glassesGroup.add(bridge);
    const armGeo = new THREE.BoxGeometry(0.2, 0.2, 3.5);
    const leftArm = new THREE.Mesh(armGeo, materials.glassesFrame); leftArm.position.set(-2, 0.2, -1.5); glassesGroup.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, materials.glassesFrame); rightArm.position.set(2, 0.2, -1.5); glassesGroup.add(rightArm);

    // Mouth
    const mouthGeo = new THREE.TorusGeometry(1.2, 0.15, 8, 32, Math.PI);
    const mouth = new THREE.Mesh(mouthGeo, new THREE.MeshStandardMaterial({color: 0x3e2723}));
    mouth.rotation.x = Math.PI; mouth.position.set(0, -1.5, 0.62);
    rig.head.add(mouth);

    // 3. Limbs (Pivot Based)
    // Left Arm
    rig.leftArmPivot.position.set(-3.5, 0, 0);
    rig.group.add(rig.leftArmPivot);
    const lArmPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-1, -1, 1), new THREE.Vector3(0.5, -2, 3)];
    const lArmMesh = createLimbMesh(lArmPts);
    rig.leftArmPivot.add(lArmMesh);
    rig.leftHand.position.set(0.5, -2, 3);
    rig.leftArmPivot.add(rig.leftHand);
    const lHandMesh = new THREE.Mesh(new THREE.SphereGeometry(0.6), materials.limb);
    rig.leftHand.add(lHandMesh);

    // Right Arm
    rig.rightArmPivot.position.set(3.5, 0, 0);
    rig.group.add(rig.rightArmPivot);
    const rArmPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, -1, 1), new THREE.Vector3(-0.5, -2, 3)];
    const rArmMesh = createLimbMesh(rArmPts);
    rig.rightArmPivot.add(rArmMesh);
    rig.rightHand.position.set(-0.5, -2, 3);
    rig.rightArmPivot.add(rig.rightHand);
    const rHandMesh = new THREE.Mesh(new THREE.SphereGeometry(0.6), materials.limb);
    rig.rightHand.add(rHandMesh);

    // Left Leg
    rig.leftLegPivot.position.set(-1.5, -3.5, 0);
    rig.group.add(rig.leftLegPivot);
    const lLegPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.5, -2.5, 0), new THREE.Vector3(-1, -2.5, 1)];
    const lLegMesh = createLimbMesh(lLegPts, 0.3);
    rig.leftLegPivot.add(lLegMesh);

    // Right Leg
    rig.rightLegPivot.position.set(1.5, -3.5, 0);
    rig.group.add(rig.rightLegPivot);
    const rLegPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.5, -2.5, 0), new THREE.Vector3(1, -2.5, 1)];
    const rLegMesh = createLimbMesh(rLegPts, 0.3);
    rig.rightLegPivot.add(rLegMesh);

    return rig;
}

export function createProps(rig) {
    const props = {
        laptop: new THREE.Group(),
        book: new THREE.Group(),
        wand: new THREE.Group()
    };

    // Laptop
    const baseGeo = new THREE.BoxGeometry(3, 0.2, 2); const base = new THREE.Mesh(baseGeo, materials.laptopBody); props.laptop.add(base);
    const screenGroup = new THREE.Group(); screenGroup.position.set(0, 0.1, -1); props.laptop.add(screenGroup);
    const lidGeo = new THREE.BoxGeometry(3, 2, 0.1); const lid = new THREE.Mesh(lidGeo, materials.laptopBody); lid.position.set(0, 1, 0); screenGroup.add(lid);
    const displayGeo = new THREE.PlaneGeometry(2.6, 1.6); const display = new THREE.Mesh(displayGeo, materials.screen); display.position.set(0, 1, 0.06); screenGroup.add(display);
    screenGroup.rotation.x = 0.5;
    props.laptop.visible = false;

    // Book
    const bookCover = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 0.4), materials.bookCover);
    const bookPages = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.3, 0.35), materials.bookPages);
    bookPages.position.x = 0.1;
    props.book.add(bookCover); props.book.add(bookPages);
    props.book.visible = false;
    rig.rightHand.add(props.book);
    props.book.rotation.set(0, -Math.PI/2, -0.5);

    // Magic Wand
    const wandShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 3), materials.wand);
    const wandTip = new THREE.Mesh(new THREE.SphereGeometry(0.15), materials.wandTip);
    wandTip.position.y = 1.5;
    props.wand.add(wandShaft); props.wand.add(wandTip);
    props.wand.rotation.z = -Math.PI / 4;
    props.wand.visible = false;
    rig.rightHand.add(props.wand);

    return props;
}

export function createMallow() {
    const mallow = new THREE.Group();
    const mallowBody = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16), new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.3}));
    const mallowEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({color: 0x000000}));
    const mallowEyeR = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({color: 0x000000}));
    mallowEyeL.position.set(-0.3, 0.2, 0.75);
    mallowEyeR.position.set(0.3, 0.2, 0.75);
    mallow.add(mallowBody); mallow.add(mallowEyeL); mallow.add(mallowEyeR);
    mallow.position.set(4, 2, 2);
    return mallow;
}
