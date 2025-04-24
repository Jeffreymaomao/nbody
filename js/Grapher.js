import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Grapher {
    constructor(config={
        stats: false,
        gui:false,
        defaultLight: false,
        directionalLight: false,
        cameraMinDistance: 1,
        cameraMaxDistance: 10
    }) {
        this.scene = new THREE.Scene();
        this.axisLength = config.axisLength || 1;
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

        if(config.stats) {
            this.stats = Stats();
            this.stats.domElement.id = 'stats';
            document.querySelector('header').appendChild(this.stats.domElement);
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
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
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
            this.stats && this.stats.update();
        }
        animate();
    }
}

Grapher.prototype.addBoxEdge = function(size, config={}) {
    const boxLine = new THREE.LineSegments(
        new THREE.EdgesGeometry(
            new THREE.BoxGeometry(size, size, size)
        ),
        new THREE.LineBasicMaterial({
            color: config.color || 0xffffff
        })
    );

    this.scene.add(boxLine);
    return boxLine;
};

Grapher.prototype.addLine = function(pos_i, pos_f, config={}) {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pos_i[0], pos_i[1], pos_i[2]),
        new THREE.Vector3(pos_f[0], pos_f[1], pos_f[2])
    ]);

    const lineMaterial = new THREE.LineBasicMaterial({
        color: config.color || 0xffffff,
        linewidth: config.linewidth || 1
    });

    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.scene.add(line);
    return line;
};

Grapher.prototype.addPoints = function(numParticles, config={}) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',
        new THREE.Float32BufferAttribute(
            new Float32Array(numParticles * 3), 3
        )
    );

    const material = new THREE.PointsMaterial({
        color: config.color || 0xffffff,
        size: config.size || 0.0001,
        sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    return points;
};

Grapher.prototype.addGPUPoints = async function (sizeX, sizeY, config = {}) {
    if (!sizeX || !sizeY) {
        console.error("sizeX and sizeY must be defined");
        return;
    }
    const numParticles = sizeX * sizeY;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(numParticles * 3); // dummy
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const loadShader = async (url) => {
        const res = await fetch(url + `?t=${Date.now()}`);
        return await res.text();
    };
    const material = new THREE.ShaderMaterial({
        vertexShader: await loadShader('./js/shaders/particle-vert.glsl'),
        fragmentShader: await loadShader('./js/shaders/particle-frag.glsl'),
        uniforms: {
            texturePosition: { value: null },
            textureVelocity: { value: null },
            textureSize: { value: new THREE.Vector2(sizeX, sizeY) },
            pointSize: { value: config.size || 0.01 },
            color: { value: new THREE.Color(config.color || 0xffffff) }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    points.userData = {
        sizeX: sizeX,
        sizeY: sizeY,
        numParticles: numParticles
    };

    return points;
};

export default Grapher;