import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function PipelineDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { stockNumber } = useParams();
  const [car, setCar] = useState(state?.car || null);

  useEffect(() => {
    async function fetchCar() {
      if (!car && stockNumber) {
        const snap = await getDoc(doc(db, 'pipeline', stockNumber));
        if (snap.exists()) setCar(snap.data());
      }
    }
    fetchCar();
  }, [car, stockNumber]);

  if (!car) {
    return (
      <div className="max-w-3xl mx-auto p-4">
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
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white shadow rounded p-6">
        <h1 className="text-3xl font-bold mb-6">
          Stock {car['Stock Number']}
        </h1>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {Object.entries(car).map(([key, value]) => (
            <div key={key} className="flex">
              <dt className="w-1/2 font-medium text-gray-700">{key}</dt>
              <dd className="flex-1 text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6">
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => navigate('/pipeline')}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
