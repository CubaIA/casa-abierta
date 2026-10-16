import { Link } from 'wouter';

export default function PaymentCancel() {
  return (
    <div className="page-shell">
      <div className="empty-state">
        <h1 className="text-2xl font-extrabold text-orange-700">Pago cancelado</h1>
        <p className="mt-2 text-tinta/70">
          Has cancelado el proceso de pago. Puedes intentarlo de nuevo cuando quieras.
        </p>
        <Link href="/anfitrion" className="button-primary mt-4 inline-flex">
          Volver al panel de anfitrión
        </Link>
      </div>
    </div>
  );
}