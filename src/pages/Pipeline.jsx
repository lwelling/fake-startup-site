import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Pipeline() {
  const [cars, setCars] = useState([]);
  const navigate = useNavigate();

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
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
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Pipeline</h1>
      <label htmlFor="inventory" className="block mb-2 font-semibold">
        Upload current inventory
      </label>
      <input
        id="inventory"
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="mb-4"
      />
      <ul className="divide-y">
        {cars.map((car) => (
          <li key={car['Stock Number']}>
            <button
              type="button"
              className="w-full flex items-center justify-between p-2 hover:bg-gray-100"
              onClick={() =>
                navigate(`/pipeline/${car['Stock Number']}`, { state: { car } })
              }
            >
              <span className="mr-2">🚗</span>
              <span className="flex-1 text-left">
                {car['Stock Number']} {car.Year} {car.Make} {car.Model}
              </span>
              <span className="mr-4">{car.Odometer} mi</span>
              <span>{car['Days In Stock']} days</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
