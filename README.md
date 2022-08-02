# better-angles
a tool for annotating photos w/ rotation data.

## motivation

i have some photos of my dog that i'd like to organize based on the direction my dog is looking. i looked into some ML models that would do this, but it seemed hard. instead, i'm building a simple editor to help me tag them manually.

## design & specifications (wip)

the editor will take a path to some photos. it'll output some files that contain an x-y-z rotation & metadata for each photo processed.


### metadata

| attribute | description |
|-----------|-------------|
| `x` | rot (degrees?) |
| `y` | rot (degrees?) |
| `z` | rot (degrees?) |
| `timeToProcess` | time spent looking at this photo in the editor (seconds) |

## timeline

08/02/2022 - i guess i'll do it this weekend? writing here so i don't forget
