import { ref } from "vue";
import {
  REGIONES,
  comunasByRegion,
  regionForComuna,
  normalize,
} from "@/data/chileRegiones.js";

// Lógica compartida para los selectores de dirección Región -> Comuna en cascada.
// `getAddress` debe devolver el objeto reactivo de dirección (con `.region` y `.commune`).
//
// Uso en un componente:
//   const addr = useChileAddress(() => local.address);
//   <q-select :options="addr.regionOptions.value" @filter="addr.filterRegion" @update:model-value="addr.onRegionChange" />
export function useChileAddress(getAddress) {
  const regionOptions = ref([...REGIONES]);
  const comunaOptions = ref(comunasByRegion(getAddress()?.region));

  function filterRegion(val, update) {
    update(() => {
      const needle = normalize(val);
      regionOptions.value = needle
        ? REGIONES.filter((r) => normalize(r).includes(needle))
        : [...REGIONES];
    });
  }

  function filterComuna(val, update) {
    update(() => {
      const base = comunasByRegion(getAddress()?.region);
      const needle = normalize(val);
      comunaOptions.value = needle
        ? base.filter((c) => normalize(c).includes(needle))
        : base;
    });
  }

  // Al cambiar la región: si se elige otra región y la comuna actual no pertenece, se limpia.
  // (Limpiar la región no borra la comuna; solo reabre todas las opciones.)
  function onRegionChange(region) {
    const addr = getAddress();
    comunaOptions.value = comunasByRegion(region);
    if (region && addr.commune && regionForComuna(addr.commune) !== region) {
      addr.commune = "";
    }
  }

  // Al elegir comuna: autocompletar la región correspondiente.
  function onComunaChange(comuna) {
    const addr = getAddress();
    const region = regionForComuna(comuna);
    if (region && region !== addr.region) {
      addr.region = region;
      comunaOptions.value = comunasByRegion(region);
    }
  }

  return {
    regionOptions,
    comunaOptions,
    filterRegion,
    filterComuna,
    onRegionChange,
    onComunaChange,
  };
}
