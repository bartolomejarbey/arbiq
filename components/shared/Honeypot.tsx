/**
 * Hidden honeypot field. Lidé ji nikdy nevyplní (display:none + tabIndex=-1
 * + autoComplete=off). Spam boti vyplní každý input — silně koreluje se
 * spamem, který API silently zahodí (viz lib/spam-protection.ts).
 *
 * Vlož tento element do každého formuláře co odesílá data na náš API.
 */
export default function Honeypot() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      <label htmlFor="website_url_hp">Nevyplňujte — antispam</label>
      <input
        id="website_url_hp"
        type="text"
        name="website_url_hp"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}
