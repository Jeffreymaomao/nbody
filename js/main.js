import * as THREE from 'three';
import Grapher from "./Grapher.js";
import {ParticleSystem} from "./Particle.js";
// ------------------------------------------
const {sqrt, sin, cos, pow, PI, acos, floor, ceil} = Math; // for convenience
const rand = (min=0,max=1)=> {return (max-min)*Math.random()+min}
const generateRandomBall = (scale)=> {
    const radius = scale * pow(rand(0,1), 1/3);
    const randz  = rand(-1,1);
    const phi    = rand(0, 2*PI);
    const sin_theta = sqrt(1 - randz * randz);
    return new THREE.Vector3(
        radius * sin_theta * cos(phi),
        radius * sin_theta * sin(phi),
        radius * randz
    );
}
const determineTextureSize = (approxNum)=> {
    const width  = floor(sqrt(approxNum));
    const height = ceil(approxNum/width);
    return [width, height];
}

// ------------------------------------------
// physics parameters
const initRotationSpeed = 3.0;
const params = {
    deltaTime:  0.005,
    numberOfPoints: 100000,
    pointSize: 1,
    periodSize: 20,
    initialRadius: 10,
    initialVelocity: 6,
    approxNumParticles: 10000,
}
// ------------------------------------------
// initialize grapher
const grapher = new Grapher({
    cameraPosition: new THREE.Vector3(2,2,2),
    defaultLight: true,
    directionalLight: false,
    cameraMinDistance: 1,
    cameraMaxDistance: 1500,
    axisLength: params.periodSize/2 * 0.8,
    cameraPosition: new THREE.Vector3(2,1,1).multiplyScalar(params.initialRadius*1.6),
    stats: true,
    gui: true,
    guiWidth: 320
});
const boxEdge = grapher.addBoxEdge(params.initialRadius);
const scaleBoxEdge = (s)=>{boxEdge.scale.set(s,s,s)};

// ------------------------------------------
// initialize particles
const generateInitialPositionVelocity = (num) => {
    const positionArray = new Array(num);
    const velocityArray = new Array(num);
    for (let i = 0; i < num; i++) {
        const position     = generateRandomBall(params.initialRadius);
        const randomVector = generateRandomBall(params.initialRadius * 0.5)
        const spiralVector = new THREE.Vector3(-position.y, position.x, 0.0).normalize();

        const scaleVelocity = params.initialVelocity * (position.length()/params.initialRadius);
        const velocity      = spiralVector.multiplyScalar(scaleVelocity).add(randomVector);
        positionArray[i] = position;
        velocityArray[i] = velocity;
    }
    return [positionArray, velocityArray]
}

// initialize particles
const initCollidingGalaxies = (num) => {
    const offset = new THREE.Vector3(2*params.initialRadius, 0.0, 0.0);
    const positionArray = new Array(num);
    const velocityArray = new Array(num);
    const mid = parseInt(num/2);
    for (let i = 0; i < mid; i++) {
        const position     = generateRandomBall(params.initialRadius);
        const randomVector = generateRandomBall(params.initialRadius)
        const spiralVector = new THREE.Vector3(-position.y, position.x, 0.0).normalize();

        const scaleVelocity = params.initialVelocity * (position.length()/params.initialRadius);
        const velocity      = spiralVector.multiplyScalar(scaleVelocity).add(randomVector);
        positionArray[i] = position.add(offset);
        velocityArray[i] = velocity;
    }
    for (let i = mid; i < num; i++) {
        const position     = generateRandomBall(params.initialRadius);
        const randomVector = generateRandomBall(params.initialRadius * 0.5)
        const spiralVector = new THREE.Vector3(-position.y, position.x, 0.0).normalize();

        const scaleVelocity = params.initialVelocity * (position.length()/params.initialRadius);
        const velocity      = spiralVector.multiplyScalar(scaleVelocity).add(randomVector);
        positionArray[i] = position.sub(offset);
        velocityArray[i] = velocity;
    }
    return [positionArray, velocityArray]
}

let points, particleSystem;
const initializeNewParticleSystem = async () => {
    if (points) {  // clear
        grapher.scene.remove(points);
        points.geometry.dispose(); points.material.dispose();
    }
    scaleBoxEdge(params.periodSize);
    const [sizeX, sizeY] = determineTextureSize(params.approxNumParticles)
    const numParticles = sizeX * sizeY;
    console.log(`Real numParticles: ${sizeX} x ${sizeY} = ${numParticles}`);
    const [positionArray, velocityArray] = initCollidingGalaxies(numParticles);
    points = await grapher.addGPUPoints(sizeX, sizeY, {
        size: params.pointSize,
    });
    particleSystem = new ParticleSystem(points, positionArray, velocityArray, {
        periodSize: params.periodSize,
        renderer: grapher.renderer,
        forceUpdateShader: true,
    });
}
// ------------------------------------------
const user = {
    pause: true,
    showAxes: true,
    showBox: true,
    step: () => particleSystem.update(params.deltaTime),
    reset: () => initializeNewParticleSystem(),
    changePointSize: (s) => {
        points.material.uniforms.pointSize.value = s;
        points.material.size = s;
        params.pointSize = s;
    }
};
// ------------------------------------------
// start to animate
await initializeNewParticleSystem();
grapher.animate = function() {
    if(user.pause || !particleSystem) return;
    particleSystem.update(params.deltaTime);
};
// ------------------------------------------
// events
const objectFolder    = grapher.gui.addFolder('Axes & Box');
const simulationFolder = grapher.gui.addFolder('Simulation');
const parametersFolder = grapher.gui.addFolder('Parameters');
const initialzeFolder = grapher.gui.addFolder('Initialze');

const controller = {
    axes: objectFolder.add(user, 'showAxes').name("Axes").onChange(value => {
        grapher.axesHelper.visible = value;
        grapher.axisLabels.forEach(label => label.visible = value);
    }),
    box: objectFolder.add(user, 'showBox').name("Box").onChange(value => {boxEdge.visible = value}),
    pause: simulationFolder.add(user, 'pause').name("Pause (press space)"),
    step:  simulationFolder.add(user, 'step').name("Step once"),
    reset: simulationFolder.add(user, 'reset').name("Reset"),
    deltaT:    parametersFolder.add(params, 'deltaTime', 0.001, 0.05, 0.00001).name("Δt"),
    gravity:   parametersFolder.add(particleSystem, 'G', 0.0, 10.0).name("Gravity G"),
    pointSize: parametersFolder.add(points.material.uniforms.pointSize, 'value', 0.01, 10.0).name("Point Size").onChange(user.changePointSize),
    numParticles:    initialzeFolder.add(params, 'approxNumParticles', 1, 1000000).name('approxNum').onFinishChange(user.reset),
    periodSize:      initialzeFolder.add(params, 'periodSize', 1, 60.0).name('Length Scale').onFinishChange(user.reset).onChange(scaleBoxEdge),
    initialRadius:   initialzeFolder.add(params, 'initialRadius', 1, 100.0).name('initial Radius').onFinishChange(user.reset),
    initialVelocity: initialzeFolder.add(params, 'initialVelocity', 0, 30.0).name('initial Velocity').onFinishChange(user.reset),
}

simulationFolder.open();
parametersFolder.open();
initialzeFolder.open();

window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        user.pause = !user.pause;
        controller.pause.updateDisplay();
    } else if (e.key === 'r') {
        user.reset();
    } else if (e.key === 'ArrowRight') {
        if(!user.pause) return;
        user.step();
    }
});