import { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  ImageOff,
  Languages,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  UtensilsCrossed,
  Wifi,
  X,
} from 'lucide-react';
import type { Business, Review } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { firstPhoto, resolvePhotos } from '@/lib/images';
import { formatPrice } from '@/components/BusinessCard';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { adminGetUserAvatarUrl } from '@/lib/avatars';
import { supabase } from '@/lib/supabase';

import {
  createReport,
  createRequest,
  getBusiness,
  listFavoriteIds,
  listReviews,
  toggleFavorite,
  SERVICE_TYPES,
} from '@/lib/marketplace';


const RESERVA_ROSA = 'bg-[#FF385C] hover:bg-[#E31C5F]';

const AMENITY_ICONS = [BedDouble, Bath, Wifi, UtensilsCrossed, Users, Languages, MapPin, Sparkles];

export default function BusinessDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [, navigate] = useLocation();
  const { userId, profile } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewerAvatars, setReviewerAvatars] = useState<Record<string, string | null>>({});
  const [favorite, setFavorite] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [avatarLoadError, setAvatarLoadError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const [requestOpen, setRequestOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [serviceRequested, setServiceRequested] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);

  /* Hooks de la galería SIEMPRE en la parte superior: nunca después de un
   * early return. Si se declaran tras `if (status...) return`, React lanza
   * el error #310 ("Rendered more hooks than during the previous render")
   * y la página queda en blanco. */
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [fotoActual, setFotoActual] = useState<number | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const b = await getBusiness(id);
      if (!b) {
        setStatus('error');
        setErrorMessage('No encontramos ese negocio. Puede que haya sido retirado del catálogo.');
        return;
      }
      setBusiness(b);
      const reviewsList = await listReviews(id);
      setReviews(reviewsList);
      if (userId && reviewsList.length > 0) {
        const owners = new Set<string>(reviewsList.map((r) => r.reviewer_id));
        const fetched: Record<string, string | null> = {};
        if (supabase) {
          for (const ownerId of owners) {
            try {
              fetched[ownerId] = await adminGetUserAvatarUrl(ownerId);
            } catch {
              fetched[ownerId] = null;
            }
          }
        }
        setReviewerAvatars(fetched);
        setAvatarLoadError(null);
      }
      if (userId) {
        const ids = await listFavoriteIds(userId);
        setFavorite(ids.includes(id));
      }
      setStatus('ready');
    } catch (e) {
      setStatus('error');
      setErrorMessage(e instanceof Error ? e.message : 'Error cargando el negocio');
    }
  }, [id, userId]);

  useEffect(() => {
    if (!id) return;
    void load();
  }, [id, load]);

  useEffect(() => {
    if (!business?.name) return;
    document.title = `${business.name} | Casa Abierta Cuba`;
  }, [business?.name]);

  async function onFavorite() {
    if (!userId) {
      navigate('/entrar');
      return;
    }
    try {
      const next = await toggleFavorite(userId, id);
      setFavorite(next);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'No se pudo actualizar el favorito');
    } finally {
      // Consistencia local rápida aunque el servidor falle en algún entorno:
      // volvemos a calcular el estado desde el backend cuando hay sesión.
      if (userId && business) {
        try {
          const ids = await listFavoriteIds(userId);
          setFavorite(ids.includes(id));
        } catch {
          /* sin efecto */
        }
      }
    }
  }

  async function onShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: business?.name ?? 'Casa Abierta Cuba', url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      /* el usuario canceló el diálogo o el portapapeles no está disponible */
    }
  }

  function onReservar() {
    if (!userId) {
      navigate('/entrar');
      return;
    }
    setRequestOpen(true);
    requestAnimationFrame(() => {
      document.getElementById('solicitar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function onRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !profile) {
      navigate('/entrar');
      return;
    }
    setRequestError(null);
    if (message.trim().length < 10) {
      setRequestError('Cuéntanos un poco más (mínimo 10 caracteres).');
      return;
    }
    setSending(true);
    try {
      await createRequest({
        requesterId: userId,
        businessId: id,
        message: message.trim(),
        serviceRequested: serviceRequested || business?.service_type || '',
        contactEmail: profile.email,
      });
      setSent(true);
      setMessage('');
    } catch (e) {
      setRequestError(e instanceof Error ? e.message : 'No se pudo enviar la solicitud');
    } finally {
      setSending(false);
    }
  }

  async function onReport(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      navigate('/entrar');
      return;
    }
    try {
      await createReport({ reporterId: userId, targetType: 'business', targetId: id, reason: reportReason.trim() });
      setReportSent(true);
      setReportReason('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo enviar el reporte');
    }
  }

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="h-[280px] animate-pulse rounded-2xl bg-azul/10 sm:h-[420px]" />
        <div className="mt-6 h-8 w-2/3 animate-pulse rounded-full bg-azul/10" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-azul/10" />
        <span className="sr-only">Cargando ficha…</span>
      </div>
    );
  }

  if (status === 'error' || !business) {
    return (
      <div className="page-shell">
        <p className="form-error" role="alert">{errorMessage}</p>
        <button className="button-ghost mt-4" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Volver al catálogo
        </button>
      </div>
    );
  }

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const favoritoEntreHuespedes = avg !== null && avg >= 4.8;
  const tipoLabel =
    SERVICE_TYPES.find((s) => s.value === business?.service_type)?.label ??
    (business?.service_type ?? '').charAt(0).toUpperCase() + (business?.service_type ?? '').slice(1);
  const precio = formatPrice(business) ?? 'Consultar';
  const unidad = business.service_type === 'alojamiento' ? 'por noche' : 'precio orientativo';
  const foto = firstPhoto(business, { skipFirstLogoWhenAvailable: true });
  const fotosValidas = resolvePhotos(business);
  const miniaturas = fotosValidas.slice(0, 4);
  const hayGaleria = fotosValidas.length > 1;

  /* Datos de Supabase blindados: cualquier campo puede venir null/vacío.
   * Todos los split/join trabajan sobre strings o arrays ya validados. */
  const nombreCompuesto = String(business?.host_name ?? business?.name ?? '');
  const iniciales = nombreCompuesto
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const detalles = String(business?.experience_details ?? '');
  const idiomas = Array.isArray(business?.languages) ? business.languages : [];
  const recomendados = Array.isArray(business?.recommended_for) ? business.recommended_for : [];
  const servicio = (business?.service_type ?? '').toLowerCase();
  const descripcion = (business?.description ?? '').trim();
  const esGastronomia = servicio === 'gastronomia' || servicio === 'gastronomía' || servicio === 'gastronomia-restaurante';
  const schedule = (business?.schedule ?? '').trim();
  const textoLoQueDebesSaber =
    esGastronomia && schedule
      ? schedule
      : 'Horario: Consultar directamente con el anfitrión';
  const subtitulo = [
    `${tipoLabel} en ${business.municipality || '—'}, ${business.province || '—'}`,
    (recomendados.length > 0 ? `Ideal para ${recomendados.join(', ')}` : null) ?? null,
  ]
    .filter(Boolean)
    .join(' · ');
  const amenidades = [
    ...detalles.split('·').map((s) => s.trim()),
    ...idiomas.map((l) => `Habla ${l}`),
    ...recomendados.map((r) => `Ideal para ${r}`),
  ].filter(Boolean);


  function abrirGaleriaEn(indice: number) {
    setFotoActual(indice);
    setGaleriaAbierta(true);
  }

  function cerrarGaleria() {
    setGaleriaAbierta(false);
    setFotoActual(null);
  }

  function fotoPrevia() {
    if (fotoActual === null) return;
    setFotoActual((fotoActual > 0 ? fotoActual - 1 : fotosValidas.length - 1));
  }

  function fotoSiguiente() {
    if (fotoActual === null) return;
    setFotoActual((fotoActual < fotosValidas.length - 1 ? fotoActual + 1 : 0));
  }  function seccionGaleria() {
    if (!business) return null;
    return (
      <section className="mt-5" aria-label="Galería de fotos">
        <div className="flex items-center gap-3">
          <p className="text-sm font-extrabold text-azul">Fotos del anuncio</p>
          {hayGaleria && (
            <span className="text-xs text-tinta/60">
              {fotosValidas.length} fotos
            </span>
          )}

        </div>

        {miniaturas.length === 0 ? (
          <div className="mt-3 flex h-40 items-center justify-center rounded-2xl border border-dashed border-arena-2 bg-azul-50 text-sm text-tinta/50">
            {ImageOff && <ImageOff size={20} className="mr-2" />}
            Sin fotos disponibles
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-4">
            {miniaturas.map((url, i) => (
              <button
                key={`${business.id}-${i}-${url}`}
                type="button"
                onClick={() => abrirGaleriaEn(i)}
                className={`group relative overflow-hidden rounded-xl bg-azul-700 border border-arena-2 disabled:opacity-50 ${i === 0 ? 'ring-2 ring-azul ring-offset-2' : ''}`}
                aria-label={`Ver foto ${i + 1}`}
              >
                {url ? (
                  <img
                    src={url}
                    alt={`Foto ${i + 1} de ${business.name}`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full place-items-center text-white/60">
                    <ImageOff size={20} />
                  </div>
                )}
                {i === 0 && (
                  <span className="absolute left-1.5 bottom-1.5 rounded-full bg-azul/80 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white sr-only sm:not-sr-only">
                    Portada
                  </span>
                )}
              </button>
            ))}
            {hayGaleria && (
              <button
                type="button"
                onClick={() => abrirGaleriaEn(miniaturas.length)}
                className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-arena-2 bg-white/60 text-center text-sm text-tinta/60 transition hover:bg-white hover:border-arena"
                aria-label={`Ver resto de fotos (${fotosValidas.length - miniaturas.length} más)`}
              >
                {fotosValidas.length - miniaturas.length} más
              </button>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-40 pt-3 md:pb-28">
      {/* ---------------------------------------------------------- */}
      {/* Galería superior                                            */}
      {/* ---------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-2xl bg-azul-700 sm:rounded-3xl">
        <div className="h-[300px] w-full sm:h-[420px]">
          {foto ? (
            <img src={foto} alt={`Foto de ${business.name}`} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-azul to-azul-700 text-white/70">
              <ImageOff size={44} aria-hidden />
            </div>
          )}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent"
        />

        <button
          type="button"
          onClick={() => navigate('/')}
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 text-sm font-semibold text-azul shadow transition hover:bg-white"
        >
          <ArrowLeft size={17} aria-hidden /> Volver
        </button>

        <div className="absolute right-3 top-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void onShare()}
            aria-label="Compartir esta publicación"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-azul shadow transition hover:bg-white"
          >
            {copiado ? <Check size={18} aria-hidden /> : <Share2 size={18} aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => void onFavorite()}
            aria-pressed={favorite}
            aria-label={favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-azul shadow transition hover:bg-white"
          >
            <Heart size={18} aria-hidden className={favorite ? 'fill-[#FF385C] text-[#FF385C]' : ''} />
          </button>
        </div>
        {copiado && (
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-white">
            Enlace copiado
          </p>
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Información principal                                       */}
      {/* ---------------------------------------------------------- */}
      <div className="mt-5">
        <h1 className="text-2xl font-extrabold text-azul sm:text-3xl">{business.name || 'Negocio'}</h1>
        <p className="mt-1 text-tinta/70">{subtitulo}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1 font-bold text-tinta">
            <Star size={14} className="fill-tinta" aria-hidden />
            {avg !== null ? avg.toFixed(2) : 'Nuevo'}
          </span>
          {avg !== null && (
            <span className="flex items-center gap-0.5 text-dorado" aria-hidden>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={13} className={i < Math.round(avg) ? 'fill-dorado' : 'opacity-25'} />
              ))}
            </span>
          )}
          <span className="text-tinta/60">
            · {reviews.length} reseña{reviews.length === 1 ? '' : 's'}
          </span>
          {favoritoEntreHuespedes && (
            <span className="inline-flex items-center gap-1 rounded-full bg-arena px-2.5 py-1 text-xs font-bold text-azul-700">
              <Sparkles size={12} aria-hidden /> Favorito entre huéspedes
            </span>
          )}
          {(business?.lgbt_friendly ?? false) && (
            <span className="rounded-full bg-verde/10 px-2.5 py-1 text-xs font-bold text-verde-700">
              LGBTQ+ friendly
            </span>
          )}
        </div>
      </div>

      <hr className="my-6 border-arena-2" />

      {/* Anfitrión */}
      <div className="flex items-center gap-4">
        <div
          aria-hidden
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-azul text-lg font-extrabold text-white"
        >
          {iniciales || 'CA'}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-azul">Anfitrión: {business.host_name || 'Equipo Casa Abierta'}</p>
          <p className="text-sm text-tinta/70">
            {(business?.verified ?? false) || favoritoEntreHuespedes ? 'SuperAnfitrión' : 'Anfitrión local'} · Casa Abierta Cuba
          </p>
          <p className="text-xs text-tinta/55">
            Índice de respuesta: rápido · Responde por la plataforma
          </p>
        </div>
      </div>

      <hr className="my-6 border-arena-2" />        {/* Descripción y amenidades */}
      <section>
        <h2 className="text-lg font-extrabold text-azul">Sobre este lugar</h2>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-tinta/85">{(business?.description ?? '').trim() || ''}</p>


        {amenidades.length > 0 && (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {amenidades.map((a, i) => {
              const Icon = AMENITY_ICONS[i % AMENITY_ICONS.length];
              return (
                <li key={`${a}-${i}`} className="flex items-start gap-3 text-sm text-tinta/80">
                  <Icon size={19} aria-hidden className="mt-0.5 shrink-0 text-azul-600" />
                  <span>{a}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Secciones desplegables                                      */}
      {/* ---------------------------------------------------------- */}
      <div className="mt-8 divide-y divide-arena-2 border-y border-arena-2">
        <Desplegable titulo="Conoce al anfitrión" abierto>
          <p className="leading-relaxed text-tinta/85">{business.host_story || ''}</p>
          {business.experience_details && (
            <p className="mt-3 leading-relaxed text-tinta/75">{business.experience_details}</p>
          )}
          <p className="mt-3 text-sm text-tinta/60">
            <Languages size={14} aria-hidden className="mr-1 inline" />
            {idiomas.length > 0 ? `Idiomas: ${idiomas.join(', ')}` : 'Idiomas: español'}
          </p>
        </Desplegable>

        <Desplegable titulo="Lo que debes saber">
          <div className="rounded-xl border border-arena-2 bg-white p-4">
            <div className="space-y-3 text-sm text-tinta/85">
              {esGastronomia && schedule && (
                <p className="leading-relaxed">{schedule}</p>
              )}
              {!esGastronomia || (!descripcion && !schedule) ? (
                <p className="leading-relaxed text-tinta/70">
                  Aprovecha al máximo tu visita. Llegada después de las 15:00, salida antes de las 11:00 y sin fiestas ni eventos.
                </p>
              ) : null}
              {esGastronomia && !schedule && descripcion && (
                <p className="leading-relaxed text-tinta/70">
                  Horario: Consultar directamente con el anfitrión
                </p>
              )}
            </div>
          </div>
        </Desplegable>

        <Desplegable titulo="A dónde irás">
          <div className="relative h-52 overflow-hidden rounded-xl border border-arena-2 bg-[#e8eef2]">
            <div
              aria-hidden
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  'linear-gradient(#c9d8e2 1px, transparent 1px), linear-gradient(90deg, #c9d8e2 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-1 rounded-xl bg-white/90 px-4 py-3 text-center shadow">
                <MapPin size={22} aria-hidden className="text-terracota-600" />
                <p className="text-sm font-bold text-azul">
                  {business.municipality}, {business.province}
                </p>
                <p className="text-xs text-tinta/60">La ubicación exacta se comparte al confirmar la solicitud</p>
              </div>
            </div>
          </div>
        </Desplegable>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Reseñas                                                     */}
      {/* ---------------------------------------------------------- */}
      <section className="mt-8" aria-label="Reseñas">
        {avatarLoadError && (
          <p className="mb-2 text-xs text-terracota-700" role="status">
            No se pudieron cargar algunas fotos de los reseñantes.
          </p>
        )}
        <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-azul">
          <Star size={18} className="fill-azul" aria-hidden />
          {avg !== null ? `${avg.toFixed(2)} · ` : ''}
          {reviews.length} reseña{reviews.length === 1 ? '' : 's'}
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-tinta/60">
            Aún no hay reseñas. Las reseñas se escriben al completar una solicitud.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-arena-2 bg-white p-4">
                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    avatarUrl={reviewerAvatars[r.reviewer_id] ?? null}
                    userId={r.reviewer_id}
                    size={36}
                    upload={false}
                  />
                  <div>
                    <p className="text-sm font-semibold text-azul">{r.comment ? 'Anónimo' : 'Viajero'}</p>
                    <div className="flex items-center gap-0.5 text-dorado" aria-label={`${r.rating} de 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={13} className={i < r.rating ? 'fill-dorado' : 'opacity-25'} />
                      ))}
                    </div>
                    <p className="mt-1.5 text-sm text-tinta/80">{r.comment || 'Reseña breve'}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Reserva / solicitud                                         */}
      {/* ---------------------------------------------------------- */}
      <section id="solicitar" className="mt-8 scroll-mt-24 rounded-2xl border border-arena-2 bg-white p-5 sm:p-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-azul">
          <CalendarCheck size={18} aria-hidden /> Solicita tu reserva
        </h2>
        <p className="mt-1 text-sm text-tinta/65">
          Envía tu consulta al anfitrión. Casa Abierta registra la solicitud y facilita la conexión; la coordinación
          del pago se acuerda directamente con el anfitrión.
        </p>

        {!userId && (
          <div className="mt-4">
            <p className="text-sm text-tinta/70">Necesitas una cuenta para guardar favoritos y enviar solicitudes.</p>
            <button className="button-primary mt-2 w-full justify-center sm:w-auto" onClick={() => navigate('/entrar')}>
              Entrar o registrarme
            </button>
          </div>
        )}

        {userId && sent && (
          <p className="form-success mt-4">
            ¡Solicitud enviada! Sigue su estado en <strong>Mis solicitudes</strong>.
          </p>
        )}

        {userId && !sent && !requestOpen && (
          <button className="button-primary mt-4 w-full justify-center sm:w-auto" onClick={() => setRequestOpen(true)}>
            Enviar solicitud
          </button>
        )}

        {userId && !sent && requestOpen && (
          <form onSubmit={onRequest} className="mt-4 space-y-3">
            <div>
              <label className="field-label" htmlFor="req-service">¿Qué necesitas?</label>
              <select
                id="req-service"
                className="field-input"
                value={serviceRequested}
                onChange={(e) => setServiceRequested(e.target.value)}
              >
                <option value="">Selecciona un servicio</option>
                {SERVICE_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="req-message">Mensaje para el anfitrión</label>
              <textarea
                id="req-message"
                className="field-input"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Fechas, cantidad de personas, qué buscas…"
              />
              <p className="field-hint">
                Tu correo ({profile?.email}) se guarda con la solicitud para que el equipo pueda gestionarla; no se
                muestra públicamente.
              </p>
            </div>
            {requestError && <p className="form-error" role="alert">{requestError}</p>}
            <button className="button-primary w-full justify-center" disabled={sending} type="submit">
              {sending ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </form>
        )}
      </section>

      {/* Reportar */}
      <div className="mt-6">
        <button
          className="inline-flex items-center gap-1 text-sm font-semibold text-terracota-600 hover:underline"
          onClick={() => setReportOpen((v) => !v)}
        >
          <Flag size={14} /> Reportar esta publicación
        </button>
        {reportOpen &&
          (reportSent ? (
            <p className="form-success">Reporte enviado. El equipo de Casa Abierta lo revisará.</p>
          ) : (
            <form onSubmit={onReport} className="panel mt-3">
              <label className="field-label" htmlFor="report-reason">¿Qué está mal en esta publicación?</label>
              <textarea
                id="report-reason"
                className="field-input"
                rows={3}
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe el problema (fotos engañosas, datos falsos, etc.)"
              />
              <button className="button-primary mt-3" type="submit">Enviar reporte</button>
            </form>
          ))}
      </div>

      {errorMessage && status === 'ready' && (
        <p className="form-error mt-4" role="alert">{errorMessage}</p>
      )}

      {seccionGaleria()}

      {/* Galería modal ligera */}
      {galeriaAbierta && fotoActual !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galería de fotos de ${business?.name ?? ''}`}
          className="fixed inset-0 z-50 bg-black/90 p-4 backdrop-blur-sm"
          onClick={cerrarGaleria}
        >
          <button
            type="button"
            onClick={cerrarGaleria}
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 text-sm font-semibold text-azul shadow transition hover:bg-white"
            aria-label="Cerrar galería"
          >
            <X size={16} />
            Cerrar
          </button>

          <div
            className="relative mx-auto w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {fotosValidas.length === 0 ? (
              <div className="mx-auto h-[70vh] flex items-center justify-center text-white/70">
                <ImageOff size={40} className="mb-3" />
                <p className="text-sm">Sin fotos disponibles</p>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl bg-azul-900">
                  {fotoActual > 0 && (
                    <button
                      type="button"
                      onClick={fotoPrevia}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-azul shadow transition hover:bg-white"
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}

                  <img
                    src={fotosValidas[fotoActual]}
                    alt={`Foto ${fotoActual + 1} de ${business?.name ?? ''}`}
                    className="h-[70vh] w-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = '0.3';
                    }}
                  />

                  {fotoActual < fotosValidas.length - 1 && (
                    <button
                      type="button"
                      onClick={fotoSiguiente}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-azul shadow transition hover:bg-white"
                      aria-label="Foto siguiente"
                    >
                      <ChevronRight size={20} />
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <p className="text-tinta/70">
                    Foto {fotoActual + 1} de {fotosValidas.length}
                  </p>
                  <button
                    type="button"
                    onClick={cerrarGaleria}
                    className="rounded-full bg-white/90 px-4 py-1.5 text-azul font-semibold shadow transition hover:bg-white"
                  >
                    <X size={14} />
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sección desplegable                                                 */
/* ------------------------------------------------------------------ */

function Desplegable({
  titulo,
  abierto = false,
  children,
}: {
  titulo: string;
  abierto?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="group py-4" open={abierto}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-extrabold text-azul">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck size={17} aria-hidden className="text-azul-600" />
          {titulo}
        </span>
        <ChevronDown
          size={20}
          aria-hidden
          className="shrink-0 text-tinta/50 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="mt-3 text-sm">{children}</div>
    </details>
  );
}
