const nailModules = import.meta.glob('../assets/nails/*.{png,jpg,jpeg,webp}', { eager: true });
const interiorModules = import.meta.glob('../assets/interior/*.{png,jpg,jpeg,webp}', { eager: true });

const mapImgs = (mods) =>
  Object.entries(mods).map(([path, module]) => ({
    src: module.default,
    alt: path.split('/').pop()?.split('.')[0].replace(/[-_]/g, ' ') || 'gallery image',
  }));

const CATEGORY_IMAGES = {
  Nails: mapImgs(nailModules),
  Interior: mapImgs(interiorModules),
};

const getDefaultGallery = () =>
  Object.entries(CATEGORY_IMAGES).flatMap(([category, list]) =>
    list.map((item) => ({ ...item, category }))
  );

export { getDefaultGallery };
