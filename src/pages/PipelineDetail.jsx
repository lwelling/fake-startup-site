import { useLocation, useNavigate } from 'react-router-dom';

export default function PipelineDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const car = state?.car;

  if (!car) {
    return (
      <div className="p-4">
        <p>No vehicle data.</p>
        <button
          type="button"
          className="mt-4 underline"
          onClick={() => navigate('/pipeline')}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Stock {car['Stock Number']}</h1>
      <ul className="list-disc pl-5">
        {Object.entries(car).map(([key, value]) => (
          <li key={key}>
            <strong>{key}:</strong> {value}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-4 underline"
        onClick={() => navigate('/pipeline')}
      >
        Back
      </button>
    </div>
  );
}
