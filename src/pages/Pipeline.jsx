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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
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

    if (inspection === 'pending') {
      return { badge: '⏳', action: 'In recon' };
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

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedCars = [...cars].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key] || '';
    const bVal = b[sortConfig.key] || '';
    const aNum = parseFloat(aVal);
    const bNum = parseFloat(bVal);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    }
    const comp = String(aVal).localeCompare(String(bVal));
    return sortConfig.direction === 'asc' ? comp : -comp;
  });

  const carsWithStatus = sortedCars.map((car) => ({
    car,
    status: getBadgeAndAction(car),
  }));

  const actionItems = carsWithStatus.filter(
    ({ status }) => status.action && status.action !== 'In recon'
  );

  const sortIcon = (key) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Pipeline</h1>
      {actionItems.length > 0 && (
        <div className="mb-6 p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Action Items</h2>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {actionItems.map(({ car, status }) => (
              <li key={car['Stock Number']}>
                <span className="font-medium">
                  {car['Stock Number']} {car.Year} {car.Make} {car.Model}
                </span>
                : {status.action}
              </li>
            ))}
          </ul>
        </div>
      )}
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
      <div className="space-y-4 md:hidden">
        {carsWithStatus.map(({ car, status }) => (
          <div
            key={car['Stock Number']}
            className="bg-white rounded shadow p-4 cursor-pointer"
            onClick={() =>
              navigate(`/pipeline/${car['Stock Number']}`, { state: { car } })
            }
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">
                {car['Stock Number']} {car.Year} {car.Make} {car.Model}
              </h3>
              {status.badge && (
                <span
                  className={status.action ? 'text-red-600' : 'text-green-600'}
                >
                  {status.badge}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-700">
              <p>
                <span className="font-medium">Odometer:</span> {car.Odometer} mi
              </p>
              <p>
                <span className="font-medium">Days in Stock:</span>{' '}
                {car['Days In Stock']} days
              </p>
              {status.action && (
                <p className="text-red-600 mt-2">{status.action}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <table className="hidden w-full bg-white rounded shadow md:table">
        <thead>
          <tr>
            <th
              className="px-4 py-2 text-left cursor-pointer"
              onClick={() => handleSort('Stock Number')}
            >
              Stock # {sortIcon('Stock Number')}
            </th>
            <th
              className="px-4 py-2 cursor-pointer"
              onClick={() => handleSort('Year')}
            >
              Year {sortIcon('Year')}
            </th>
            <th
              className="px-4 py-2 cursor-pointer"
              onClick={() => handleSort('Make')}
            >
              Make {sortIcon('Make')}
            </th>
            <th
              className="px-4 py-2 cursor-pointer"
              onClick={() => handleSort('Model')}
            >
              Model {sortIcon('Model')}
            </th>
            <th
              className="px-4 py-2 text-right cursor-pointer"
              onClick={() => handleSort('Odometer')}
            >
              Odometer {sortIcon('Odometer')}
            </th>
            <th
              className="px-4 py-2 text-right cursor-pointer"
              onClick={() => handleSort('Days In Stock')}
            >
              Days {sortIcon('Days In Stock')}
            </th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {carsWithStatus.map(({ car, status }) => (
            <tr
              key={car['Stock Number']}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() =>
                navigate(`/pipeline/${car['Stock Number']}`, { state: { car } })
              }
            >
              <td className="px-4 py-2 font-medium">{car['Stock Number']}</td>
              <td className="px-4 py-2">{car.Year}</td>
              <td className="px-4 py-2">{car.Make}</td>
              <td className="px-4 py-2">{car.Model}</td>
              <td className="px-4 py-2 text-right">{car.Odometer} mi</td>
              <td className="px-4 py-2 text-right">
                {car['Days In Stock']} days
              </td>
              <td className="px-4 py-2">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
