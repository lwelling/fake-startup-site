import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Pipeline() {
  const [cars, setCars] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCars() {
      const snap = await getDocs(collection(db, 'pipeline'));
      const data = snap.docs.map((d) => d.data());
      setCars(data);
    }
    fetchCars();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (
      cars.length &&
      !window.confirm(
        'Uploading a new CSV will overwrite existing inventory data. Continue?'
      )
    ) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') return;
      const [headerLine, ...lines] = text.trim().split(/\r?\n/);
      const headers = headerLine.split(',');
      const data = lines.map((line) => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => {
          obj[h.trim()] = values[i]?.trim();
        });
        return obj;
      });
      setCars(data);

      const coll = collection(db, 'pipeline');
      const existing = await getDocs(coll);
      await Promise.all(existing.docs.map((d) => deleteDoc(d.ref)));
      await Promise.all(
        data.map((car) =>
          setDoc(doc(coll, car['Stock Number'] || crypto.randomUUID()), car)
        )
      );
    };
    reader.readAsText(file);
  };

  const parseBool = (value) => {
    if (typeof value === 'string') {
      const v = value.toLowerCase();
      return v === 'true' || v === 'yes';
    }
    return Boolean(value);
  };

  const getBadgeAndAction = (car) => {
    const inspection = (car['Inspection Status'] || '').toLowerCase();
    const emission = (car['Emission Status'] || '').toLowerCase();
    const hasPhoto = parseBool(car['Has Photo']);
    const exterior = car['Exterior Color'];
    const interior = car['Interior Color'];
    const price = car['Asking Price'];

    if (
      inspection === 'complete' &&
      emission === 'passed' &&
      hasPhoto &&
      exterior &&
      interior &&
      price
    ) {
      return { badge: '✅', action: null };
    }

    if (inspection !== 'complete' && inspection !== 'pending') {
      return { badge: '⚠️', action: 'Get inspected' };
    }

    if (inspection === 'complete' && emission === 'pending') {
      return { badge: '⚠️', action: 'Get Emissions' };
    }

    if (inspection === 'complete' && emission === 'passed' && !hasPhoto) {
      return { badge: '⚠️', action: 'Get photo' };
    }

    if (!exterior || !interior || !price) {
      return { badge: '⚠️', action: 'Price or color missing' };
    }

    return { badge: '', action: '' };
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Pipeline</h1>
      <label htmlFor="inventory" className="block mb-2 font-semibold">
        Upload current inventory
      </label>
      <input
        id="inventory"
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 mb-2"
      />
      <p className="text-sm text-gray-500 mb-6">
        Uploading a new CSV will overwrite existing data.
      </p>
      <ul className="space-y-2">
        {cars.map((car) => {
          const status = getBadgeAndAction(car);
          return (
            <li key={car['Stock Number']}>
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 bg-white rounded shadow hover:bg-gray-50"
                onClick={() =>
                  navigate(`/pipeline/${car['Stock Number']}`, { state: { car } })
                }
              >
                <span className="flex-1 text-left font-medium">
                  {car['Stock Number']} {car.Year} {car.Make} {car.Model}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{car.Odometer} mi</span>
                  <span className="text-sm text-gray-500">
                    {car['Days In Stock']} days
                  </span>
                  {status.action ? (
                    <span className="flex items-center text-sm text-red-600">
                      <span className="mr-1">{status.badge}</span>
                      {status.action}
                    </span>
                  ) : (
                    status.badge && (
                      <span className="text-green-600">{status.badge}</span>
                    )
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
