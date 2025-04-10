import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

export class Particle {
    constructor(
        position, velocity, config={
            mass:1.0, radius:0.02
        }) {
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.mass = config.mass;
        this.radius = config.radius;
    }
}

export class ParticleSystem {
    constructor(particles, config={
        periodSize: undefined,
        renderer: undefined,
    }) {
        this.renderer = config.renderer;
        this.particles = particles;
        this.G = 1.0;
        this.periodSize = config.periodSize || undefined;
        this.numParticles = particles.length;

        this.sizeX = Math.floor(Math.sqrt(this.numParticles));
        this.sizeY = Math.ceil(this.numParticles / this.sizeX);
        this.gpuCompute = new GPUComputationRenderer(this.sizeX, this.sizeY, this.renderer);
        this.gpuCompute.dataType = THREE.HalfFloatType;
        this.positionTex = this.gpuCompute.createTexture();
        this.velocityTex = this.gpuCompute.createTexture();
        this.isReadyToCompute = false;
        this.fillTexturesByParticles(this.positionTex, this.velocityTex, this.particles);
        this.initShader().then(() => {
            this.isReadyToCompute = true;
        });
    }

    fillTexturesByParticles(posTex, velTex, particles) {
        const posArray = posTex.image.data;
        const velArray = velTex.image.data;
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const idx = i * 4;
            posArray[idx+0] = p.position.x;
            posArray[idx+1] = p.position.y;
            posArray[idx+2] = p.position.z;
            posArray[idx+3] = 1.0;

            velArray[idx+0] = p.velocity.x;
            velArray[idx+1] = p.velocity.y;
            velArray[idx+2] = p.velocity.z;
            velArray[idx+3] = 1.0;
        }
    }


    async initShader() {
        const loadShader = async (url) => {
            const res = await fetch(url);
            return await res.text();
        };
        const velocityShader = await loadShader('./js/shaders/velocity.glsl');
        const positionShader = await loadShader('./js/shaders/position.glsl');

        this.velocityVariable = this.gpuCompute.addVariable("textureVelocity", velocityShader, this.velocityTex);
        this.positionVariable = this.gpuCompute.addVariable("texturePosition", positionShader, this.positionTex);


        this.velocityVariable.material.uniforms.deltaTime = { value: 1e-16 }; // initialize value
        this.velocityVariable.material.uniforms.G = { value: this.G };
        this.velocityVariable.material.uniforms.textureSize = { value: new THREE.Vector2(this.sizeX, this.sizeY) };
        this.positionVariable.material.uniforms.deltaTime = { value: 1e-16 }; // initialize value

        this.gpuCompute.setVariableDependencies(this.velocityVariable, [this.velocityVariable, this.positionVariable]);
        this.gpuCompute.setVariableDependencies(this.positionVariable, [this.velocityVariable, this.positionVariable]);
        const error = this.gpuCompute.init();
        if (error !== null) {
            console.error('GPUCompute initialization error:', error);
        }
    }

    update(dt) {
        if (!this.isReadyToCompute) return;
        this.velocityVariable.material.uniforms.deltaTime.value = dt;
        this.positionVariable.material.uniforms.deltaTime.value = dt;
        this.gpuCompute.compute();

        const renderTarget = this.gpuCompute.getCurrentRenderTarget(this.positionVariable);
        const pixelBuffer = new Float32Array(this.sizeX * this.sizeY * 4);

        this.renderer.readRenderTargetPixels(
            renderTarget,
            0, 0,
            this.sizeX, this.sizeY,
            pixelBuffer
        );
        for (let i = 0; i < this.particles.length; i++) {
            const idx = i * 4;
            this.particles[i].position.set(
                pixelBuffer[idx + 0],
                pixelBuffer[idx + 1],
                pixelBuffer[idx + 2]
            );
        }
    }
}

export default { Particle, ParticleSystem };