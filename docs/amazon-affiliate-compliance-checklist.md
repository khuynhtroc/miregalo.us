# Checklist de Cumplimiento de Amazon Associates & Políticas Web (Miregalo)

Este documento detalla todos los requisitos legales, técnicos y editoriales del **Amazon Associates Program Operating Agreement**, las **Políticas del Programa de Afiliados**, y las normativas de privacidad y publicidad (FTC, RGPD, Directiva ePrivacy).

---

## 1. Identificación y Divulgación Obligatoria (Section 5 Operating Agreement & FTC)

Amazon y la FTC (Comisión Federal de Comercio) exigen que los visitantes sepan claramente que el sitio genera comisiones por enlaces de recomendación **antes** de hacer clic.

- [x] **Declaración exacta obligatoria en el pie de página (Footer)**
  - *Texto exigido por Amazon:*
    > "En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables." *(As an Amazon Associate I earn from qualifying purchases).*
  - **Ubicación:** Visible en todas las páginas del sitio web a través del pie de página global.
- [x] **Aviso destacado antes de los enlaces de afiliados (Above the Fold / Pre-Content)**
  - En cada guía de regalos o artículo de blog que contenga enlaces de recomendación, debe existir un recuadro o aviso claro cerca del inicio del contenido (antes del primer enlace).
  - *Texto recomendado:*
    > "Aviso de afiliación: Este artículo contiene recomendaciones independientes. Si compras a través de nuestros enlaces, podemos recibir una pequeña comisión sin coste adicional para ti. En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables. [Más información](/divulgacion-de-afiliados/)."
- [x] **Prohibición de alegar respaldo o patrocinio**
  - Está estrictamente prohibido afirmar o sugerir que Amazon "patrocina", "avala", "respalda" o "colabora directamente" con Miregalo.
  - No usar términos engañosos como "Socio oficial de Amazon" o "Tienda Amazon".

---

## 2. Precios y Disponibilidad (IP License Section 2(i))

Los precios en Amazon fluctúan constantemente. Mostrar un precio estático desactualizado sin advertencia es motivo frecuente de suspensión de cuenta.

- [x] **Descargo de responsabilidad de precios (Price Disclaimer)**
  - Junto a las listas o fichas de productos debe indicarse claramente:
    > "Los precios y la disponibilidad son precisos a la fecha de publicación y están sujetos a cambios. El precio mostrado en Amazon en el momento de la compra será el aplicable."
- [x] **Botones de compra con destino transparente**
  - Los botones de llamada a la acción deben indicar de forma clara la tienda de destino, p. ej.: *"Ver en Amazon"* o *"Consultar precio en Amazon"*.
- [x] **Sin rastreadores de precios no autorizados**
  - Las herramientas de alertas o seguimiento de bajadas de precio requieren aprobación expresa de Amazon.

---

## 3. Formato de Enlaces, Redirecciones y No Encubrimiento (Sections 2 & 6)

- [x] **Atributos de enlace patrocinado**
  - Todos los enlaces a Amazon deben incluir obligatoriamente los atributos:
    `rel="nofollow sponsored noopener"` y `target="_blank"`.
- [x] **Prohibición de Link Cloaking (Encubrimiento engañoso)**
  - Si se utiliza una ruta interna de redirección para métricas (p. ej. `/go/{slug}/`), el botón debe identificar claramente a Amazon y el encabezado HTTP `Referer` debe transmitirse sin bloquear para que Amazon verifique el origen legítimo del tráfico.
- [x] **Prohibición de redirección automática o trampas de cookies**
  - Nunca redirigir al visitante a Amazon automáticamente sin que haya hecho clic voluntariamente en un botón o enlace.
  - Prohibido cargar páginas de Amazon en iframes, pop-ups, pop-unders o ventanas emergentes.

---

## 4. Política de Cookies y Privacidad (GDPR, ePrivacy & Section 3(e))

Tanto el RGPD europeo como la sección 3(e) de las Políticas de Amazon exigen informar sobre el uso de cookies propias y de terceros (incluidas cookies de afiliación y analítica).

- [x] **Banner de Consentimiento de Cookies (Cookie Consent Banner)**
  - Notificación emergente visible para nuevos visitantes con opciones claras:
    - *"Aceptar todas"*
    - *"Solo esenciales"*
    - Enlace directo a la [*Política de Cookies*](/politica-de-cookies/).
  - Almacenamiento de la preferencia en `localStorage` para no saturar al usuario en visitas posteriores.
  - Opción de reabrir y modificar preferencias en cualquier momento desde el pie de página (*"Configurar cookies"*).
- [x] **Páginas legales públicas e indexables**
  - `/politica-de-privacidad/` (Responsable, derechos RGPD, cookies de terceros).
  - `/politica-de-cookies/` (Tipos de cookies técnicas, analíticas y de afiliación de Amazon).
  - `/terminos-y-condiciones/` (Condiciones de uso y exención de responsabilidad de compras externas).
  - `/divulgacion-de-afiliados/` (Explicación transparente del modelo de afiliación).

---

## 5. Reseñas, Marcas y Propiedad Intelectual (Sections 6(t) & Trademark Guidelines)

- [x] **Prohibición de copiar reseñas o estrellas de clientes de Amazon**
  - No está permitido copiar textualmente reseñas escritas por usuarios de Amazon ni simular las valoraciones de estrellas oficiales sin utilizar la Creators API / PA-API oficial.
  - Todo el contenido editorial de pros, contras y descripciones de Miregalo debe ser redacción original del equipo.
- [x] **Uso lícito de marcas comerciales de Amazon**
  - No utilizar el logotipo de Amazon modificado, estirado o con colores alterados.
  - El nombre de dominio jamás debe contener la palabra "amazon" ni derivados confusos (nuestro dominio es `miregalo.us`, 100% conforme).

---

## 6. Tráfico, Ventas Calificadas y Revisión de Cuenta (Topics G8TW5AE9XL2VX9VM & G7MJTPEP9NC3YKMG)

- [x] **Regla de las 3 ventas en 180 días**
  - Una cuenta nueva de Amazon Associates entra en período de prueba: se requieren **3 ventas válidas en 180 días** para que el equipo humano de Amazon revise y apruebe definitivamente la cuenta.
- [x] **Prohibición de compras propias o de familiares (Disqualified Purchases)**
  - Nunca realizar compras a través de tus propios enlaces de afiliados ni pedir a amigos/familiares cercanos que compren para inflar métricas. El algoritmo antifraude de Amazon detecta compras con tarjetas o direcciones coincidentes y cancela la cuenta de inmediato.
- [x] **Lista de sitios web actualizada en Associates Central**
  - En el panel de Amazon Associates (*Configuración de la cuenta -> Administrar su lista de sitios web y aplicaciones móviles*), debe estar dada de alta la URL canónica exacta:
    `https://www.miregalo.us/`
- [x] **Contenido público y de calidad (Original Content)**
  - El sitio web debe contar con al menos 10 artículos completos, públicos y sin accesos restringidos por contraseña antes de enviar la solicitud. (Miregalo cuenta con más de 1.100 guías originales indexables).
