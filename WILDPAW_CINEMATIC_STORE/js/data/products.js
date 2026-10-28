/* WILDPAW — catálogo de demostración (datos locales, sin backend). */
window.WILDPAW = window.WILDPAW || {};

WILDPAW.categories = [
  { id: 'todos', label: 'Todos' },
  { id: 'perros', label: 'Perros' },
  { id: 'gatos', label: 'Gatos' },
  { id: 'acuaticos', label: 'Acuáticos' }
];

WILDPAW.products = [
  {
    id: 'dog-bed-cave',
    category: 'perros',
    name: 'Cama Cueva Sherpa',
    tagline: 'Refugio acolchado con forro de borrego',
    price: 64,
    image: 'assets/img/products/dog-bed-cave.webp',
    alt: 'Cama tipo cueva con forro de borrego color crema; un perro pequeño asoma desde dentro',
    badge: 'Nuevo'
  },
  {
    id: 'dog-harness',
    category: 'perros',
    name: 'Arnés Urban Trail',
    tagline: 'Ajuste ergonómico para paseos largos',
    price: 42,
    image: 'assets/img/products/dog-harness.webp',
    alt: 'Corgi sentado de perfil con collar, mirando hacia arriba con la lengua fuera'
  },
  {
    id: 'dog-collar',
    category: 'perros',
    name: 'Collar Explorer',
    tagline: 'Cuero vegetal y herrajes de acero',
    price: 36,
    image: 'assets/img/products/dog-collar.webp',
    alt: 'Pastor belga malinois sonriente con un collar de cadena'
  },
  {
    id: 'cat-tree',
    category: 'gatos',
    name: 'Rascador Torre Forest',
    tagline: 'Sisal natural y plataforma de felpa',
    price: 129,
    image: 'assets/img/products/cat-tree.webp',
    alt: 'Gato negro tumbado sobre la plataforma de un rascador de sisal, con la cola y una pata colgando',
    badge: 'Top ventas'
  },
  {
    id: 'cat-bed',
    category: 'gatos',
    name: 'Cama Confort Nido',
    tagline: 'Base elevada y cojín extraíble',
    price: 74,
    image: 'assets/img/products/cat-bed.webp',
    alt: 'Gato blanco y negro descansando en una cama elevada con estructura metálica'
  },
  {
    id: 'cat-toy',
    category: 'gatos',
    name: 'Juguete Interactivo Pluma',
    tagline: 'Varita con plumas para cazar al vuelo',
    price: 19,
    image: 'assets/img/products/cat-toy.webp',
    alt: 'Gato siamés mirando hacia arriba con mucha atención'
  },
  {
    id: 'aqua-reef',
    category: 'acuaticos',
    name: 'Acuario Nano Reef 30 L',
    tagline: 'Filtración silenciosa y luz incluida',
    price: 189,
    image: 'assets/img/fish/clownfish.webp',
    alt: 'Pez payaso naranja con bandas blancas'
  },
  {
    id: 'aqua-food',
    category: 'acuaticos',
    name: 'Alimento Tropical Premium',
    tagline: 'Escamas con espirulina y krill',
    price: 14,
    image: 'assets/img/fish/yellow-tang.webp',
    alt: 'Pez cirujano amarillo nadando de perfil'
  },
  {
    id: 'aqua-light',
    category: 'acuaticos',
    name: 'Luz Coral LED Spectrum',
    tagline: 'Ciclo día y noche programable',
    price: 89,
    image: 'assets/img/fish/copperband.webp',
    alt: 'Pez mariposa de banda cobriza con rayas naranjas y blancas',
    badge: 'Eco'
  }
];
