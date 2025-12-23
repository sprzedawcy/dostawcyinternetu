// Dodaj te importy
import { useMapEvents } from 'react-leaflet';
import { getOperatorBuildings } from '@/app/actions/getBuildings'; // Import nowej akcji

// ... (wewnątrz komponentu BtsMap)

// --- NOWY PODKOMPONENT DO OBSŁUGI ZDARZEŃ ---
function MapEvents({ onMoveEnd }: { onMoveEnd: (bounds: any) => void }) {
  const map = useMapEvents({
    moveend: () => {
      onMoveEnd(map.getBounds());
    },
  });
  return null;
}

// ... (w głównym komponencie BtsMap)
export default function BtsMap({ operatorName, operatorId }: { operatorName: string, operatorId?: number }) { // Dodaj prop operatorId
  const [buildings, setBuildings] = useState<any[]>([]);
  
  // Funkcja ładowania budynków
  const handleMoveEnd = async (bounds: L.LatLngBounds) => {
    // Ładuj tylko przy dużym zoomie (np. > 13)
    // Tutaj uproszczenie - sprawdzamy po prostu czy operatorId jest dostępny
    if (!operatorId) return;

    const data = await getOperatorBuildings(operatorId, {
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLon: bounds.getWest(),
      maxLon: bounds.getEast()
    });
    setBuildings(data);
  };

  // ... (reszta kodu) ...

  return (
    <MapContainer ... >
      {/* ... warstwy ... */}
      
      <MapEvents onMoveEnd={handleMoveEnd} />

      {/* Rysowanie budynków (inny kolor, np. zielony) */}
      {buildings.map((b, idx) => (
         <CircleMarker 
           key={`b-${idx}`} 
           center={[b.lat, b.lon]} 
           radius={6}
           pathOptions={{ color: 'green', fillColor: '#10b981', fillOpacity: 0.8 }}
         >
           <Popup>
             <strong>Zasięg Światłowodowy!</strong><br/>
             {b.miejscowosc}, {b.ulica} {b.nr}
           </Popup>
         </CircleMarker>
      ))}

      {/* ... (Twoje markery BTS) ... */}
    </MapContainer>
  )
}