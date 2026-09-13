import { ACESSORY_SLOTS, boneComboTypes } from "../genes/BodyStructure";
import { getSampleName, mix } from "../../axie-mixing/SplatSkeletonMixer";
import { AnimationHeader, SampleAnimationData } from "./SampleAnimationData";
import { MixedSkeletonData, SampleSkeletonData } from "./SampleSkeletonData";

interface SamplesJsonData {
  items: { [key: string]: SampleSkeletonData };
  sortingRules: { [key: string]: Array<string> };
  accessoryAnims: { [key: string]: { [key: string]: unknown } };
}

interface VariantsJsonData {
  items: string[];
}

interface AnimationsJsonData {
  items: {
    header: AnimationHeader[];
    animations: { [key: string]: SampleAnimationData };
  };
}

class AxieMixerStuff {
  sampleSkeletonMap: { [key: string]: SampleSkeletonData } = {};
  variantList: string[] = [];
  animationHeaders: Array<AnimationHeader> = [];
  animationCRCMap: { [key: string]: SampleAnimationData } = {};
  sortingRules: { [key: string]: Array<string> } = {};
  accessoryAnims: { [key: string]: { [key: string]: unknown } } = {};
  initilized: boolean = false;

  constructor() {}

  load(samplesJson: SamplesJsonData, variantsJson: VariantsJsonData, animationsJson: AnimationsJsonData): void {
    this.variantList = variantsJson.items;
    this.loadSamples(samplesJson);
    this.loadAnimations(animationsJson);
    this.initilized = true;
  }

  private loadSamples(samplesJson: SamplesJsonData): void {
    this.sampleSkeletonMap = samplesJson.items;
    this.sortingRules = samplesJson.sortingRules;
    this.accessoryAnims = samplesJson.accessoryAnims;
  }

  private loadAnimations(animationsJson: AnimationsJsonData): void {
    const samplesData = animationsJson.items;
    this.animationHeaders = samplesData.header;
    this.animationCRCMap = samplesData.animations;
  }

  generateAsset(adultCombo: Map<string, string>, skipAnim: boolean, debug: boolean = false): MixedSkeletonData {
    const boneCombo: string[] = [];
    const samples = new Map<string, SampleSkeletonData>();
    const sampleAnimations: { [key: string]: { [key: string]: string } } = {};

    for (let i = 0; i < boneComboTypes.length; i++) {
      boneCombo.push(adultCombo.get(boneComboTypes[i])!);
    }

    for (const sampleName of boneCombo) {
      if (sampleName in samples) {
        continue;
      }
      if (sampleName in this.sampleSkeletonMap) {
        const sampleResult = this.sampleSkeletonMap[sampleName];
        for (const animationName in sampleResult.keyAnimations) {
          if (!(animationName in sampleAnimations)) {
            sampleAnimations[animationName] = {};
          }
          if (!(sampleName in sampleAnimations[animationName])) {
            sampleAnimations[animationName][sampleName] = sampleResult.keyAnimations[animationName];
          }
        }
        samples.set(sampleName, sampleResult);
      }
    }

    const mixedJson = mix(boneCombo, samples, this.sortingRules, debug);
    const bones = mixedJson.bones;
    const slots = mixedJson.slots;
    const skins = mixedJson.skins;

    for (const slotName in (skins[0] as { attachments: { [key: string]: unknown } }).attachments) {
      const slotAttachments = (skins[0] as { attachments: { [key: string]: { [key: string]: unknown } } }).attachments[slotName];
      if (ACESSORY_SLOTS.includes(slotName)) {
        if (adultCombo.has(slotName)) {
          let selectedAccessory = adultCombo.get(slotName)!;
          if (selectedAccessory in slotAttachments) {
            slotAttachments[slotName] = slotAttachments[selectedAccessory];
          } else {
            selectedAccessory += "_00";
            if (selectedAccessory in slotAttachments) {
              slotAttachments[slotName] = slotAttachments[selectedAccessory];
            }
          }
        } else {
          delete (skins[0] as { attachments: { [key: string]: unknown } }).attachments[slotName];
        }
      }
      if (slotName === "body-class") {
        const selectedAttachment = "body-class-" + adultCombo.get("body-class");
        const attachmentNames = Object.keys(slotAttachments);
        for (const attachmentName of attachmentNames) {
          if (attachmentName != selectedAttachment) {
            delete slotAttachments[attachmentName];
          }
        }
      } else if (slotName.startsWith("body-id-")) {
        if (adultCombo.has("body-id")) {
          let bodyId = adultCombo.get("body-id")!;
          if (bodyId.length <= 4) {
            bodyId = String(bodyId).padStart((6 - bodyId.length) / 2 + bodyId.length, " ");
          }
          let val = -1;
          const i = 102 - slotName.charCodeAt(8);
          if (i >= 0 && i < bodyId.length && bodyId.charCodeAt(i) >= 48 && bodyId.charCodeAt(i) <= 57) {
            val = bodyId.charCodeAt(i) - 48;
          }
          const selectedAttachment = "body-id-" + String(val).padStart(2, "0") + "-" + adultCombo.get("body-class");
          const attachmentNames = Object.keys(slotAttachments);
          for (const attachmentName of attachmentNames) {
            if (attachmentName != selectedAttachment) {
              delete slotAttachments[attachmentName];
            }
          }
        }
      }
    }

    if (skipAnim) {
      return mixedJson;
    } else {
      const animations: { [key: string]: unknown } = {};

      for (const animationHeader of this.animationHeaders) {
        let crcSampleMaps: { [key: string]: string } = {};
        if (animationHeader.name in sampleAnimations) {
          crcSampleMaps = sampleAnimations[animationHeader.name];
        }
        if (Object.keys(crcSampleMaps).length === 0 && animationHeader.defaultKey === null) {
          continue;
        }

        const mixedBones: { [key: string]: unknown } = {};
        const mixedSlots: { [key: string]: unknown } = {};
        const mixedDrawOrder: Array<{ time: number; offsets: Array<{ slot: string; offset: number }> }> = [];

        for (const bone of bones) {
          const boneName = (bone as { name: string }).name;
          const sampleName = getSampleName(boneName, boneCombo);
          let crcKey = animationHeader.defaultKey;
          if (sampleName in crcSampleMaps) {
            crcKey = crcSampleMaps[sampleName];
          }
          if (crcKey in this.animationCRCMap) {
            const sampleAnimation = this.animationCRCMap[crcKey] as unknown as {
              bones?: { [key: string]: unknown };
              slots?: { [key: string]: unknown };
            };
            if (sampleAnimation.bones) {
              if (boneName in sampleAnimation.bones) {
                mixedBones[boneName] = sampleAnimation.bones[boneName];
              }
            }
          }
        }

        for (const slot of slots) {
          const slotName = (slot as { name: string }).name;
          const sampleName = getSampleName(slotName, boneCombo);
          let crcKey = animationHeader.defaultKey;
          if (sampleName in crcSampleMaps) {
            crcKey = crcSampleMaps[sampleName];
          }
          if (crcKey in this.animationCRCMap) {
            const sampleAnimation = this.animationCRCMap[crcKey] as unknown as {
              bones?: { [key: string]: unknown };
              slots?: { [key: string]: unknown };
            };
            if (sampleAnimation.slots) {
              if (slotName in sampleAnimation.slots) {
                mixedSlots[slotName] = sampleAnimation.slots[slotName];
              }
            }
          }
        }

        // Inject Accessory anim
        if (
          animationHeader.name == "action/idle/normal" ||
          animationHeader.name == "action/idle/random-01" ||
          animationHeader.name == "action/idle/random-02" ||
          animationHeader.name == "action/idle/random-03" ||
          animationHeader.name == "action/idle/random-04"
        ) {
          for (const accessorySlot in this.accessoryAnims) {
            if (adultCombo.has(accessorySlot)) {
              const selectedAccessory = adultCombo.get(accessorySlot)!;
              mixedSlots[accessorySlot] = this.accessoryAnims[accessorySlot][selectedAccessory];
            }
          }
        }

        {
          const sampleName = boneCombo[0]; // body
          let crcKey = animationHeader.defaultKey;
          if (sampleName in crcSampleMaps) {
            crcKey = crcSampleMaps[sampleName];
          }
          if (crcKey in this.animationCRCMap) {
            const sampleAnimation = this.animationCRCMap[crcKey] as unknown as {
              drawOrder?: Array<{ time: number; offsets?: Array<{ slot: string; offset: number }> }>;
            };
            if (sampleAnimation.drawOrder) {
              for (const drawOrderMap of sampleAnimation.drawOrder) {
                const clone: { time: number; offsets: Array<{ slot: string; offset: number }> } = {
                  time: drawOrderMap["time"],
                  offsets: [],
                };
                const offsets = drawOrderMap["offsets"];
                if (offsets) {
                  for (const offsetMap of offsets) {
                    const slotIndex = slots.findIndex((x) => (x as { name: string }).name === offsetMap.slot);
                    const bodySlotIndex = slots.findIndex((x) => (x as { name: string }).name === "body");
                    if (slotIndex != -1 && bodySlotIndex != -1) {
                      // phuongnk - move it above body
                      if (slotIndex < bodySlotIndex) {
                        const cloneOffsetData = {
                          slot: offsetMap.slot,
                          offset: bodySlotIndex - slotIndex,
                        };
                        clone.offsets.push(cloneOffsetData);
                      }
                    }
                  }
                }
                mixedDrawOrder.push(clone);
              }
            }
          }
        }

        const mixedAnimation: { [key: string]: unknown } = {
          slots: mixedSlots,
          bones: mixedBones,
        };
        if (mixedDrawOrder && mixedDrawOrder.length > 0) {
          mixedAnimation["drawOrder"] = mixedDrawOrder;
        }
        animations[animationHeader.name] = mixedAnimation;
      }

      mixedJson.animations = animations;
      return mixedJson;
    }
  }
}

export const mixerStuff = new AxieMixerStuff();
