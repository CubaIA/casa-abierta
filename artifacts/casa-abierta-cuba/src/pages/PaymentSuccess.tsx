import { Link } from 'wouter';

export default function PaymentSuccess() {
  return (
    <div className="page-shell">
      <div className="empty-state">
        <h1 className="text-2xl font-extrabold text-green-700">¡Pago completado!</h1>
        <p className="mt-2 text-tinta/70">
          Tu pago se ha procesado correctamente. Gracias por tu confianza.
        </p>
        <Link href="/" className="button-primary mt-4 inline-flex">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}