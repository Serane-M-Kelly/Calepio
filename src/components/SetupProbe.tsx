import { useState } from 'react';

/** Temporary integration probe, to remove when the product interface is built. */
export default function SetupProbe() {
  const [checked, setChecked] = useState(false);
  return (
    <section aria-labelledby="setup-heading">
      <h2 id="setup-heading">Contrôle du socle</h2>
      <button type="button" onClick={() => setChecked(true)}>
        Vérifier l’interaction
      </button>
      <p role="status">{checked ? 'Interaction vérifiée.' : 'Interaction à vérifier.'}</p>
    </section>
  );
}
