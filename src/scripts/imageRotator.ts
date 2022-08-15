import * as THREE from 'three';
import { BoundingBox } from './imageCropper';

type PlaneParams = {
    rotation: THREE.Euler;
    color: THREE.Color;
};

/**
 * Creates an image plane with front and back faces.
 * 
 * @param addRotationRings Whether to display rotation rings around
 */
class ImageRotator {
    croppedCanvas: HTMLCanvasElement | null;
    image: HTMLImageElement;
    threeObject: THREE.Object3D;
    imagePlane: THREE.Group; 

    private compassRingParams: PlaneParams[] = [
        // Green => Rotation about X axis
        {rotation: new THREE.Euler(0, Math.PI / 2, 0, 'XYZ'), color: new THREE.Color(0x00ff00)},
        // Blue  => Rotation about Y axis
        {rotation: new THREE.Euler(0, 0, Math.PI / 2, 'XYZ'), color: new THREE.Color(0x0000ff)},
        // Red   => Rotation about Z axis
        {rotation: new THREE.Euler(Math.PI / 2, 0, 0, 'XYZ'), color: new THREE.Color(0xff0000)},
    ];

    constructor(addRotationRings: boolean = true) {
        const image = document.createElement("img");
        image.id = "" + Math.random();
        image.style.display = "none";
        document.body.appendChild(image);
        this.image = image;
        this.threeObject = new THREE.Object3D();

        // Add an image, facing the camera.
        this.compassRingParams
            .slice(0, 1)
            .map(this.addImagePlane.bind(this));

        if (addRotationRings) {
            this.compassRingParams
            .map(this.makeRing.bind(this));
        }
    }

    setTextureNeedsUpdate(this: ImageRotator) {
        this.imagePlane.children.forEach((child, _) => {
            const mesh = (<THREE.Mesh> child);
            const material = mesh.material as THREE.MeshBasicMaterial;
            const newTexture = new THREE.CanvasTexture(this.croppedCanvas);
            newTexture.needsUpdate = true;

            if (child.name === "back") {
                newTexture.center = new THREE.Vector2(0.5, 0.5);
                newTexture.rotation = Math.PI;
            }

            material.map = newTexture;
            material.map.needsUpdate = true;
        });
    }

    setImageSource(this: ImageRotator, imageSource: string) {
        this.image.src = imageSource;
        this.imagePlane.children.forEach((child, _) => {
            const mesh = (<THREE.Mesh> child);
            const material = mesh.material as THREE.MeshBasicMaterial;
            const newTexture = new THREE.CanvasTexture(this.croppedCanvas);

            if (child.name === "back") {
                newTexture.center = new THREE.Vector2(0.5, 0.5);
                newTexture.rotation = Math.PI;
            }

            material.map = newTexture;
            material.map.needsUpdate = true;
        });
    }

    makeRing(this: ImageRotator, params: PlaneParams) {
        const geometry = new THREE.TorusGeometry(5, 0.01, 64, 64);
        const material = new THREE.MeshBasicMaterial( { color: params.color, side: THREE.DoubleSide } );
        const mesh = new THREE.Mesh( geometry, material );
        mesh.rotation.copy(params.rotation);
        this.threeObject.add(mesh);
    }

    // Display an image on a plane
    addImagePlane(this: ImageRotator, params: PlaneParams) {
        const geometry = new THREE.PlaneGeometry(10, 10);
        const geometryBack = new THREE.PlaneGeometry(10, 10);
        geometryBack.applyMatrix4( new THREE.Matrix4().makeRotationY( Math.PI ) );

        const texture = new THREE.Texture(this.image);
        const textureBack = new THREE.Texture(this.image);
        textureBack.flipY = false;

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.FrontSide,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.copy(params.rotation);

        const materialBack = new THREE.MeshBasicMaterial({
            map: textureBack,
            side: THREE.FrontSide,
            transparent: true,
            opacity: 0.5,
        });
        const meshBack = new THREE.Mesh(geometryBack, materialBack);
        meshBack.rotation.copy(params.rotation);
        meshBack.name = "back";

        const imagePlane = new THREE.Group();

        imagePlane.add(mesh);
        imagePlane.add(meshBack);

        this.imagePlane = imagePlane;
        this.threeObject.add(imagePlane);
    };
}

export default ImageRotator;