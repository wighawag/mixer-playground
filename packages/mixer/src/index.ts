// Avatar exports
export { exportAvatarLayers, AvatarLayersOptions } from "./Avatar";

// Builder exports
export {
  AxieBuilderResult,
  getAxieColorPartShift,
  getAxieSpineFromCombo,
  getAxieSpineFromGenes,
  getVariantAttachmentPath,
  initAxieMixer,
} from "./Builder";

// BodyStructure exports
export {
  CharacterClass,
  AxieClassValue,
  BodyShape,
  AxiePartType,
  axiePartTypes,
  characterClasses,
  AxiePartStructure,
  AxieBodyStructure,
  AxieBodySample,
  AxiePartSample,
  BoneComboType,
  boneComboTypes,
  AxieSkinColor,
  getCharacterClassFromValue,
  ACESSORY_SLOTS,
} from "./common/genes/BodyStructure";

// GenesParser exports
export { getAxieBodyStructure512 } from "./common/genes/GenesParser";

// GenesStuff exports
export { genesStuff } from "./common/genes/GenesStuff";

// MixerStuff exports
export { mixerStuff } from "./common/samples/MixerStuff";

// SampleSkeletonData exports
export {
  SampleSkeletonData,
  MixedSkeletonData,
  BoneEntry,
  SlotEntry,
  SkinEntry,
  IkEntry,
  EventsMap,
  KeyAnimationsMap,
} from "./common/samples/SampleSkeletonData";

// SampleAnimationData exports
export { AnimationHeader, SampleAnimationData } from "./common/samples/SampleAnimationData";

// SplatSkeletonMixer exports
export {
  isBodySample,
  getSampleName,
  addCustomBoneRule,
  mixEntriesFromSample,
  mixSkins,
  mix,
} from "./axie-mixing/SplatSkeletonMixer";
