import {getShot,SHOTS} from './contracts.js';

// New choices reconstruct specific approved reference shots; outputs remain for review.
export const SHOT_VARIANTS={
  "hook": [
    {
      "id": "original",
      "name": "Original",
      "description": "Your existing composition and motion."
    },
    {
      "id": "agency-line",
      "name": "Agency opener",
      "description": "Four word entrances, a late grid, and a stepped pullback.",
      "source": {
        "key": "hook-agency-line",
        "video": "B44-06",
        "title": "More clients. Same you. Agencies build bigger with Base44",
        "frames": [
          0,
          36
        ],
        "fps": 24,
        "clip": "assets/references/hook-agency-line.mp4",
        "poster": "assets/references/hook-agency-line.jpg"
      }
    },
    {
      "id": "dark-statement",
      "name": "Charging statement",
      "description": "Two staggered lines, brief color flashes, registration squares.",
      "source": {
        "key": "hook-dark-statement",
        "video": "B44-01",
        "title": "The pro builder's secrets to Base44",
        "frames": [
          1138,
          1166
        ],
        "fps": 24,
        "clip": "assets/references/hook-dark-statement.mp4",
        "poster": "assets/references/hook-dark-statement.jpg"
      }
    },
    {
      "id": "karaoke",
      "name": "Superagent karaoke",
      "description": "Three-line text scroll with a portrait-sized media window.",
      "source": {
        "key": "hook-karaoke",
        "video": "B44-05",
        "title": "Move faster with a Base44 Superagent",
        "frames": [
          1117,
          1189
        ],
        "fps": 24,
        "clip": "assets/references/hook-karaoke.mp4",
        "poster": "assets/references/hook-karaoke.jpg"
      }
    }
  ],
  "reveal": [
    {
      "id": "original",
      "name": "Original",
      "description": "Your existing composition and motion."
    },
    {
      "id": "screen-stage",
      "name": "Dashboard stage",
      "description": "Centered dashboard, four blue handles, a late color change.",
      "source": {
        "key": "reveal-screen-stage",
        "video": "B44-01",
        "title": "The pro builder's secrets to Base44",
        "frames": [
          512,
          528
        ],
        "fps": 24,
        "clip": "assets/references/reveal-screen-stage.mp4",
        "poster": "assets/references/reveal-screen-stage.jpg"
      }
    },
    {
      "id": "echo-right",
      "name": "Superagent \u00b7 right",
      "description": "Indented type on the left; measured image window on the right.",
      "source": {
        "key": "reveal-echo-right",
        "video": "B44-05",
        "title": "Move faster with a Base44 Superagent",
        "frames": [
          1239,
          1271
        ],
        "fps": 24,
        "clip": "assets/references/reveal-echo-right.mp4",
        "poster": "assets/references/reveal-echo-right.jpg"
      }
    },
    {
      "id": "echo-left",
      "name": "Superagent \u00b7 left",
      "description": "The mirrored cut, with stepped image and word entrances.",
      "source": {
        "key": "reveal-echo-left",
        "video": "B44-05",
        "title": "Move faster with a Base44 Superagent",
        "frames": [
          1272,
          1307
        ],
        "fps": 24,
        "clip": "assets/references/reveal-echo-left.mp4",
        "poster": "assets/references/reveal-echo-left.jpg"
      }
    }
  ],
  "collage": [
    {
      "id": "original",
      "name": "Original",
      "description": "Your existing composition and motion."
    },
    {
      "id": "fragment-field",
      "name": "The whole thing",
      "description": "Cropped fragments appear around a short central title.",
      "source": {
        "key": "collage-fragment-field",
        "video": "B44-01",
        "title": "The pro builder's secrets to Base44",
        "frames": [
          311,
          339
        ],
        "fps": 24,
        "clip": "assets/references/collage-fragment-field.mp4",
        "poster": "assets/references/collage-fragment-field.jpg"
      }
    },
    {
      "id": "file-strip",
      "name": "Superagent files",
      "description": "Six file tiles follow the measured horizontal source track.",
      "source": {
        "key": "collage-file-strip",
        "video": "B44-05",
        "title": "Move faster with a Base44 Superagent",
        "frames": [
          716,
          744
        ],
        "fps": 24,
        "clip": "assets/references/collage-file-strip.mp4",
        "poster": "assets/references/collage-file-strip.jpg"
      }
    },
    {
      "id": "echo-collage",
      "name": "More \u2192 faster",
      "description": "A hard cut duplicates the collage into horizontal echoes.",
      "source": {
        "key": "collage-echo-collage",
        "video": "B44-07",
        "title": "Rewrite the agency playbook with Base44",
        "frames": [
          161,
          197
        ],
        "fps": 24,
        "clip": "assets/references/collage-echo-collage.mp4",
        "poster": "assets/references/collage-echo-collage.jpg"
      }
    }
  ],
  "focus": [
    {
      "id": "original",
      "name": "Original",
      "description": "Your existing composition and motion."
    },
    {
      "id": "diagonal-window",
      "name": "Superagent window",
      "description": "Diagonal type, a centered image window, and stepped word reveals.",
      "source": {
        "key": "focus-diagonal-window",
        "video": "B44-05",
        "title": "Move faster with a Base44 Superagent",
        "frames": [
          171,
          218
        ],
        "fps": 24,
        "clip": "assets/references/focus-diagonal-window.mp4",
        "poster": "assets/references/focus-diagonal-window.jpg"
      }
    },
    {
      "id": "six-week",
      "name": "Playbook \u00b7 right",
      "description": "Left-aligned type with the source\u2019s shifting right image window.",
      "source": {
        "key": "focus-six-week",
        "video": "B44-07",
        "title": "Rewrite the agency playbook with Base44",
        "frames": [
          1169,
          1199
        ],
        "fps": 24,
        "clip": "assets/references/focus-six-week.mp4",
        "poster": "assets/references/focus-six-week.jpg"
      }
    },
    {
      "id": "six-day",
      "name": "Playbook \u00b7 left",
      "description": "Mirrored image window, typed words, and a popping underline.",
      "source": {
        "key": "focus-six-day",
        "video": "B44-07",
        "title": "Rewrite the agency playbook with Base44",
        "frames": [
          1200,
          1236
        ],
        "fps": 24,
        "clip": "assets/references/focus-six-day.mp4",
        "poster": "assets/references/focus-six-day.jpg"
      }
    }
  ],
  "ending": [
    {
      "id": "original",
      "name": "Fixed end card",
      "description": "Proudly built on, with the official Base44 logo."
    }
  ]
};

export function getVariant(shot,id='original'){
  getShot(shot);
  const variant=SHOT_VARIANTS[shot].find(v=>v.id===id);
  if(!variant)throw new Error(`Unknown layout ${id} for ${shot}`);
  return variant;
}
export function normalizeVariants(variants={}){
  for(const [shot,id]of Object.entries(variants))getVariant(shot,id);
  return Object.fromEntries(SHOTS.map(s=>[s.id,variants[s.id]??'original']));
}
export function encodeVariants(variants){
  return Object.entries(normalizeVariants(variants)).filter(([,id])=>id!=='original').map(([shot,id])=>`${shot}:${id}`).join(',');
}
export function decodeVariants(value=''){
  const entries=value?value.split(',').map(pair=>pair.split(':')):[];
  if(entries.some(pair=>pair.length!==2||!pair[0]||!pair[1]))throw new Error('Invalid layout selection');
  const retired={hook:['editorial','poster','steps'],reveal:['split','wide','offset'],collage:['grid','hero','mosaic'],focus:['split','wide','triptych']};
  return normalizeVariants(Object.fromEntries(entries.map(([shot,id])=>[shot,retired[shot]?.includes(id)?'original':id])));
}

export function sourceLocalFrame(shot,variant,frame){
 const source=getVariant(shot,variant).source;
 if(!source)return frame;
 return Math.min(source.frames[1]-source.frames[0],Math.max(0,Math.round(frame*source.fps/12)));
}
