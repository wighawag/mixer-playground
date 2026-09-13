export interface BoneEntry {
  [key: string]: unknown;
}

export interface SlotEntry {
  [key: string]: unknown;
}

export interface SkinEntry {
  [key: string]: unknown;
}

export interface IkEntry {
  [key: string]: unknown;
}

export interface EventsMap {
  [key: string]: unknown;
}

export interface KeyAnimationsMap {
  [key: string]: string;
}

export class SampleSkeletonData {
  skeleton: { [key: string]: unknown };
  bones: Array<BoneEntry>;
  slots: Array<SlotEntry>;
  skins: Array<SkinEntry>;
  ik: Array<IkEntry>;
  events: EventsMap;
  keyAnimations: KeyAnimationsMap;

  constructor(
    bones: Array<BoneEntry>,
    slots: Array<SlotEntry>,
    skins: Array<SkinEntry>,
    ik: Array<IkEntry>,
    events: EventsMap,
    keyAnimations: KeyAnimationsMap
  ) {
    this.skeleton = {};
    this.bones = bones;
    this.slots = slots;
    this.skins = skins;
    this.ik = ik;
    this.events = events;
    this.keyAnimations = keyAnimations;
  }
}

export class MixedSkeletonData {
  skeleton: { [key: string]: unknown };
  bones: Array<BoneEntry>;
  slots: Array<SlotEntry>;
  skins: Array<SkinEntry>;
  ik: Array<IkEntry>;
  events: EventsMap;
  animations: { [key: string]: unknown };

  constructor(
    bones: Array<BoneEntry>,
    slots: Array<SlotEntry>,
    skins: Array<SkinEntry>,
    ik: Array<IkEntry>,
    events: EventsMap,
    animations: { [key: string]: unknown } | null
  ) {
    this.skeleton = { spine: "3.8.79" };
    this.bones = bones;
    this.slots = slots;
    this.skins = skins;
    this.ik = ik;
    this.events = events;
    this.animations = animations || {};
  }
}
