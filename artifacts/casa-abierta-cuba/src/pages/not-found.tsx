import { Link } from 'wouter';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="page-shell grid place-items-center py-20 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-azul-200 text-azul">
          <Compass size={30} />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-azul">Página no encontrada</h1>
        <p className="mt-2 text-tinta/70">
          El enlace que buscas no existe o cambió de dirección. Volvamos al catálogo.
        </p>
        <Link href="/" className="button-primary mt-5 inline-flex">
          Explorar Casa Abierta
        </Link>
      </div>
    </div>
  );
}
