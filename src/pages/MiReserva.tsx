import { contenedor } from '@/components/estilos';
import { ConsultaReserva } from '@/components/consulta-reserva';
import { Sierra } from '@/components/ilustraciones';
import { useTitulo } from '@/lib/titulo';

export default function MiReserva() {
  useTitulo('Mi reserva');
  return (
    <main>
      <section className="bg-sierra-100">
        <div className={`${contenedor} grid gap-6 pb-6 pt-6 lg:grid-cols-12 lg:gap-12 lg:pb-12 lg:pt-14`}>
          <div className="lg:col-span-7">
            <h1 className="font-display text-[2rem] font-bold leading-[1.04] tracking-tight sm:text-6xl">Mi reserva</h1>
            <p className="mt-3 max-w-md text-base leading-7 text-stone-800 sm:mt-6 sm:text-lg">
              Ingresá el código que te dimos al reservar y el celular que dejaste.
            </p>
            <p className="mt-3 hidden max-w-md text-sm leading-6 text-stone-700 sm:block">
              Las reservas se guardan en este navegador: solo las ves desde el mismo dispositivo donde reservaste.
            </p>
          </div>
          <div className="self-start lg:col-span-5">
            <ConsultaReserva />
          </div>
        </div>
        <Sierra className="block h-auto w-full" />
      </section>
    </main>
  );
}
