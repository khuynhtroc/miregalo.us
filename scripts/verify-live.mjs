async function main() {
  const res = await fetch('https://www.miregalo.us/', { cache: 'no-store' });
  const html = await res.text();
  console.log('--- LIVE HOME PAGE ---');
  console.log('Status:', res.status);
  console.log('Includes Miregalo in Title:', html.includes('Miregalo'));
  console.log('Includes miregalo-logo.png:', html.includes('miregalo-logo.png'));
  console.log('Includes favicon.png:', html.includes('favicon.png'));
  console.log('Includes google-site-verification:', html.includes('q3ZACanWRjwIhlEdAb7fksnumlaM9OHH829aq6STcnc'));
  console.log('Includes GA4 G-WRGWXTNWV3:', html.includes('G-WRGWXTNWV3'));
  console.log('Includes GTM GTM-NLLPRRXN:', html.includes('GTM-NLLPRRXN'));

  const faqsRes = await fetch('https://www.miregalo.us/faqs/', { cache: 'no-store' });
  const faqsHtml = await faqsRes.text();
  console.log('\n--- LIVE FAQS PAGE ---');
  console.log('Status:', faqsRes.status);
  console.log('Includes Preguntas Frecuentes:', faqsHtml.includes('Preguntas Frecuentes'));
  console.log('Includes Miregalo in breadcrumb:', faqsHtml.includes('Miregalo'));

  const contactRes = await fetch('https://www.miregalo.us/contacto/', { cache: 'no-store' });
  const contactHtml = await contactRes.text();
  console.log('\n--- LIVE CONTACTO PAGE ---');
  console.log('Status:', contactRes.status);
  console.log('Includes Envíanos un mensaje:', contactHtml.includes('Envíanos un mensaje'));
  console.log('Includes ContactForm:', contactHtml.includes('form-label'));
}

main().catch(console.error);
