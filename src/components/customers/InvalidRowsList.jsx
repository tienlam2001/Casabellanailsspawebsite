const InvalidRowsList = ({ rows }) => {
  if (!rows || rows.length === 0) {
    return <p className="muted" style={{ margin: 0 }}>No invalid rows — every record in the file was imported.</p>;
  }

  return (
    <div className="cdb-invalid-scroll">
      <table className="cdb-table">
        <thead>
          <tr>
            <th>Row</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.rowNumber}>
              <td>{row.rowNumber}</td>
              <td>{row.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvalidRowsList;
