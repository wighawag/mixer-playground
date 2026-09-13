import { AxiePartType, boneComboTypes } from "./common/genes/BodyStructure";
import { getAxieBodyStructure512 } from "./common/genes/GenesParser";
import { genesStuff } from "./common/genes/GenesStuff";
import { mixerStuff } from "./common/samples/MixerStuff";
import { MixedSkeletonData } from "./common/samples/SampleSkeletonData";

export class AxieBuilderResult {
  error: string = "";
  skeletonDataAsset: MixedSkeletonData | null = null;
  combo: Map<string, string> = new Map();
  variant: string = "";

  constructor() {}
}

interface GenesData {
  items: {
    colors: unknown[];
    bodies: unknown[];
    parts: unknown[];
  };
}

interface SamplesData {
  items: { [key: string]: unknown };
  sortingRules: { [key: string]: string[] };
  accessoryAnims: { [key: string]: { [key: string]: unknown } };
}

interface VariantsData {
  items: string[];
}

interface AnimationsData {
  items: {
    header: unknown[];
    animations: { [key: string]: unknown };
  };
}

export function initAxieMixer(
  GenesData: GenesData,
  SamplesData: SamplesData,
  VariantsData: VariantsData,
  AnimationsData: AnimationsData
): void {
  genesStuff.load(GenesData as Parameters<typeof genesStuff.load>[0]);
  mixerStuff.load(
    SamplesData as Parameters<typeof mixerStuff.load>[0],
    VariantsData as Parameters<typeof mixerStuff.load>[1],
    AnimationsData as Parameters<typeof mixerStuff.load>[2]
  );
}

function isNumeric(value: string): boolean {
  return /^-?\d+$/.test(value);
}

function overridePartSample(partType: AxiePartType, combo: Map<string, string>): string {
  const partTypeStr = partType.toLowerCase();
  const stageKey = `${partTypeStr}.stage`;
  const skinKey = `${partTypeStr}.skin`;
  let partStage = -1;
  let partSkin = -1;

  if (combo.has(stageKey) && isNumeric(combo.get(stageKey)!)) {
    partStage = parseInt(combo.get(stageKey)!);
  }
  if (combo.has(skinKey) && isNumeric(combo.get(skinKey)!)) {
    partSkin = parseInt(combo.get(skinKey)!);
  }

  const finalPartSample = genesStuff.overridePartSample(partType, combo.get(partTypeStr)!, partStage, partSkin);
  return finalPartSample;
}

export const getAxieSpineFromGenes = (
  gene: string,
  meta: Map<string, string> | null,
  skipAnimation: boolean = false
): AxieBuilderResult => {
  const bodyStructure = getAxieBodyStructure512(gene);
  const combo = genesStuff.getAdultCombo(bodyStructure);
  if (meta != null) {
    meta.forEach((v, k) => combo.set(k, v));
  }
  const variantIdx = genesStuff.getAxieColorsVariant(
    bodyStructure.primaryColors[0],
    bodyStructure.bodySkin,
    bodyStructure.class
  );
  return getAxieSpineFromCombo(combo, variantIdx, skipAnimation);
};

export const getAxieSpineFromCombo = (
  combo: Map<string, string>,
  colorVariant: number,
  skipAnimation: boolean = false
): AxieBuilderResult => {
  const builderResult = new AxieBuilderResult();

  if (!mixerStuff.initilized) {
    builderResult.error = "Please initAxieMixer first";
  } else {
    try {
      const bodySkinKey = "body.skin";
      let currentColorVariant = colorVariant;

      if (combo.has(bodySkinKey) && isNumeric(combo.get(bodySkinKey)!)) {
        const bodySkin = parseInt(combo.get(bodySkinKey)!);
        if (bodySkin == 1) {
          combo.set("body", "body-frosty");
        } else if (bodySkin == 2) {
          combo.set("body", "body-summer");
        } else if (bodySkin == 3) {
          combo.set("body", "body-nightmare");
        }
        if (bodySkin != 0) {
          currentColorVariant = genesStuff.getAxieColorsVariant(0, bodySkin, combo.get("body-class")!);
        }
      }

      combo.set("back", overridePartSample(AxiePartType.Back, combo));
      combo.set("ears", overridePartSample(AxiePartType.Ears, combo));
      combo.set("ear", combo.get("ears")!);
      combo.set("eyes", overridePartSample(AxiePartType.Eyes, combo));
      combo.set("horn", overridePartSample(AxiePartType.Horn, combo));
      combo.set("mouth", overridePartSample(AxiePartType.Mouth, combo));
      combo.set("tail", overridePartSample(AxiePartType.Tail, combo));

      builderResult.combo = combo;
      builderResult.variant = genesStuff.getAxieVariantKeyFromIndex(currentColorVariant);

      if (combo != null) {
        combo.forEach((v, k) => {
          builderResult.combo.set(k.replace("accessory-", "body-"), v.replace("accessory-", "body-"));
        });

        if (combo.has("accessory-suit-off")) {
          const bodySample = builderResult.combo.get("body")!.replace("-mystic-", "-");
          builderResult.combo.set("body", bodySample);
        }

        // hide nightmare accessory cheek2a for mystic body
        const accessoryCheek = combo.get("accessory-cheek");
        if (accessoryCheek == "accessory-cheek2a" && builderResult.combo.get("body")!.includes("-mystic-")) {
          builderResult.combo.delete("body-cheek");
        }
      }

      const jMixed = mixerStuff.generateAsset(builderResult.combo, skipAnimation);

      if (jMixed == null) {
        builderResult.error = "GenerateAsset Failed";
      } else {
        if (combo != null && combo.has("embedded-color")) {
          const variantHex = currentColorVariant.toString(16).padStart(2, "0");
          const partColorShift = genesStuff.getAxieColorPartShift(builderResult.variant);
          const slots = jMixed.slots;

          for (const slot of slots) {
            const slotWithName = slot as { name: string; color?: string };
            let isPartShift = partColorShift[0] !== "0";
            for (let i = 1; i < boneComboTypes.length; i++) {
              if (slotWithName.name.startsWith(boneComboTypes[i].toString())) {
                isPartShift = partColorShift[i] !== "0";
              }
            }
            const shiftHex = isPartShift ? "02" : "00";
            if ("color" in slotWithName) {
              slotWithName.color = variantHex + shiftHex + "00" + slotWithName.color!.substring(6);
            } else {
              slotWithName.color = variantHex + shiftHex + "00ff";
            }
          }
        }
        builderResult.skeletonDataAsset = jMixed;
      }
    } catch (error) {
      builderResult.error = (error as Error).message;
    }
  }

  return builderResult;
};

export const getVariantAttachmentPath = (
  slotName: string,
  attachmentPath: string,
  variantKey: string,
  partColorShift: string
): string => {
  let imagePath = attachmentPath.replace(".", "/");
  if (mixerStuff.variantList.indexOf(attachmentPath) != -1) {
    let isPartShift = false;
    if (partColorShift.length == 7) {
      isPartShift = partColorShift[0] !== "0";
      for (let i = 1; i < boneComboTypes.length; i++) {
        if (slotName.startsWith(boneComboTypes[i].toString())) {
          isPartShift = partColorShift[i] !== "0";
        }
      }
    }
    if (isPartShift) {
      imagePath += `/${variantKey}-shift.png`;
    } else {
      imagePath += `/${variantKey}.png`;
    }
  } else {
    imagePath += ".png";
  }
  return imagePath;
};

export const getAxieColorPartShift = (variant: string): string => {
  const partColorShift = genesStuff.getAxieColorPartShift(variant);
  return partColorShift;
};
