import { boneComboTypes } from "../common/genes/BodyStructure";
import {
  MixedSkeletonData,
  SampleSkeletonData,
  BoneEntry,
  SlotEntry,
  SkinEntry,
  IkEntry,
} from "../common/samples/SampleSkeletonData";

export const isBodySample = (name: string): boolean => {
  for (let i = 1; i < boneComboTypes.length; i++) {
    if (name.startsWith(boneComboTypes[i].toString())) {
      return false;
    }
  }
  return true;
};

export const getSampleName = (name: string, boneCombo: Array<string>): string => {
  if (name.length > 0 && name[0] === "@") {
    return boneCombo[0]; // body
  }
  for (let i = 1; i < boneComboTypes.length; i++) {
    if (name.startsWith(boneComboTypes[i].toString())) {
      return boneCombo[i];
    }
  }
  return boneCombo[0]; // body
};

export const addCustomBoneRule = (
  edges: { [key: string]: string[] },
  sortingRules: { [key: string]: string[] }
): void => {
  if (sortingRules === null) {
    return;
  }
  for (const p in sortingRules) {
    for (const q of sortingRules[p]) {
      if (p in edges && q in edges) {
        edges[p].push(q);
      }
    }
  }
};

export const mixEntriesFromSample = <T extends { name: string }>(
  mapEntries: (sample: SampleSkeletonData) => T[],
  boneCombo: Array<string>,
  samples: Map<string, SampleSkeletonData>,
  sortingRules: { [key: string]: string[] }
): Array<T> => {
  const edges: { [key: string]: string[] } = {};

  const bodyNodes = mapEntries(samples.get(boneCombo[0])!);
  let previousName = bodyNodes[0]["name"];

  for (let index = 1; index < bodyNodes.length; index++) {
    const entry = bodyNodes[index];
    const entryName = entry["name"];
    if (!isBodySample(entryName)) {
      continue;
    }
    if (edges[entryName]) {
      edges[entryName].push(previousName);
    } else {
      const vec: string[] = [];
      vec.push(previousName);
      edges[entryName] = vec;
    }
    previousName = entryName;
  }

  for (let i = 1; i < boneComboTypes.length; i++) {
    const bonePrefix = boneComboTypes[i].toString();
    const bodyNodes = mapEntries(samples.get(boneCombo[i])!);
    previousName = bodyNodes[0]["name"];

    for (let index = 1; index < bodyNodes.length; index++) {
      const entry = bodyNodes[index];
      const entryName = entry["name"];
      if (!isBodySample(entryName)) {
        if (!entryName.startsWith(bonePrefix)) {
          continue;
        }
      } else if (!entryName.startsWith("body") && !entryName.startsWith("shadow")) {
        continue;
      }
      if (edges[entryName]) {
        edges[entryName].push(previousName);
      } else {
        const vec: string[] = [];
        vec.push(previousName);
        edges[entryName] = vec;
      }
      previousName = entryName;
    }
  }

  addCustomBoneRule(edges, sortingRules);

  function visit(
    name: string,
    visited: { [key: string]: boolean },
    edges: { [key: string]: string[] },
    sortedNames: string[]
  ): void {
    if (!visited[name]) {
      visited[name] = true;
      if (edges[name]) {
        for (const edge of edges[name]) {
          visit(edge, visited, edges, sortedNames);
        }
      }
      sortedNames.push(name);
    }
  }

  const visited: { [key: string]: boolean } = {};
  const sortedNames: string[] = [];

  for (const [key, sample] of Array.from(samples.entries())) {
    mapEntries(sample).forEach((entry) => {
      const entryName = entry["name"];
      visit(entryName, visited, edges, sortedNames);
    });
  }

  const mixed: T[] = [];
  sortedNames.forEach((name) => {
    const sampleName = getSampleName(name, boneCombo);
    if (sampleName) {
      const sample = samples.get(sampleName);
      if (sample) {
        const sampleEntries = mapEntries(sample);
        sampleEntries.forEach((entry) => {
          if (entry["name"] === name) {
            mixed.push(entry);
          }
        });
      }
    }
  });

  return mixed;
};

export const mixSkins = (
  boneCombo: Array<string>,
  samples: Map<string, SampleSkeletonData>,
  boneNames: Array<string>,
  skinNames: Array<string>,
  slotNames: Array<string>,
  debug: boolean = false
): SkinEntry[] => {
  const skins: SkinEntry[] = [];

  const slotTransform = (
    slot: { [key: string]: unknown },
    sampleName: string
  ): { [key: string]: unknown } => {
    const transformedSlot: { [key: string]: unknown } = {};
    const sampleBones = samples.get(sampleName)!.bones;

    for (const [name, _attachment] of Object.entries(slot)) {
      const attachment = JSON.parse(JSON.stringify(_attachment)) as { [key: string]: unknown };
      if (attachment.type === "mesh") {
        const { vertices, uvs } = attachment as { vertices: number[]; uvs: number[] };
        if (vertices.length > uvs.length) {
          const transformedVertices = vertices;
          let i = 0;
          while (i < vertices.length) {
            const numBones = vertices[i++];
            for (let j = 0; j < numBones; j++) {
              const boneIndex = vertices[i];
              if (debug) {
                console.log(boneIndex);
              }
              const boneName = (sampleBones[boneIndex] as { name: string })["name"];
              if (debug) {
                console.log(boneName);
              }
              transformedVertices[i] = boneNames.indexOf(boneName);
              i += 4;
            }
          }
          attachment.vertices = transformedVertices;
        }
      }
      transformedSlot[name] = attachment;
    }
    return transformedSlot;
  };

  const getSlotInSampleSkins = (
    skinName: string,
    slotName: string,
    sampleName: string
  ): { [key: string]: unknown } | undefined => {
    const sample = samples.get(sampleName);
    if (!sample) return undefined;
    const skin = sample.skins.find((skin) => (skin as { name: string })["name"] === skinName);
    if (skin) {
      const skinAttachments = (skin as { attachments?: { [key: string]: unknown } }).attachments;
      if (skinAttachments === undefined) {
        return undefined;
      }
      const slot = skinAttachments[slotName];
      return slot as { [key: string]: unknown } | undefined;
    }
    return undefined;
  };

  const comboRoot = boneCombo[0];
  for (const skinName of skinNames) {
    const skin: SkinEntry = {};
    (skin as { name: string }).name = skinName;
    const mixed: { [key: string]: unknown } = {};

    for (const slotName of slotNames) {
      const sampleName = getSampleName(slotName, boneCombo);
      if (sampleName) {
        const map = getSlotInSampleSkins(skinName, slotName, sampleName);
        if (map) {
          mixed[slotName] = slotTransform(map, sampleName);
          continue;
        }
      }
      const map2 = getSlotInSampleSkins(skinName, slotName, comboRoot);
      if (map2) {
        mixed[slotName] = slotTransform(map2, sampleName);
      }
    }
    (skin as { attachments: typeof mixed }).attachments = mixed;
    skins.push(skin);
  }
  return skins;
};

const correctBones = <T extends BoneEntry>(bones: T[]): T[] => {
  const final: T[] = [];
  let invalidBoneOrders: T[] = [];
  const boneTrees: { [key: string]: string } = {};
  let src = bones;
  let fixLoop = 0;

  while (fixLoop < 100) {
    for (const bone of src) {
      const boneWithParent = bone as unknown as { name: string; parent?: string };
      if (boneWithParent.parent) {
        if (boneWithParent.parent in boneTrees) {
          boneTrees[boneWithParent.name] = boneWithParent.parent;
          final.push(bone);
        } else {
          invalidBoneOrders.push(bone);
        }
      } else {
        boneTrees[(bone as unknown as { name: string }).name] = "";
        final.push(bone);
      }
    }
    if (invalidBoneOrders.length == 0) {
      break;
    }
    fixLoop += 1;
    src = invalidBoneOrders;
    invalidBoneOrders = [];
  }

  return final;
};

export const mix = (
  boneCombo: Array<string>,
  samples: Map<string, SampleSkeletonData>,
  sortingRules: { [key: string]: string[] },
  debug: boolean = false
): MixedSkeletonData => {
  let bones = mixEntriesFromSample(
    (sample) => sample.bones as (BoneEntry & { name: string })[],
    boneCombo,
    samples,
    sortingRules
  );
  bones = correctBones(bones);

  const boneNames = bones.map((bone) => (bone as { name: string })["name"]);

  const slots = mixEntriesFromSample(
    (sample) => sample.slots as (SlotEntry & { name: string })[],
    boneCombo,
    samples,
    sortingRules
  );
  const slotNames = slots.map((slot) => (slot as { name: string })["name"]);

  const ik = mixEntriesFromSample(
    (sample) => sample.ik as (IkEntry & { name: string })[],
    boneCombo,
    samples,
    sortingRules
  );

  const skinNames = ["default"];
  const skins = mixSkins(boneCombo, samples, boneNames, skinNames, slotNames, debug);

  const events: { [key: string]: unknown } = {};
  for (const [key, sample] of Array.from(samples.entries())) {
    if (sample.events === null) {
      continue;
    }
    for (const q in sample.events) {
      events[q] = {};
    }
  }

  return new MixedSkeletonData(bones, slots, skins, ik, events, null);
};
