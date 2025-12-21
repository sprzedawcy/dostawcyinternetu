interface Props {
  operatorName: string;
}

export default function ServiceTab({ operatorName }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 text-center">
          <span className="text-4xl mb-3 block">⏱️</span>
          <p className="text-gray-500 text-sm mb-1">Średni czas instalacji</p>
          <p className="text-2xl font-bold text-gray-900">3-5 dni</p>
        </div>
        <div className="bg-white rounded-xl p-6 text-center">
          <span className="text-4xl mb-3 block">📞</span>
          <p className="text-gray-500 text-sm mb-1">Infolinia</p>
          <p className="text-2xl font-bold text-green-600">24/7</p>
        </div>
        <div className="bg-white rounded-xl p-6 text-center">
          <span className="text-4xl mb-3 block">💬</span>
          <p className="text-gray-500 text-sm mb-1">Czat online</p>
          <p className="text-xl font-bold text-green-600">Dostępny</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">Kontakt z {operatorName}</h3>
        <p className="text-gray-600">Szczegółowe dane kontaktowe będą dostępne wkrótce.</p>
      </div>
    </div>
  );
}
