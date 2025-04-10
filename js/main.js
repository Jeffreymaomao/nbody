import * as THREE from 'three';
import Grapher from "./Grapher.js";
import {ParticleSystem} from "./Particle.js";

const user = {
    pause: true,
};
const rand = (min=0,max=1)=> {return (max-min)*Math.random()+min}
// ------------------------------------------
// number of points
const approxNumParticles = 15000;
const sizeX = Math.floor(Math.sqrt(approxNumParticles));
const sizeY = Math.ceil(approxNumParticles/sizeX);
const numParticles = sizeX * sizeY;
console.log(`Number of Particles: ${numParticles}`);
// ------------------------------------------
// physics parameters
const periodSize = 40;
const initRotationSpeed = 3.0;
const deltaTime  = 0.005;
// ------------------------------------------
// initialize grapher
const grapher = new Grapher({
    cameraPosition: new THREE.Vector3(2,2,2),
    defaultLight: true,
    directionalLight: false,
    cameraMinDistance: 1,
    cameraMaxDistance: periodSize*10,
    axisLength: periodSize/2 * 0.8,
    cameraPosition: new THREE.Vector3(2,1,1).multiplyScalar(periodSize),
});
grapher.addBoxEdge(periodSize);
// ------------------------------------------
// initialize particles

const generateRandomVector= ()=> {
    const scale  = periodSize * 0.3
    const radius = scale * Math.pow(rand(0,1), 1/3);
    const theta = Math.acos(rand(-1,1));
    const phi   = rand(0, 2*Math.PI);
    return new THREE.Vector3(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta)
    );
}

const positionArray = new Array(numParticles);
const velocityArray = new Array(numParticles);
for (let i = 0; i < numParticles; i++) {
    const position = generateRandomVector();
    const velocity = new THREE.Vector3(-position.y,position.x,0.0)
                        .multiplyScalar(initRotationSpeed)
                        .add(generateRandomVector().multiplyScalar(0.1));
    positionArray[i] = position;
    velocityArray[i] = velocity;
}

const points = await grapher.addGPUPoints(sizeX, sizeY, {
    size: 1.5,
});
const particleSystem = new ParticleSystem(points, positionArray, velocityArray, {
    periodSize: periodSize,
    renderer: grapher.renderer
});
// ------------------------------------------
// start to animate
grapher.animate = function() {
    if(user.pause) return;
    particleSystem.update(deltaTime);
};
// ------------------------------------------
// keyboard events
window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        user.pause = !user.pause;
    } else if (e.key === 'r') {
    } else if (e.key === 'ArrowRight') {
        if(!user.pause) return;
        particleSystem.update(deltaTime);
    }
});