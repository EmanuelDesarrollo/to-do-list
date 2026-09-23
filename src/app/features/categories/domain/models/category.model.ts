// Atributos de las categorias.
export interface Category {
  id: number;
  name: string;
  color: string | null;
}

// Atributos necesarios para crear una nueva categoria.
export interface NewCategory {
  name: string;
  color: string | null;
}
