/** Кнопки выгрузки журнала действий в CSV (открывается в Excel). */
export const AuditExport = () => (
  <div className="jet-audit-export">
    <span className="jet-muted">Выгрузить в CSV:</span>
    {[7, 30, 90, 365].map((d) => (
      <a key={d} className="jet-btn jet-btn--light" href={`/cms-api/audit-log/export?days=${d}`}>
        {d === 365 ? 'за год' : `${d} дней`}
      </a>
    ))}
  </div>
)
