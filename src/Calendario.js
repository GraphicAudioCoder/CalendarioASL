import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function formatDate(date) {
  // Ritorna yyyy-mm-dd in locale, correggendo il fuso orario
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().split("T")[0];
}

function Calendario() {
  const [eventi, setEventi] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [ora, setOra] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [utente, setUtente] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = "https://script.google.com/macros/s/AKfycbwhc0UFGo5IOpAojdAvPhba8C2m_AuLfkuRyv6C1uPKF_-_a7_RfHc84vJCy0995e6a/exec";

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setEventi)
      .catch(() => setEventi([]));
  }, []);

  const dataSelezionata = formatDate(selectedDate);
  const eventiGiorno = eventi.filter(ev => ev.data === dataSelezionata);

  const aggiungiEvento = async (e) => {
    e.preventDefault();
    if (loading) return;
    // Controlla se esiste già un evento con la stessa ora
    if (eventiGiorno.some(ev => ev.ora === ora)) {
      alert("Esiste già un evento per questa ora.");
      return;
    }
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("data", dataSelezionata);
      formData.append("ora", ora);
      formData.append("descrizione", descrizione);
      formData.append("utente", utente);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
      });

      if (!res.ok) throw new Error(`Errore HTTP: ${res.status}`);

      setOra(""); setDescrizione(""); setUtente("");

      const resGet = await fetch(API_URL);
      const nuoviEventi = await resGet.json();
      setEventi(nuoviEventi);
    } catch (error) {
      alert("Errore durante l'invio dell'evento: " + error.message);
    }
    setLoading(false);
  };

  // Rimuovi evento (richiede conferma)
  const rimuoviEvento = async (evento) => {
    if (!window.confirm(`Vuoi davvero eliminare questo evento?\n\nOra: ${evento.ora}\nDescrizione: ${evento.descrizione}\nUtente: ${evento.utente}`)) {
      return;
    }
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("action", "delete");
      formData.append("data", evento.data);
      formData.append("ora", evento.ora);
      formData.append("descrizione", evento.descrizione);
      formData.append("utente", evento.utente);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
      });

      if (!res.ok) throw new Error(`Errore HTTP: ${res.status}`);

      // Aggiorna la lista eventi dopo la rimozione
      const resGet = await fetch(API_URL);
      const nuoviEventi = await resGet.json();
      setEventi(nuoviEventi);
    } catch (error) {
      alert("Errore durante la rimozione: " + error.message);
    }
    setLoading(false);
  };

  function tileClassName({ date, view }) {
    if (view === "month") {
      const d = formatDate(date);
      if (eventi.some(ev => ev.data === d)) {
        return "has-event";
      }
    }
    return null;
  }

  return (
    <div className="calendario-root">
      <h2>Calendario Condiviso ASL</h2>
      <div className="calendar-container">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileClassName={tileClassName}
          locale="it-IT"
        />
      </div>
      <div className="eventi-container">
        <h3>Eventi del {dataSelezionata}</h3>
        {eventiGiorno.length === 0 ? (
          <div className="no-eventi">Nessun evento per questa data.</div>
        ) : (
          <table className="eventi-table">
            <thead>
              <tr>
                <th>Ora</th><th>Descrizione</th><th>Utente</th><th></th>
              </tr>
            </thead>
            <tbody>
              {eventiGiorno.map((ev, i) => (
                <tr key={i}>
                  <td>{ev.ora}</td>
                  <td>{ev.descrizione}</td>
                  <td>{ev.utente}</td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => rimuoviEvento(ev)}
                      disabled={loading}
                      title="Rimuovi evento"
                    >🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <form className="aggiungi-form" onSubmit={aggiungiEvento}>
        <h4>Aggiungi evento per il {dataSelezionata}</h4>
        <input type="time" value={ora} onChange={e => setOra(e.target.value)} required />
        <input type="text" placeholder="Descrizione" value={descrizione} onChange={e => setDescrizione(e.target.value)} required />
        <input type="text" placeholder="Utente" value={utente} onChange={e => setUtente(e.target.value)} required />
        <button type="submit" disabled={loading}>
          {loading ? "Attendi..." : "Aggiungi Evento"}
        </button>
      </form>
      <style>{`
        body, .calendario-root {
          background: #181c24;
          color: #e0e6ed;
          font-family: 'Poppins', Arial, Helvetica, sans-serif;
          min-height: 100vh;
        }
        .calendario-root {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px 0 64px 0;
        }
        h2 {
          color: #7ecbff;
          font-weight: 600;
          text-align: center;
          margin-bottom: 32px;
        }
        .calendar-container {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }
        .react-calendar {
          background: #232a36;
          border-radius: 16px;
          border: 1.5px solid #2d3a4a;
          color: #e0e6ed;
          font-size: 22px;
          box-shadow: 0 2px 16px #0002;
          padding: 16px 8px;
          width: 100%;
          max-width: 520px;
          min-width: 380px;
        }
        .react-calendar__navigation {
          display: flex;
          height: 48px;
          margin-bottom: 1em;
        }
        .react-calendar__navigation button {
          min-width: 44px;
          background: none;
          color: #7ecbff;
          font-size: 1.3em;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          transition: background 0.2s, color 0.2s;
        }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background: #263445;
          color: #e0e6ed;
        }
        .react-calendar__navigation__label {
          color: #e0e6ed;
          font-size: 1.25em;
          font-weight: 600;
        }
        .react-calendar__month-view__weekdays {
          font-size: 1.1em;
        }
        .react-calendar__tile {
          border-radius: 8px;
          transition: background 0.2s, color 0.2s;
          color: #e0e6ed !important;
          font-size: 1.15em;
        }
        .react-calendar__tile--now {
          background: #263445 !important;
          color: #7ecbff !important;
        }
        .react-calendar__tile--active,
        .react-calendar__tile:focus {
          background: #1761a0 !important;
          color: #fff !important;
        }
        .react-calendar__tile:hover {
          background: #1761a0 !important;
          color: #fff !important;
        }
        .has-event {
          background: #1761a0 !important;
          color: #fff !important;
          border-radius: 50% !important;
        }
        .eventi-container {
          margin: 32px 0 24px 0;
        }
        .eventi-table {
          width: 100%;
          background: #232a36;
          color: #e0e6ed;
          border-radius: 10px;
          border: 1.2px solid #2d3a4a;
          box-shadow: 0 2px 8px #0002;
          overflow: hidden;
        }
        .eventi-table th, .eventi-table td {
          padding: 12px 8px;
          text-align: left;
        }
        .eventi-table th {
          background: #232a36;
          color: #7ecbff;
          font-weight: 600;
          border-bottom: 1px solid #2d3a4a;
        }
        .eventi-table tr:not(:last-child) td {
          border-bottom: 1px solid #2d3a4a;
        }
        .remove-btn {
          background: none;
          border: none;
          color: #e74c3c;
          font-size: 1.3em;
          cursor: pointer;
          padding: 2px 8px;
          border-radius: 6px;
          transition: background 0.2s;
        }
        .remove-btn:hover {
          background: #2d3a4a;
        }
        .no-eventi {
          color: #7ecbff;
          padding: 16px 0;
        }
        .aggiungi-form {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          background: #232a36;
          border-radius: 10px;
          padding: 18px 12px;
          border: 1.2px solid #2d3a4a;
          box-shadow: 0 2px 8px #0002;
        }
        .aggiungi-form input {
          background: #232a36;
          color: #e0e6ed;
          border: 1.2px solid #2d3a4a;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 16px;
          margin: 2px 0;
        }
        .aggiungi-form input:focus {
          outline: none;
          border-color: #7ecbff;
        }
        .aggiungi-form button {
          background: #232a36;
          color: #7ecbff;
          border: 1.5px solid #2d3a4a;
          border-radius: 8px;
          padding: 8px 20px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border 0.2s;
        }
        .aggiungi-form button:hover {
          background: #263445;
          color: #e0e6ed;
          border: 1.5px solid #7ecbff;
        }
      `}</style>
    </div>
  );
}

export default Calendario;
