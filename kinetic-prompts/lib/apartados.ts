/**
 * Apartados de Animaciones (y del constructor), en el orden en que se recorren.
 * Sin fs: se puede usar en el servidor y en el cliente.
 */
export const APARTADOS = [
  {
    id: "fondos",
    label: "Fondos",
    description: "Fondos vivos para el hero o para toda la web: ruido, color en movimiento, partículas.",
  },
  {
    id: "transiciones",
    label: "Transiciones de página",
    description: "Cómo se pasa de una página a otra: fundidos, cortinas, persianas y más.",
  },
  {
    id: "texto",
    label: "Letras",
    description: "Titulares y párrafos que se revelan, se dividen o se descifran.",
  },
  {
    id: "heros",
    label: "Heros",
    description: "La primera pantalla: tipografía animada, vídeo enmascarado, objeto 3D.",
  },
  {
    id: "scroll",
    label: "Scroll",
    description: "Lo que pasa al bajar: secciones fijas, parallax, scroll horizontal.",
  },
  {
    id: "microinteracciones",
    label: "Microinteracciones",
    description: "Detalles al pasar el ratón o al pulsar: botones magnéticos, cursores.",
  },
  {
    id: "3d-webgl",
    label: "3D / WebGL",
    description: "Escenas con WebGL: productos en 3D, shaders, configuradores.",
  },
] as const;

export type ApartadoId = (typeof APARTADOS)[number]["id"];
