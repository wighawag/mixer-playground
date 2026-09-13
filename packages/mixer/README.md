# @axieinfinity/mixer

TypeScript source package for Axie Infinity Mixer - a library for generating Axie spine animations from genes.

## Installation

```bash
npm install @axieinfinity/mixer
# or
pnpm add @axieinfinity/mixer
# or
yarn add @axieinfinity/mixer
```

## Usage

```typescript
import {
  initAxieMixer,
  getAxieSpineFromGenes,
  getAxieSpineFromCombo,
  getAxieColorPartShift,
  getVariantAttachmentPath,
} from '@axieinfinity/mixer';

// Import the data files
import GenesData from '@axieinfinity/mixer/data/axie-2d-v3-stuff-genes.json';
import SamplesData from '@axieinfinity/mixer/data/axie-2d-v3-stuff-samples.json';
import VariantsData from '@axieinfinity/mixer/data/axie-2d-v3-stuff-variant.json';
import AnimationsData from '@axieinfinity/mixer/data/axie-2d-v3-stuff-animations.json';

// Initialize the mixer
initAxieMixer(GenesData, SamplesData, VariantsData, AnimationsData);

// Generate Axie spine from genes
const axieGene = "0x..."; // Your axie gene string
const result = getAxieSpineFromGenes(axieGene, null);

if (result.error) {
  console.error(result.error);
} else {
  // Use result.skeletonDataAsset for rendering
  console.log(result.skeletonDataAsset);
  console.log(result.variant);
  console.log(result.combo);
}
```

## API

### `initAxieMixer(GenesData, SamplesData, VariantsData, AnimationsData)`

Initialize the mixer with the required data files. Must be called before using other functions.

### `getAxieSpineFromGenes(gene, meta, skipAnimation?)`

Generate an Axie spine from a gene string.

- `gene`: The 512-bit gene string (hex format)
- `meta`: Optional Map of metadata overrides
- `skipAnimation`: Optional boolean to skip animation generation (default: false)

Returns an `AxieBuilderResult` with:
- `error`: Error message if failed
- `skeletonDataAsset`: The generated skeleton data
- `combo`: Map of body parts
- `variant`: The color variant key

### `getAxieSpineFromCombo(combo, colorVariant, skipAnimation?)`

Generate an Axie spine from a predefined combo.

### `getVariantAttachmentPath(slotName, attachmentPath, variantKey, partColorShift)`

Get the file path for a variant attachment image.

### `getAxieColorPartShift(variant)`

Get the part color shift string for a variant.

## Data Files

The package includes the following data files in the `data/` directory:
- `axie-2d-v3-stuff-genes.json` - Gene parsing data
- `axie-2d-v3-stuff-samples.json` - Skeleton sample data
- `axie-2d-v3-stuff-variant.json` - Variant data
- `axie-2d-v3-stuff-animations.json` - Animation data (full)
- `axie-2d-v3-stuff-animations_lite.json` - Animation data (lite version)

## Types

The package exports the following types:

- `CharacterClass` - Enum for Axie classes
- `AxiePartType` - Enum for body part types
- `AxieBodyStructure` - Interface for parsed body structure
- `AxieBuilderResult` - Interface for builder result
- `MixedSkeletonData` - Interface for generated skeleton data

## License

MIT
