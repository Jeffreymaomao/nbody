import * as THREE from 'three';
import Grapher from "./Grapher.js";
import {Particle, ParticleSystem} from "./Particle.js";

const user = {
    pause: true,
};
const generateRandomVector= (scale)=> {
    return new THREE.Vector3(
        scale*(Math.random() - 0.5),
        scale*(Math.random() - 0.5),
        scale*(Math.random() - 0.5),
    );
}
// ------------------------------------------

window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        user.pause = !user.pause;
    } else if (e.key === 'r') {
        user.pause = false;
        particles.forEach(p => {
            p.position.set(generateRandomVector(periodSize));
            p.velocity.set(generateRandomVector(0.5));
        });
    } else if (e.key === 'ArrowRight') {
        if(!user.pause) return;
        particleSystem.update(deltaTime);
        grapher.syncInstancesWithParticles(particles);
    }
});

const grapher = new Grapher({
    cameraPosition: new THREE.Vector3(2,2,2),
    defaultLight: true,
    directionalLight: false,
});

const numParticles =Math.pow(30,2);
const particleRadius = 0.01;
const periodSize = 3;
const deltaTime = 0.001;

const particles = [];
for (let i = 0; i < numParticles; i++) {
    const position = generateRandomVector(periodSize);
    const rotateScale = 4;
    const velocity = new THREE.Vector3(
        -position.y*rotateScale,
         position.x*rotateScale,
        0.0
    );
    particles.push(new Particle(position, velocity, {
         mass: 1.0,
         radius: particleRadius
    }));
}

const particleSystem = new ParticleSystem(particles, {
    periodSize: periodSize,
    renderer: grapher.renderer
});
grapher.addBoxEdge(periodSize);


let particleMesh = null;
window.addEventListener('DOMContentLoaded', () => {
    particleMesh = grapher.addSphereInstances(particles, {
        radius: particleRadius,
        color: 0xffffff
    });
});

grapher.animate = function() {
    if(user.pause || !particleMesh) return;
    particleSystem.update(deltaTime);
    this.syncInstancesWithParticles(particles);
};

window.grapher = grapher;