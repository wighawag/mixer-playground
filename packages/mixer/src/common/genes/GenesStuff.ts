import {
  AxieBodySample,
  AxieBodyStructure,
  AxiePartSample,
  AxiePartStructure,
  AxiePartType,
  AxieSkinColor,
  axiePartTypes,
  CharacterClass,
} from "./BodyStructure";

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

interface GenesJsonData {
  items: {
    colors: Array<{
      key: string;
      skin: number;
      class: string;
      color_value: number;
      primary1: string;
      shaded1: string;
      primary2: string;
      shaded2: string;
      line: string;
      partColorShift: string;
    }>;
    bodies: Array<{
      skin: number;
      bodyValue: number;
      mysticValue: number;
      bodyName: string;
    }>;
    parts: Array<{
      class: string;
      partType: string;
      partValue: number;
      skins: string[];
      skinsLv2: string[];
    }>;
  };
}

class AxieGenesStuff {
  axieSkinColors: Array<AxieSkinColor> = [];
  bodySamples: Array<AxieBodySample> = [];
  partSamples: Array<AxiePartSample> = [];

  constructor() {}

  load(genesJson: GenesJsonData): void {
    const genesData = genesJson.items;
    const genesColor = genesData.colors;
    const genesBodies = genesData.bodies;
    const genesParts = genesData.parts;

    this.bodySamples = [];
    for (const genesBody of genesBodies) {
      const bodySample: AxieBodySample = {
        skin: genesBody["skin"],
        bodyValue: genesBody["bodyValue"],
        mysticValue: genesBody["mysticValue"],
        bodyName: genesBody["bodyName"],
      };
      this.bodySamples.push(bodySample);
    }

    this.partSamples = [];
    for (const genesPart of genesParts) {
      const skins: string[] = [];
      for (const skinName of genesPart["skins"]) {
        skins.push(skinName);
      }
      const skinsLv2: string[] = [];
      for (const skinName of genesPart["skinsLv2"]) {
        skinsLv2.push(skinName);
      }
      const partSample: AxiePartSample = {
        class: capitalizeFirstLetter(genesPart["class"]) as CharacterClass,
        partType: capitalizeFirstLetter(genesPart["partType"]) as AxiePartType,
        partValue: genesPart["partValue"],
        skins: skins,
        skinsLv2: skinsLv2,
      };
      this.partSamples.push(partSample);
    }

    this.axieSkinColors = [];
    for (const axieSkinColor of genesColor) {
      const sampleColor: AxieSkinColor = {
        key: axieSkinColor["key"],
        skin: axieSkinColor["skin"],
        class: capitalizeFirstLetter(axieSkinColor["class"]) as CharacterClass,
        colorValue: axieSkinColor["color_value"],
        primary1: axieSkinColor["primary1"],
        shaded1: axieSkinColor["shaded1"],
        primary2: axieSkinColor["primary2"],
        shaded2: axieSkinColor["shaded2"],
        line: axieSkinColor["line"],
        partColorShift: axieSkinColor["partColorShift"],
      };
      this.axieSkinColors.push(sampleColor);
    }
  }

  private getBodySample(value: number, skin: number, isMystic: boolean): string {
    let bodyIndex = -1;
    for (let i = 0; i < this.bodySamples.length; i++) {
      const bodySample = this.bodySamples[i];
      if (bodySample.skin != skin) {
        continue;
      }
      if (bodySample.mysticValue != -1 && bodySample.mysticValue != (isMystic ? 1 : 0)) {
        continue;
      }
      if (bodySample.bodyValue != -1 && bodySample.bodyValue != value) {
        continue;
      }
      bodyIndex = i;
      break;
    }
    if (bodyIndex === -1) {
      bodyIndex = 0;
    }
    return this.bodySamples[bodyIndex].bodyName;
  }

  findPart(partClass: string, partType: AxiePartType, partValue: number): AxiePartSample | null {
    const partIndex = this.partSamples.findIndex(function (x) {
      return x.class === partClass && x.partType === partType && x.partValue === partValue;
    });
    if (partIndex === -1) {
      return null;
    }
    return this.partSamples[partIndex];
  }

  findPartBySample(partType: AxiePartType, sampleName: string): AxiePartSample | null {
    const partIndex = this.partSamples.findIndex(function (x) {
      return (
        x.partType === partType &&
        (x.skins.indexOf(sampleName) != -1 || x.skinsLv2.indexOf(sampleName) != -1)
      );
    });
    if (partIndex === -1) {
      return null;
    }
    return this.partSamples[partIndex];
  }

  overridePartSample(partType: AxiePartType, sampleName: string, stage: number, skin: number): string {
    if (stage == -1 && skin == -1) {
      return sampleName;
    }
    for (let i = 0; i < this.partSamples.length; i++) {
      const p = this.partSamples[i];
      if (p.partType !== partType) {
        continue;
      }
      const lv1Skin = p.skins.indexOf(sampleName);
      const lv2Skin = p.skinsLv2.indexOf(sampleName);
      if (lv1Skin != -1 || lv2Skin != -1) {
        let finalStage = stage;
        if (finalStage == -1) {
          finalStage = lv1Skin != -1 ? 0 : 1;
        }
        let finalSkin = skin;
        if (finalSkin == -1) {
          finalSkin = lv1Skin != -1 ? lv1Skin : lv2Skin;
        }
        if (finalStage == 0) {
          return p.skins[finalSkin].length > 0 ? p.skins[finalSkin] : p.skins[0];
        } else {
          return p.skinsLv2[finalSkin].length > 0 ? p.skinsLv2[finalSkin] : p.skinsLv2[0];
        }
      }
    }
    return sampleName;
  }

  private getPartSample(partType: AxiePartType, part: AxiePartStructure): string | null {
    return this.getPartSampleCustom(partType, part, part.stage, part.skin);
  }

  getPartSampleCustom(
    partType: AxiePartType,
    part: AxiePartStructure,
    stage: number,
    skin: number
  ): string | null {
    const { class: partClass, value: partValue } = part.groups[0];
    const partSample = this.findPart(partClass, partType, partValue);
    if (partSample == null) {
      return null;
    }
    if (stage == 1) {
      if (skin >= 0 && skin < partSample.skinsLv2.length && partSample.skinsLv2[skin].length > 0) {
        return partSample.skinsLv2[skin];
      } else {
        return partSample.skinsLv2[0];
      }
    } else {
      if (skin >= 0 && skin < partSample.skins.length && partSample.skins[skin].length > 0) {
        return partSample.skins[skin];
      } else {
        return partSample.skins[0];
      }
    }
  }

  getAdultCombo(bodyStructure: AxieBodyStructure): Map<string, string> {
    const bodyValue = bodyStructure.body[0];
    const bodySkin = bodyStructure.bodySkin;
    let isMystic = false;

    if (bodySkin == 0) {
      for (const partType of axiePartTypes) {
        const part = bodyStructure.parts[partType];
        if (part.skin === 1) {
          isMystic = true;
        }
      }
    }

    const axieCombo = new Map<string, string>();
    axieCombo.set("body", this.getBodySample(bodyValue, bodySkin, isMystic));
    axieCombo.set("body-class", bodyStructure.class.toString().toLowerCase());
    axieCombo.set("back", this.getPartSample(AxiePartType.Back, bodyStructure.parts[AxiePartType.Back])!);
    axieCombo.set("ears", this.getPartSample(AxiePartType.Ears, bodyStructure.parts[AxiePartType.Ears])!);
    axieCombo.set("ear", axieCombo.get("ears")!);
    axieCombo.set("eyes", this.getPartSample(AxiePartType.Eyes, bodyStructure.parts[AxiePartType.Eyes])!);
    axieCombo.set("horn", this.getPartSample(AxiePartType.Horn, bodyStructure.parts[AxiePartType.Horn])!);
    axieCombo.set("mouth", this.getPartSample(AxiePartType.Mouth, bodyStructure.parts[AxiePartType.Mouth])!);
    axieCombo.set("tail", this.getPartSample(AxiePartType.Tail, bodyStructure.parts[AxiePartType.Tail])!);

    return axieCombo;
  }

  getAxieColorsVariant(primaryValue: number, bodySkin: number, bodyClass: string): number {
    let variantIndex = -1;
    for (let i = 0; i < this.axieSkinColors.length; i++) {
      const axieSkin = this.axieSkinColors[i];
      if (axieSkin.skin != bodySkin) {
        continue;
      }
      if (
        (axieSkin.class === CharacterClass.Any ||
          axieSkin.class.toLowerCase() === bodyClass.toLowerCase()) &&
        (axieSkin.colorValue === -1 || axieSkin.colorValue === primaryValue)
      ) {
        variantIndex = i;
        break;
      }
    }
    if (variantIndex === -1) {
      variantIndex = 0;
    }
    return variantIndex;
  }

  getAxieVariantKeyFromIndex(variantIndex: number): string {
    if (variantIndex < 0 || variantIndex >= this.axieSkinColors.length) {
      return "";
    }
    return this.axieSkinColors[variantIndex].key;
  }

  getAxieColorPartShift(variant: string): string {
    let variantIndex = this.axieSkinColors.findIndex((x) => x.key === variant);
    if (variantIndex == -1) {
      variantIndex = 0;
    }
    return this.axieSkinColors[variantIndex].partColorShift;
  }
}

export const genesStuff = new AxieGenesStuff();
