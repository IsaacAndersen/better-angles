// Get filename only.
// Example: './foo.json' becomes 'foo'
function getFileNameOnly(filePath: string) {
    return filePath.split('/').pop().split('.').shift();
  }
  
  // ALL THE JSON!
  export const loadJson = () => {
    const context = require.context('./../data/alignmentDataSet/monty_data', true, /.json$/);
    const all: Record<string, JSON> = {};
    context.keys().forEach((key: any) => {
        const fileName = key.replace('./', '');
        const resource = require(`./../data/alignmentDataSet/monty_data/${fileName}`);
        const namespace = fileName.replace('.json', '');
        all[namespace] = JSON.parse(JSON.stringify(resource));
    });
    console.log(all);
    return all;
}

  // ALL THE IMAGES!
  export const loadImages = () => {
    const context = require.context('./../data/alignmentDataSet/monty_images', true, /.(png|jpe?g|svg)$/i);
    const all: Record<string, string> = {};
    context.keys().forEach((key: any) => {
        const fileName = key.replace('./', '');
        const resource = require(`./../data/alignmentDataSet/monty_images/${fileName}`);
        const namespace = getFileNameOnly(fileName);
        all[namespace] = resource;
    });
    console.log(all);
    return all;
}