import * as THREE from 'three';
import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'dat.gui';
import CanvasRotator from './canvasRotator';
import ImageCropper, { BoundingBox } from './imageCropper';

const table = document.createElement('table');
const row = document.createElement('tr');
table.appendChild(row);

for (const columnId of ['filePicker', 'rotator', 'toolbox']) {
    const column = document.createElement('td');
    row.appendChild(column);
    column.id = columnId;
}
document.body.appendChild(table);

// Setup THREE.js scene
const renderer = new THREE.WebGLRenderer({
    antialias: true});
// TODO: Make the renderer smaller.
renderer.setSize( window.innerWidth / 2, window.innerHeight / 2);
document.getElementById('rotator').appendChild( renderer.domElement );
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x00ffff);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
camera.position.set( 20, 0, 0);
camera.lookAt(new Vector3(0, 0, 0));

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableZoom = false;
controls.update();

// Add the image to the scene.
const canvasRotator = new CanvasRotator();
scene.add(canvasRotator.threeObject);


const image = document.createElement("img");
image.id = "" + Math.random();
image.style.display = "none";
document.body.appendChild(image);

// Create an image cropper.
const imageCropper = new ImageCropper(image);
// Super circular dependency checkkk.
imageCropper.canvasRotator = canvasRotator;
canvasRotator.croppedCanvas = imageCropper.croppedCanvas;
document.body.appendChild(imageCropper.croppedCanvas);

const toolbox = document.createElement("div");
// TODO: Move to CSS style or something.
toolbox.style.width = "150px";
toolbox.style.height = "150px";
toolbox.style.background = "red";
toolbox.style.color = "white";

const filePickerSection = document.createElement("div");
filePickerSection.style.width = "150px";
filePickerSection.style.height = "150px";
filePickerSection.style.background = "orange";
filePickerSection.style.color = "white";

let files: FileList = null;
const filePicker = document.createElement("input");
filePicker.type = "file";
filePicker.name = "filePicker";
filePicker.id = "getFile";
filePicker.multiple = true;
filePicker.onchange = (event: any) => {
    files = event.target.files;
}

const downloadAnchor = document.createElement("a");
downloadAnchor.innerHTML = "Download Data";
downloadAnchor.href = "#";

filePickerSection.appendChild(filePicker);
filePickerSection.appendChild(downloadAnchor);

document.getElementById("toolbox").appendChild(toolbox);
document.getElementById("filePicker").appendChild(filePickerSection);

const fileObject = {
    fileNumber: -1,
};

// Make a GUI
const gui = new GUI()
const cameraFolder = gui.addFolder('Camera')
cameraFolder.add(fileObject, 'fileNumber', -1, files?.length ?? 0)
cameraFolder.open()

const toDegrees = (radians: number) => {
    return radians * (180 / Math.PI);
}

let oldFileIndex = fileObject.fileNumber;

type FileData = {
    faceBoundingBox: BoundingBox;
    faceRotation: THREE.Euler;
}
const fileAlignmentData: Record<string, FileData> = {};

export const animate = () => {
	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();

    // Update GUI
    cameraFolder.__controllers[0].max(filePicker?.files?.length ?? 0);
    cameraFolder.__controllers[0].updateDisplay();

    // HTML GUI
    const azimuthDegrees = toDegrees(controls.getAzimuthalAngle());
    const polarDegrees = toDegrees(controls.getPolarAngle());
    toolbox.innerHTML = `azimuthal angle: ${azimuthDegrees.toFixed(3)}<br> polar angle: ${polarDegrees.toFixed(3)}<br>camera angle y: ${toDegrees(camera.rotation.y).toFixed(3)}<br> camera angle x: ${toDegrees(camera.rotation.x).toFixed(3)}`;
    
    // Update file stuff
    const fileIndex = fileObject.fileNumber;
    if (fileIndex !== oldFileIndex && files.item(fileIndex)) {
        const nameOfFile = files.item(oldFileIndex)?.name.split(".")[0]
        fileAlignmentData[nameOfFile] = {
            faceBoundingBox: imageCropper.boundingBox,
            faceRotation: camera.rotation,
        };

        const blob = new Blob([JSON.stringify(fileAlignmentData)], {type: 'application/json'});
        const url = window.URL.createObjectURL(blob);
        downloadAnchor.href = url;
        downloadAnchor.download = `alignmentData_${Object.keys(fileAlignmentData).length}_images.json`;

        imageCropper.boundingBox = null;
        var reader = new FileReader();

        reader.onload = (event: ProgressEvent<FileReader>) => {
            image.src = event.target.result as string
        };

        reader.readAsDataURL(files.item(fileIndex));
        }
    oldFileIndex = fileIndex;

	renderer.render( scene, camera );
    requestAnimationFrame( animate );
}

window.addEventListener("keydown", (event) => {
    event.preventDefault();
    console.log(fileObject.fileNumber);
    console.log(event.key);
    if (event.key === "ArrowLeft") {
        fileObject.fileNumber = (fileObject.fileNumber - 1 + files.length) % files.length;
    }
    if (event.key === "ArrowRight") {
        fileObject.fileNumber = (fileObject.fileNumber + 1) % files.length;
    }
    return;
});

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth / 2, window.innerHeight / 2);

}

// DOWNLOAD
// // Download the camera orientation