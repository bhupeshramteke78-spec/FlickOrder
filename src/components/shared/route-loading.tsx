export function RouteLoading() {
  return (
    <div className="route-loading-screen" role="status" aria-live="polite" aria-label="Loading page">
      <div className="route-loading-content">
        <div className="route-loading-spinner" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
        <p>Loading FlickOrder</p>
      </div>
    </div>
  );
}
