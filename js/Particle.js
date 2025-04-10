import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

export class ParticleSystem {
    constructor(
        points,
        initPositionArray,
        initVelocityArray,
        config={
            periodSize: undefined,
            renderer: undefined,
            forceUpdateShader: false,
        }
    ) {
        this.G = 1.0;
        this.periodSize = config.periodSize || undefined;

        if(!points.userData.sizeX || !points.userData.sizeY) {
            console.error('ParticleSystem: points must have sizeX and sizeY in userData');
            return;
        }
        this.sizeX        = points.userData.sizeX;
        this.sizeY        = points.userData.sizeY;
        this.numParticles = points.userData.numParticles;

        if(!config.renderer) {
            console.error('ParticleSystem: renderer must be defined');
            return;
        }
        this.renderer = config.renderer;
        this.gpuCompute = new GPUComputationRenderer(this.sizeX, this.sizeY, this.renderer);
        this.positionTexture = this.gpuCompute.createTexture();
        this.velocityTexture = this.gpuCompute.createTexture();
        this.isReadyToCompute = false;

        // initialize the textures
        this.fillTexturesByQuantityArray(
            [this.positionTexture, this.velocityTexture],
            [initPositionArray,    initVelocityArray],
            this.numParticles
        );
        this.points = points;
        this.initShader(config.forceUpdateShader).then(() => {
            this.isReadyToCompute = true;
            this.updatePoints();
        });
    }

    fillTexturesByQuantityArray(textures = [], quantityArray = [], numParticles=0) {
        if (textures.length != quantityArray.length) {
            console.error('ParticleSystem: textures and quantityArray must have the same length');
            return;
        }
        for (let i = 0; i < numParticles; i++) {
            const idx = i * 4;
            for (let j = 0; j < textures.length; j++) {
                const textureImageData = textures[j].image.data;
                const quantityVector   = quantityArray[j];
                textureImageData[idx+0] = quantityVector[i].x;
                textureImageData[idx+1] = quantityVector[i].y;
                textureImageData[idx+2] = quantityVector[i].z;
                textureImageData[idx+3] = 1.0;
            }
        }
    }

    async initShader(forceUpdateShader) {
        const loadShader = async (url) => {
            const res = await fetch(url+(forceUpdateShader?`?t=${Date.now()}`:''));
            return await res.text();
        };
        const velocityShader = await loadShader('./js/shaders/velocity.glsl');
        const positionShader = await loadShader('./js/shaders/position.glsl');

        this.velocityVariable = this.gpuCompute.addVariable("textureVelocity", velocityShader, this.velocityTexture);
        this.positionVariable = this.gpuCompute.addVariable("texturePosition", positionShader, this.positionTexture);

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

    updatePoints() {
        // send the current position to the points material for update position
        this.points.material.uniforms.texturePosition.value
            = this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
        // send the current velocity to the points material for render color
        this.points.material.uniforms.textureVelocity.value
            = this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture;
    }

    update(dt) {
        if (!this.isReadyToCompute) return;
        this.velocityVariable.material.uniforms.G.value = this.G;
        this.velocityVariable.material.uniforms.deltaTime.value = dt;
        this.positionVariable.material.uniforms.deltaTime.value = dt;
        this.gpuCompute.compute();
        this.updatePoints();
    }
}

export default { ParticleSystem };