import * as THREE from 'three';
import {
    PERSON_BODY_RADIUS,
    PERSON_BODY_HEIGHT,
    PERSON_BODY_SEGMENTS,
    PERSON_BODY_COLOR,
    PERSON_BODY_METALNESS,
    PERSON_BODY_ROUGHNESS,
    PERSON_BODY_Y_OFFSET,
    PERSON_HEAD_RADIUS,
    PERSON_HEAD_SEGMENTS,
    PERSON_HEAD_COLOR,
    PERSON_HEAD_Y_OFFSET,
    PERSON_LIMB_RADIUS,
    PERSON_LIMB_HEIGHT,
    PERSON_LIMB_COLOR,
    PERSON_ARM_Y_OFFSET,
    PERSON_ARM_X_OFFSET,
    PERSON_LEG_Y_OFFSET,
    PERSON_LEG_X_OFFSET,
    PERSON_BASE_RING_RADIUS,
    PERSON_BASE_RING_WIDTH,
    PERSON_BASE_RING_COLOR,
    PERSON_BASE_RING_OPACITY
} from '../constants/map.constants';

/**
 * Create a 3D humanoid person avatar for navigation visualization
 */
export function createPerson(parent: THREE.Scene | THREE.Group, existingPerson: THREE.Group | null): THREE.Group {
    if (existingPerson) {
        // Remove from whatever parent it currently lives in (scene or buildingGroup)
        existingPerson.parent?.remove(existingPerson);
    }

    const person = new THREE.Group();
    person.name = 'person';

    const bodyMat = new THREE.MeshStandardMaterial({
        color: PERSON_BODY_COLOR,
        metalness: PERSON_BODY_METALNESS,
        roughness: PERSON_BODY_ROUGHNESS
    });

    const limbMat = new THREE.MeshStandardMaterial({
        color: PERSON_LIMB_COLOR,
        metalness: PERSON_BODY_METALNESS,
        roughness: PERSON_BODY_ROUGHNESS
    });

    // Body (Torso - Rounded Cylinder)
    const bodyGeom = new THREE.CapsuleGeometry(
        PERSON_BODY_RADIUS,
        PERSON_BODY_HEIGHT - (PERSON_BODY_RADIUS * 2),
        4,
        PERSON_BODY_SEGMENTS
    );
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = PERSON_BODY_Y_OFFSET;
    body.castShadow = true;
    body.name = 'torso';
    person.add(body);

    // Head (Sphere)
    const headGeom = new THREE.SphereGeometry(
        PERSON_HEAD_RADIUS,
        PERSON_HEAD_SEGMENTS,
        PERSON_HEAD_SEGMENTS
    );
    const headMat = new THREE.MeshStandardMaterial({ color: PERSON_HEAD_COLOR });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = PERSON_HEAD_Y_OFFSET;
    head.castShadow = true;
    head.name = 'head';
    person.add(head);

    // Arms
    const armGeom = new THREE.CapsuleGeometry(PERSON_LIMB_RADIUS, PERSON_LIMB_HEIGHT - (PERSON_LIMB_RADIUS * 2), 2, 8);

    const leftArm = new THREE.Mesh(armGeom, limbMat);
    leftArm.position.set(-PERSON_ARM_X_OFFSET, PERSON_ARM_Y_OFFSET, 0);
    leftArm.name = 'leftArm';
    person.add(leftArm);

    const rightArm = new THREE.Mesh(armGeom, limbMat);
    rightArm.position.set(PERSON_ARM_X_OFFSET, PERSON_ARM_Y_OFFSET, 0);
    rightArm.name = 'rightArm';
    person.add(rightArm);

    // Legs
    const legGeom = new THREE.CapsuleGeometry(PERSON_LIMB_RADIUS, PERSON_LIMB_HEIGHT - (PERSON_LIMB_RADIUS * 2), 2, 8);

    const leftLeg = new THREE.Mesh(legGeom, limbMat);
    leftLeg.position.set(-PERSON_LEG_X_OFFSET, PERSON_LEG_Y_OFFSET, 0);
    leftLeg.name = 'leftLeg';
    person.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeom, limbMat);
    rightLeg.position.set(PERSON_LEG_X_OFFSET, PERSON_LEG_Y_OFFSET, 0);
    rightLeg.name = 'rightLeg';
    person.add(rightLeg);

    // Base Ring (Visual anchor)
    const ringGeom = new THREE.TorusGeometry(PERSON_BASE_RING_RADIUS, PERSON_BASE_RING_WIDTH, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({
        color: PERSON_BASE_RING_COLOR,
        transparent: true,
        opacity: PERSON_BASE_RING_OPACITY,
        depthWrite: false // Avoid z-fighting with floor
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    ring.name = 'baseRing';
    person.add(ring);

    person.position.y = 0;
    parent.add(person);

    return person;
}
