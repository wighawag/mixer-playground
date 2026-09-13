export enum CharacterClass {
  Aquatic = "Aquatic",
  Beast = "Beast",
  Bird = "Bird",
  Bug = "Bug",
  Dawn = "Dawn",
  Dusk = "Dusk",
  Mech = "Mech",
  Plant = "Plant",
  Reptile = "Reptile",
  Any = "Any",
}

export enum AxieClassValue {
  Beast = 0,
  Bug = 1,
  Bird = 2,
  Plant = 3,
  Aquatic = 4,
  Reptile = 5,
  Mech = 16,
  Dawn = 17,
  Dusk = 18,
}

export enum BodyShape {
  BigYak = "BigYak",
  Curly = "Curly",
  Frosty = "Frosty",
  Fuzzy = "Fuzzy",
  Normal = "Normal",
  Spiky = "Spiky",
  Sumo = "Sumo",
  Wavy = "Wavy",
  WetDog = "WetDog",
  Nightmare = "Nightmare",
}

export enum AxiePartType {
  Eyes = "Eyes",
  Mouth = "Mouth",
  Ears = "Ears",
  Horn = "Horn",
  Back = "Back",
  Tail = "Tail",
}

export const axiePartTypes: AxiePartType[] = [
  AxiePartType.Eyes,
  AxiePartType.Mouth,
  AxiePartType.Ears,
  AxiePartType.Horn,
  AxiePartType.Back,
  AxiePartType.Tail,
];

export const characterClasses: CharacterClass[] = [
  CharacterClass.Beast,
  CharacterClass.Bug,
  CharacterClass.Bird,
  CharacterClass.Plant,
  CharacterClass.Aquatic,
  CharacterClass.Reptile,
  CharacterClass.Mech,
  CharacterClass.Dawn,
  CharacterClass.Dusk,
];

export interface AxiePartStructure {
  stageCap: number;
  stage: number;
  reservation: number;
  skinInheritability: boolean;
  skin: number;
  groups: Array<{
    class: CharacterClass;
    value: number;
  }>;
}

export interface AxieBodyStructure {
  class: CharacterClass;
  body: number[];
  bodySkin: number;
  primaryColors: number[];
  secondaryColors: number[];
  parts: {
    [AxiePartType.Eyes]: AxiePartStructure;
    [AxiePartType.Mouth]: AxiePartStructure;
    [AxiePartType.Ears]: AxiePartStructure;
    [AxiePartType.Horn]: AxiePartStructure;
    [AxiePartType.Back]: AxiePartStructure;
    [AxiePartType.Tail]: AxiePartStructure;
  };
}

export interface AxieBodySample {
  skin: number;
  bodyValue: number;
  mysticValue: number;
  bodyName: string;
}

export interface AxiePartSample {
  class: CharacterClass;
  partType: AxiePartType;
  partValue: number;
  skins: Array<string>;
  skinsLv2: Array<string>;
}

export enum BoneComboType {
  body = "body",
  back = "back",
  ear = "ear",
  eyes = "eyes",
  horn = "horn",
  tail = "tail",
  mouth = "mouth",
}

export const boneComboTypes: BoneComboType[] = [
  BoneComboType.body,
  BoneComboType.back,
  BoneComboType.ear,
  BoneComboType.eyes,
  BoneComboType.horn,
  BoneComboType.tail,
  BoneComboType.mouth,
];

export interface AxieSkinColor {
  key: string;
  skin: number;
  class: CharacterClass;
  colorValue: number;
  primary1: string;
  shaded1: string;
  primary2: string;
  shaded2: string;
  line: string;
  partColorShift: string;
}

export function getCharacterClassFromValue(value: number): CharacterClass {
  switch (value) {
    case AxieClassValue.Beast:
      return CharacterClass.Beast;
    case AxieClassValue.Bug:
      return CharacterClass.Bug;
    case AxieClassValue.Bird:
      return CharacterClass.Bird;
    case AxieClassValue.Plant:
      return CharacterClass.Plant;
    case AxieClassValue.Aquatic:
      return CharacterClass.Aquatic;
    case AxieClassValue.Reptile:
      return CharacterClass.Reptile;
    case AxieClassValue.Mech:
      return CharacterClass.Mech;
    case AxieClassValue.Dawn:
      return CharacterClass.Dawn;
    case AxieClassValue.Dusk:
      return CharacterClass.Dusk;
  }
  return CharacterClass.Any;
}

export const ACESSORY_SLOTS = [
  "body-air",
  "body-cheek",
  "body-ground",
  "body-hip",
  "body-neck",
];
