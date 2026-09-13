import { MixedSkeletonData } from "./common/samples/SampleSkeletonData";

class BoneData {
  index: number;
  name: string;
  parent: BoneData | null;
  x: number = 0;
  y: number = 0;
  rotation: number = 0;

  constructor(index: number, name: string, parent: BoneData | null) {
    this.index = index;
    this.name = name;
    this.parent = parent;
  }
}

class BoneMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  x: number;
  y: number;

  constructor(boneData: BoneData | null) {
    if (boneData === null) {
      this.a = 0;
      this.b = 0;
      this.c = 0;
      this.d = 0;
      this.x = 0;
      this.y = 0;
    } else {
      const rotationY = ((boneData.rotation + 90) * Math.PI) / 180;
      const rotationX = (boneData.rotation * Math.PI) / 180;
      this.a = Math.cos(rotationX);
      this.c = Math.sin(rotationX);
      this.b = Math.cos(rotationY);
      this.d = Math.sin(rotationY);
      this.x = boneData.x;
      this.y = boneData.y;
    }
  }

  static CalculateSetupWorld(boneData: BoneData | null): BoneMatrix {
    if (boneData === null) {
      return new BoneMatrix(null);
    }
    if (boneData.parent === null) {
      return BoneMatrix.GetInheritedInternal(boneData, new BoneMatrix(null));
    }
    const result = BoneMatrix.CalculateSetupWorld(boneData.parent);
    return BoneMatrix.GetInheritedInternal(boneData, result);
  }

  static GetInheritedInternal(boneData: BoneData, parentMatrix: BoneMatrix): BoneMatrix {
    const parent = boneData.parent;
    if (parent === null) {
      return new BoneMatrix(boneData);
    }
    const pa = parentMatrix.a;
    const pb = parentMatrix.b;
    const pc = parentMatrix.c;
    const pd = parentMatrix.d;

    const result = new BoneMatrix(null);
    result.x = pa * boneData.x + pb * boneData.y + parentMatrix.x;
    result.y = pc * boneData.x + pd * boneData.y + parentMatrix.y;

    const rotationY = ((boneData.rotation + 90) * Math.PI) / 180;
    const la = Math.cos((boneData.rotation * Math.PI) / 180);
    const lb = Math.cos(rotationY);
    const lc = Math.sin((boneData.rotation * Math.PI) / 180);
    const ld = Math.sin(rotationY);

    result.a = pa * la + pb * lc;
    result.b = pa * lb + pb * ld;
    result.c = pc * la + pd * lc;
    result.d = pc * lb + pd * ld;

    return result;
  }
}

export interface AvatarLayersOptions {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  scale: number;
}

export const exportAvatarLayers = (
  skeletonJson: MixedSkeletonData,
  adultCombo: Map<string, string>,
  variantKey: string,
  partColorShift: string,
  getVariantAttachmentPath: (
    slotName: string,
    attachmentPath: string,
    variantKey: string,
    partColorShift: string
  ) => string,
  customize: AvatarLayersOptions
): { imagePath: string; px: number; py: number }[] => {
  const boneMap: { [key: string]: BoneData } = {};

  for (let i = 0; i < skeletonJson.bones.length; i++) {
    const bone = skeletonJson.bones[i] as { name: string; x?: number; y?: number; rotation?: number; parent?: string };
    const boneData = new BoneData(i, bone.name, null);
    boneData.x = bone.x || 0;
    boneData.y = bone.y || 0;
    boneData.rotation = bone.rotation || 0;
    boneMap[bone.name] = boneData;
  }

  for (let i = 0; i < skeletonJson.bones.length; i++) {
    const bone = skeletonJson.bones[i] as { name: string; parent?: string };
    if (bone.parent != null) {
      boneMap[bone.name].parent = boneMap[bone.parent];
    }
  }

  const skinAttachments = ((skeletonJson.skins[0] as { attachments: { [key: string]: unknown } }).attachments) as {
    [slotName: string]: { [attachmentName: string]: { [key: string]: unknown } };
  };
  const rootX = customize.width / 2 + customize.offsetX;
  const rootY = customize.height / 2 + customize.offsetY;
  const toRenderSlots: {
    [key: string]: { attachmentPath: string; x: number; y: number };
  } = {};

  let bodyName = "";
  if (adultCombo != null && adultCombo.has("body")) {
    bodyName = adultCombo.get("body")!;
  }

  for (const slotName in skinAttachments) {
    if (slotName === "shadow" || slotName === "ball" || slotName === "mouth-blink") {
      continue;
    }
    if (bodyName != "body-agamo" && bodyName != "body-sumo" && slotName === "body-pattern") {
      continue;
    }

    const skinSlotAttachments = skinAttachments[slotName];
    let selectedSlotName: string | null = slotName in skinSlotAttachments ? slotName : null;

    if (selectedSlotName === null) {
      for (const k in skinSlotAttachments) {
        selectedSlotName = k;
        break;
      }
    }

    for (const attachmentName in skinSlotAttachments) {
      if (attachmentName !== selectedSlotName) {
        continue;
      }
      if (attachmentName.startsWith("ear-right-dot") || attachmentName.startsWith("ear-left-dot")) {
        continue;
      }

      const skinSlotAttachment = skinSlotAttachments[attachmentName];
      if (skinSlotAttachment["type"] === "clipping") {
        continue;
      }

      const path = skinSlotAttachment["path"] as string;
      if (slotName === "mouth-accessory" && !path.includes("summer")) {
        continue;
      }

      const scale = customize.scale;
      const w = ((skinSlotAttachment.width as number) || 0) * scale;
      const h = ((skinSlotAttachment.height as number) || 0) * scale;

      const slot = skeletonJson.slots.find((x) => (x as { name: string }).name === slotName);
      if (slot === null || slot === undefined) {
        continue;
      }

      const boneData = boneMap[(slot as { bone: string }).bone];
      const childBoneData = new BoneData(999, slotName, boneData);
      childBoneData.x = (skinSlotAttachment.x as number) || 0;
      childBoneData.y = (skinSlotAttachment.y as number) || 0;
      childBoneData.rotation = (skinSlotAttachment.rotation as number) || 0;

      // phuongnk - cheat mesh offset
      if (bodyName === "body-fuzzy") {
        if (slotName === "body") {
          childBoneData.x = 4.86;
          childBoneData.y = -114.37;
        }
      } else if (bodyName === "body-bigyak") {
        if (slotName === "body") {
          childBoneData.x = 29.46;
          childBoneData.y = -63;
        } else if (slotName === "body-braid") {
          childBoneData.x = 109.46;
          childBoneData.y = 15.3;
        } else if (slotName === "body-braid2") {
          childBoneData.x = 122.45;
          childBoneData.y = -0.18;
        }
      } else if (bodyName === "body-wetdog") {
        if (slotName === "body") {
          childBoneData.x = 3.55;
          childBoneData.y = -80.72;
        } else if (slotName === "body-braid") {
          childBoneData.x = 130;
          childBoneData.y = -25;
        }
      } else if (bodyName === "body-mystic-fuzzy") {
        if (slotName === "body-mfuzzy") {
          childBoneData.x = 49.1;
          childBoneData.y = -164.1;
        }
      }

      if (attachmentName === "ear-left-bubble" && skinSlotAttachment["type"] === "mesh") {
        childBoneData.x = 39.23;
        childBoneData.y = 0.65;
      } else if (attachmentName === "ear-right-bubble" && skinSlotAttachment["type"] === "mesh") {
        childBoneData.x = 35.36;
        childBoneData.y = -5.36;
      }

      const bm = BoneMatrix.CalculateSetupWorld(childBoneData);
      const tx = bm.x;
      const ty = bm.y;

      toRenderSlots[slotName] = {
        attachmentPath: path,
        x: rootX + tx * scale - w / 2,
        y: rootY - ty * scale - h / 2,
      };
      break;
    }
  }

  const layers: { imagePath: string; px: number; py: number }[] = [];
  for (let i = 0; i < skeletonJson.slots.length; i++) {
    const slot = skeletonJson.slots[i] as { name: string };
    if (slot.name in toRenderSlots) {
      const { attachmentPath, x, y } = toRenderSlots[slot.name];
      const imagePath = getVariantAttachmentPath(slot.name, attachmentPath, variantKey, partColorShift);
      layers.push({ imagePath, px: x, py: y });
    }
  }

  // correct new accessory
  for (const layer of layers) {
    let imagePath = layer["imagePath"];
    if (imagePath.startsWith("body-accessory/")) {
      const accessorySlot = imagePath.replace("body-accessory/", "").replace("-dummy.png", "");
      const accessoryKey = adultCombo.get("accessory-" + accessorySlot)!.replace("accessory-", "");
      imagePath = "body-accessory/body-" + accessoryKey + ".png";
      layer["imagePath"] = imagePath;
    }
  }

  return layers;
};
