'use client';

import { useState } from 'react';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Consulta general');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate instantaneous contact submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  if (submitted) {
    return (
      <div
        style={{
          marginTop: '32px',
          padding: '32px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '16px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>✉️</span>
        <h3 style={{ margin: '0 0 8px', color: '#065f46', fontSize: '1.4rem' }}>
          ¡Mensaje enviado con éxito!
        </h3>
        <p style={{ margin: 0, color: '#047857', fontSize: '1rem', lineHeight: 1.6 }}>
          Muchas gracias por contactar con <strong>Miregalo</strong>, <strong>{name}</strong>. Hemos recibido tu consulta y nuestro equipo te responderá a <strong>{email}</strong> en menos de 24-48 horas laborables.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setMessage('');
          }}
          className="button"
          style={{ marginTop: '20px' }}
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: '32px',
        padding: '32px',
        background: '#ffffff',
        border: '1px solid var(--line, #e2e8f0)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
      }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', color: '#171a35' }}>
        Envíanos un mensaje
      </h3>
      <p style={{ margin: '0 0 24px', fontSize: '0.92rem', color: '#69707d' }}>
        Completa el siguiente formulario y nos pondremos en contacto contigo lo antes posible.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Nombre completo *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre o empresa"
            className="form-input"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.95rem',
            }}
          />
        </div>

        <div>
          <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Correo electrónico *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="form-input"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.95rem',
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
          Motivo de la consulta *
        </label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="form-select"
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.95rem',
            background: '#ffffff',
          }}
        >
          <option value="Consulta general">Consulta general</option>
          <option value="Sugerencia de idea de regalo">Sugerencia de idea de regalo</option>
          <option value="Propuesta de colaboración de marca">Propuesta de colaboración de marca</option>
          <option value="Reportar enlace o error en la web">Reportar enlace o error en la web</option>
          <option value="Prensa y medios">Prensa y medios</option>
        </select>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
          Mensaje *
        </label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe aquí los detalles de tu consulta..."
          className="form-input"
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          🔒 Tus datos están protegidos según nuestra Política de Privacidad.
        </span>
        <button
          type="submit"
          disabled={loading}
          className="button"
          style={{ minWidth: '160px' }}
        >
          {loading ? 'Enviando...' : 'Enviar mensaje →'}
        </button>
      </div>
    </form>
  );
}
