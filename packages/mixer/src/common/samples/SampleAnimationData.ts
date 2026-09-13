export class AnimationHeader {
  name: string;
  defaultKey: string;
  crcKeys: Array<string>;

  constructor(name: string, defaultKey: string, crcKeys: Array<string>) {
    this.name = name;
    this.defaultKey = defaultKey;
    this.crcKeys = crcKeys;
  }
}

export class SampleAnimationData {
  bones: Map<string, unknown>;
  slots: Map<string, unknown>;
  drawOrder: Array<unknown>;
  events: Array<unknown>;

  constructor(
    bones: Map<string, unknown>,
    slots: Map<string, unknown>,
    drawOrder: Array<unknown>,
    events: Array<unknown>
  ) {
    this.bones = bones;
    this.slots = slots;
    this.drawOrder = drawOrder;
    this.events = events;
  }
}
