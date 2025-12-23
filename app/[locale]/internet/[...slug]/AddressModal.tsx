"use client";
import { useState, useEffect, useCallback } from "react";
import { searchStreets, searchNumbers, cityHasStreets } from "@/src/features/coverage/actions/search";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: { ulica: string; nr: string; id_ulicy: string }) => void;
  miejscowosc: string;
  simc: string;
  prefilledUlica?: { ulica: string; id_ulicy: string };
}

function sanitize(input: string): string {
  return input
    .replace(/[<>'"`;(){}[\]\\]/g, '')
    .trim()
    .slice(0, 100);
}

export default function AddressModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  miejscowosc, 
  simc,
  prefilledUlica 
}: Props) {
  const [hasStreets, setHasStreets] = useState(true);
  const [streets, setStreets] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [streetQuery, setStreetQuery] = useState('');
  const [numberQuery, setNumberQuery] = useState('');
  const [selectedStreet, setSelectedStreet] = useState<any>(prefilledUlica || null);
  const [selectedNumber, setSelectedNumber] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!simc) return;
    cityHasStreets(simc).then(setHasStreets);
  }, [simc]);

  useEffect(() => {
    if (!simc || !hasStreets || prefilledUlica) return;
    const query = sanitize(streetQuery);
    if (query.length < 2) {
      setStreets([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await searchStreets(simc, query);
        setStreets(result);
      } catch {
        setStreets([]);
      }
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [streetQuery, simc, hasStreets, prefilledUlica]);

  useEffect(() => {
    const id_ulicy = selectedStreet?.id_ulicy || (hasStreets ? null : '00000');
    if (!id_ulicy) {
      setNumbers([]);
      return;
    }
    const query = sanitize(numberQuery);
    if (query.length < 1) {
      setNumbers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await searchNumbers(id_ulicy, query);
        setNumbers(result);
      } catch {
        setNumbers([]);
      }
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [numberQuery, selectedStreet, hasStreets]);

  useEffect(() => {
    if (!isOpen) {
      if (!prefilledUlica) {
        setSelectedStreet(null);
        setStreetQuery('');
      }
      setSelectedNumber(null);
      setNumberQuery('');
      setStreets([]);
      setNumbers([]);
    }
  }, [isOpen, prefilledUlica]);

  const handleConfirm = useCallback(() => {
    if (!selectedNumber) return;
    onConfirm({
      ulica: selectedStreet?.ulica || '',
      nr: selectedNumber.nr,
      id_ulicy: selectedStreet?.id_ulicy || '00000'
    });
  }, [selectedStreet, selectedNumber, onConfirm]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const needsStreet = hasStreets && !prefilledUlica && !selectedStreet;
  const canConfirm = selectedNumber !== null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-backdrop" />
      
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal__header">
          <button onClick={onClose} className="modal__close" aria-label="Zamknij">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="modal__title">
            {prefilledUlica ? 'Podaj numer budynku' : 'Podaj dokładny adres'}
          </h2>
          <p className="modal__subtitle">Sprawdzimy dostępność oferty</p>
        </div>

        {/* Body */}
        <div className="modal__body">
          {/* Miejscowość - readonly */}
          <div className="form-readonly">
            <p className="form-readonly__label">Miejscowość</p>
            <p className="form-readonly__value">{miejscowosc}</p>
          </div>

          {/* Ulica */}
          {hasStreets && !prefilledUlica && (
            <div>
              <label className="form-label--medium">Ulica</label>
              {selectedStreet ? (
                <div className="selected-box selected-box--modal">
                  <span className="selected-box__title">{selectedStreet.ulica}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStreet(null);
                      setSelectedNumber(null);
                      setNumberQuery('');
                    }}
                    className="selected-box__remove selected-box__remove--small"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={streetQuery}
                    onChange={e => setStreetQuery(sanitize(e.target.value))}
                    placeholder="Wpisz nazwę ulicy..."
                    className="form-input form-input--modal"
                    autoComplete="off"
                  />
                  {loading && (
                    <div className="spinner-container spinner-container--modal">
                      <div className="spinner spinner--small" />
                    </div>
                  )}
                  {streets.length > 0 && (
                    <div className="dropdown dropdown--modal">
                      {streets.map((street, i) => (
                        <button
                          key={`${street.id_ulicy}-${i}`}
                          type="button"
                          onClick={() => {
                            setSelectedStreet(street);
                            setStreets([]);
                            setStreetQuery('');
                          }}
                          className="dropdown-item dropdown-item--modal"
                        >
                          <span className="dropdown-item__title">{street.ulica}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Prefilled ulica */}
          {prefilledUlica && (
            <div className="form-readonly">
              <p className="form-readonly__label">Ulica</p>
              <p className="form-readonly__value">{prefilledUlica.ulica}</p>
            </div>
          )}

          {/* Numer budynku */}
          <div>
            <label className="form-label--medium">Numer budynku</label>
            {selectedNumber ? (
              <div className="selected-box selected-box--modal">
                <span className="selected-box__value selected-box__value--modal">{selectedNumber.nr}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNumber(null);
                    setNumberQuery('');
                  }}
                  className="selected-box__remove selected-box__remove--small"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="input-wrapper">
                <input
                  type="text"
                  value={numberQuery}
                  onChange={e => setNumberQuery(sanitize(e.target.value))}
                  placeholder={needsStreet ? "Najpierw wybierz ulicę..." : "Wpisz numer..."}
                  disabled={needsStreet}
                  className="form-input form-input--modal"
                  autoComplete="off"
                />
                {loading && !needsStreet && (
                  <div className="spinner-container spinner-container--modal">
                    <div className="spinner spinner--small" />
                  </div>
                )}
                {numbers.length > 0 && (
                  <div className="number-dropdown number-dropdown--modal">
                    <div className="number-grid">
                      {numbers.map((num, i) => (
                        <button
                          key={`${num.id}-${i}`}
                          type="button"
                          onClick={() => {
                            setSelectedNumber(num);
                            setNumbers([]);
                            setNumberQuery('');
                          }}
                          className="number-grid__item"
                        >
                          {num.nr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Przycisk */}
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="btn btn-success btn-success--large"
          >
            Sprawdź dostępność
          </button>

          <p className="modal__footer">
            Podanie adresu pozwoli zweryfikować dostępność usług
          </p>
        </div>
      </div>
    </div>
  );
}