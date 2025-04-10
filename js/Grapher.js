import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Grapher {
    constructor(config={
        gui:false,
        defaultLight: false,
        directionalLight: false,
        cameraMinDistance: 1,
        cameraMaxDistance: 10,
    }) {
        this.scene = new THREE.Scene();
        this.axisLength = 1;
        this.axisLabels = [undefined, undefined, undefined];

        this.cameraMinDistance = config.cameraMinDistance || 1;
        this.cameraMaxDistance = config.cameraMaxDistance || 10;
        this.initCameraPosition = config.cameraPosition || new THREE.Vector3(1.8, 1.8, 1.8);

        if(config.gui) {
            var guiWidth = 245;
            if(config.guiWidth) guiWidth =config.guiWidth
            this.gui = new dat.GUI({ autoPlace: false, width: guiWidth})
            this.gui.domElement.id = 'gui';
            document.querySelector('header').appendChild(this.gui.domElement);
        }

        if(config.defaultLight) {
            let ambientIntensity = 10;
            if(config.directionalLight){
                const light = new THREE.DirectionalLight(0xffffff, 1.0);
                light.position.set(-1, 1, 1);
                light.target.position.set(0, 0, 0);
                this.scene.add(light);
                ambientIntensity = 0.5;
            }
            const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity);
            this.scene.add(ambient);
        }

        this.initRenderer();
        window.addEventListener('load', () => {
            this.init();
        });
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    init() {
        this.initCamera()
        this.initAxis();
        this.initControls();
        this.initAnimation();
    }

    initRenderer() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl2');
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            context: context,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        });
        this.renderer.setClearColor(new THREE.Color(0x000000), 1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(this.initCameraPosition.x, this.initCameraPosition.y, this.initCameraPosition.z);
        this.camera.up.set(0, 0, 1);
        this.camera.lookAt(0, 0, 0);

    }

    initLabel() {
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        document.body.appendChild(this.labelRenderer.domElement);
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = this.cameraMinDistance;
        this.controls.maxDistance = this.cameraMaxDistance;
    }

    initAxis() {
        this.axesHelper = new THREE.AxesHelper(this.axisLength);
        this.scene.add(this.axesHelper);
        this.initLabel();
        this.axisLabels[0] = this.createLabel("x", new THREE.Vector3(this.axisLength, 0.0, 0.0), {class:'axis'});
        this.axisLabels[1] = this.createLabel("y", new THREE.Vector3(0.0, this.axisLength, 0.0), {class:'axis'});
        this.axisLabels[2] = this.createLabel("z", new THREE.Vector3(0.0, 0.0, this.axisLength), {class:'axis'});
    }

    createLabel(text, position, config={}) {
        const div = document.createElement('div');
        div.className = 'label';
        if(config.class) div.classList.add(config.class);
        div.style.color = config.color || 'white';
        if(katex){
            katex.render(text, div, {
                displayMode: true,
                output: this.katexOutput,
                throwOnError: true,
                trust: true
            });
        } else {
            div.textContent = text;
        }
        const label = new CSS2DObject(div);
        label.position.copy(position);
        this.scene.add(label);
        return label;
    }

    animate() {
        // This is for custom animations.
    }

    initAnimation() {
        const animate = ()=>{
            requestAnimationFrame(animate);
            this.animate();
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
            this.labelRenderer.render(this.scene, this.camera);
        }
        animate();
    }
}

Grapher.prototype.addSphereInstances = function(particles, config={radius: 0.02, color: 0xffffff}) {
    const count = particles.length;
    const geometry = new THREE.SphereGeometry(config.radius, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color:config.color });
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
        dummy.position.copy(particles[i].position);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedMesh);
    this.instancedMesh = instancedMesh;
    return instancedMesh;
};

Grapher.prototype.addPoints = function(pos, config={color: 0xffffff, size: 0.0001}) {
    const geometry = new THREE.BufferGeometry();
    const positionAttribute = new THREE.Float32BufferAttribute(pos, 3);
    geometry.setAttribute('position', positionAttribute);
    const material = new THREE.PointsMaterial({
        color: config.color,
        size: config.size
    });
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    return {geometry,points}
};

Grapher.prototype.addLine = function(pos_i, pos_f, config={color: 0xffffff, linewidth: 1}) {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pos_i[0], pos_i[1], pos_i[2]),
        new THREE.Vector3(pos_f[0], pos_f[1], pos_f[2])
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({
        color: config.color,
        linewidth: config.linewidth
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.scene.add(line);
};

Grapher.prototype.syncInstancesWithParticles = function(particles) {
    const dummy = new THREE.Object3D();
    for (let i = 0; i < particles.length; i++) {
        dummy.position.copy(particles[i].position);
        dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
};

Grapher.prototype.addBoxEdge = function(size, config={color:0xffffff}) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const edges = new THREE.EdgesGeometry(geometry);
    const boxLine = new THREE.LineSegments(edges,
        new THREE.LineBasicMaterial({
            color: config.color
        })
    );
    this.scene.add(boxLine);
    return boxLine;
};

export default Grapher;