import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const privacyAdSenseSection = `
      <h2>4. Publicidad de Terceros y Google AdSense</h2>
      <p>Este sitio web utiliza <strong>Google AdSense</strong>, un servicio de publicidad prestado por Google Ireland Limited ("Google"). Google AdSense utiliza cookies (incluida la cookie de Google DoubleClick) para publicar anuncios basados en las visitas anteriores de los usuarios a este sitio web o a otros sitios de Internet.</p>
      <p>El uso de cookies de publicidad permite a Google y a sus socios comerciales mostrar anuncios relevantes a los visitantes en función de sus hábitos de navegación en nuestra web y en otros portales en la red.</p>
      <p><strong>Control y Desactivación de Publicidad Personalizada:</strong></p>
      <ul>
        <li>Los usuarios pueden inhabilitar en cualquier momento la publicidad personalizada accediendo a la herramienta oficial de <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Configuración de Anuncios de Google</a>.</li>
        <li>Asimismo, pueden optar por inhabilitar el uso de cookies de terceros para publicidad basada en intereses visitando la plataforma independiente <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">www.aboutads.info</a> o la iniciativa europea <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer">Your Online Choices</a>.</li>
        <li>Para conocer a fondo el tratamiento de datos y tecnologías de Google en sitios web asociados, consulta la <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">Política de Privacidad y Términos de Publicidad de Google</a>.</li>
      </ul>
`;

const cookieAdSenseItem = `
        <li><strong>Cookies publicitarias y de personalización (Google AdSense):</strong> Gestionadas por Google y sus socios publicitarios para mostrar anuncios pertinentes a los usuarios, limitar el número de veces que se ve un mismo anuncio y medir la eficacia de las campañas. Puedes inhabilitar la publicidad personalizada en cualquier momento desde <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Configuración de Anuncios de Google</a> o en <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">AboutAds.info</a>.</li>
`;

async function updatePolicies() {
  console.log('=== CẬP NHẬT CHÍNH SÁCH BẢO MẬT & COOKIES THEO CHUẨN ADSENSE ===\n');

  // 1. Update politica-de-privacidad
  const { data: priv } = await sb.from('posts').select('id, content_html').eq('slug', 'politica-de-privacidad').single();
  if (priv && !priv.content_html.includes('Google AdSense')) {
    let updatedHtml = priv.content_html;
    if (updatedHtml.includes('<h2>4. Enlaces de Afiliados')) {
      updatedHtml = updatedHtml.replace('<h2>4. Enlaces de Afiliados', `${privacyAdSenseSection}\n      <h2>5. Enlaces de Afiliados`);
      updatedHtml = updatedHtml.replace('<h2>5. Conservación de los Datos', '<h2>6. Conservación de los Datos');
      updatedHtml = updatedHtml.replace('<h2>6. Tus Derechos como Usuario', '<h2>7. Tus Derechos como Usuario');
      updatedHtml = updatedHtml.replace('<h2>7. Modificaciones de esta Política', '<h2>8. Modificaciones de esta Política');
    } else {
      updatedHtml = updatedHtml + '\n' + privacyAdSenseSection;
    }

    const { error: privErr } = await sb.from('posts').update({
      content_html: updatedHtml,
      updated_at: new Date().toISOString(),
    }).eq('id', priv.id);

    if (privErr) console.error('Lỗi cập nhật politica-de-privacidad:', privErr.message);
    else console.log('✓ Đã cập nhật điều khoản Google AdSense vào /politica-de-privacidad/!');
  } else {
    console.log('- /politica-de-privacidad/ đã có điều khoản AdSense.');
  }

  // 2. Update politica-de-cookies
  const { data: cook } = await sb.from('posts').select('id, content_html').eq('slug', 'politica-de-cookies').single();
  if (cook && !cook.content_html.includes('Google AdSense')) {
    let updatedHtml = cook.content_html;
    if (updatedHtml.includes('</ul>')) {
      updatedHtml = updatedHtml.replace('</ul>', `${cookieAdSenseItem}      </ul>`);
    } else {
      updatedHtml = updatedHtml + '\n' + cookieAdSenseItem;
    }

    const { error: cookErr } = await sb.from('posts').update({
      content_html: updatedHtml,
      updated_at: new Date().toISOString(),
    }).eq('id', cook.id);

    if (cookErr) console.error('Lỗi cập nhật politica-de-cookies:', cookErr.message);
    else console.log('✓ Đã cập nhật điều khoản Google AdSense vào /politica-de-cookies/!');
  } else {
    console.log('- /politica-de-cookies/ đã có điều khoản AdSense.');
  }
}

updatePolicies().catch(console.error);
