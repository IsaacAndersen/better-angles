# better-angles
a tool for annotating photos w/ rotation data.

## motivation

i have some photos of my dog that i'd like to organize based on the direction my dog is looking. i looked into some ML models that would do this, but it seemed hard. instead, i'm building a simple editor to help me tag them manually.

## design & specifications (wip)

the editor will take a path to some photos. it'll output some files that contain an x-y-z rotation & metadata for each photo processed.

### tech
probably gonna do some vanilla js + three.js 

### metadata

| attribute | description |
|-----------|-------------|
|`boundingBox`| The bounding box of montys face in the image. Use this to center/normalize viewing angle. |
| `rotation` | Euler angles of rotation from the camera. |
| `timeToProcess` | time spent looking at this photo in the editor (seconds) |


## timeline

- 08/02/2022 - i guess i'll do it this weekend? writing here so i don't forget
- 08/14/2022 - kinda got the annotator working. still really ugly. may finish up throughout the week and make pretty.
