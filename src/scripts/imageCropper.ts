type BoundingBox = {
    x: number;
    y: number;
    width: number;
    height: number;
}
type CanvasPoint = {
    x: number;
    y: number;
};

const getCoveredBoundingBox = (startPoint: CanvasPoint, endPoint: CanvasPoint) => {
    const x = Math.min(startPoint.x, endPoint.x);
    const y = Math.min(startPoint.y, endPoint.y);
    const width = Math.abs(startPoint.x - endPoint.x);
    const height = Math.abs(startPoint.y - endPoint.y);
    return { x, y, width, height };
}

/**
 * Displays an image and optionally allows the user to crop it.
 */
class ImageCropper {
    canvas: HTMLCanvasElement;
    image: HTMLImageElement | null;
    context: CanvasRenderingContext2D;

    isDragging = false;

    dragStartPoint: CanvasPoint | null = null;
    boundingBox: BoundingBox | null = null;

    constructor(image: HTMLImageElement | null) {
        const canvas = document.createElement("canvas");

        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.image = image;

        canvas.width = 500;
        canvas.height = 500;
        canvas.style.width = "500px";
        canvas.style.height = "500px";
        canvas.style.border = "1px solid black";

        const startDrag = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();

            this.dragStartPoint = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            canvas.style.border = "2px solid red";
            this.isDragging = true;
        }

        const continueDrag = (event: MouseEvent) => {
            if (this.isDragging) {
                const rect = canvas.getBoundingClientRect();
                this.boundingBox = getCoveredBoundingBox(this.dragStartPoint, {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top
                });
            }
        }

        const endDrag = (event: MouseEvent) => {
            if (this.isDragging) {
                this.isDragging = false;
                canvas.style.border = "1px solid black";

                const rect = canvas.getBoundingClientRect();
                this.boundingBox = getCoveredBoundingBox(this.dragStartPoint, {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top
                });
                console.log("Bound box: ", this.boundingBox);
            }
        }
        
        canvas.addEventListener('mousedown', startDrag.bind(this));
        canvas.addEventListener('mousemove', continueDrag.bind(this));
        canvas.addEventListener('mouseup', endDrag.bind(this));

        window.requestAnimationFrame(this.animate.bind(this));
        document.body.appendChild(canvas);
    }

    setSize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }

    animate(this: ImageCropper) {
        const ctx = this.context;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);


        if (this.image !== null) {
            ctx.drawImage(this.image, 0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        if (this.boundingBox !== null) {
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'pink';
            ctx.beginPath();
            ctx.rect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height);
            ctx.stroke();
        }

        window.requestAnimationFrame(this.animate.bind(this));
    }
}

export default ImageCropper;